import { DTNQueueItem, DTNOutbox, VoteRecord, NetworkStatus } from "./types";
import { STORAGE_KEYS } from "./constants";

/**
 * DTN (Durable Transaction Network) Manager
 * 
 * Handles offline-first vote submission queue. Votes are stored locally
 * and submitted to blockchain when network becomes available.
 * 
 * This ensures voting experience isn't interrupted by temporary network issues.
 */

class DTNManager {
  private dtnOutbox: DTNOutbox;
  private networkStatus: NetworkStatus = NetworkStatus.OFFLINE;
  private syncIntervalId?: NodeJS.Timeout;
  private onSyncCallback?: () => void;

  constructor() {
    this.dtnOutbox = this.loadOutbox();
    this.setupNetworkListener();
  }

  /**
   * ==========================================
   * CORE QUEUE OPERATIONS
   * ==========================================
   */

  /**
   * Add a vote to the DTN queue
   * This happens after vote is encrypted but before blockchain submission
   */
  addVoteToQueue(vote: VoteRecord): DTNQueueItem {
    const queueItem: DTNQueueItem = {
      id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vote,
      status: "pending",
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    this.dtnOutbox.items.push(queueItem);
    this.dtnOutbox.pendingCount = this.dtnOutbox.items.filter(
      (item) => item.status === "pending" || item.status === "submitted"
    ).length;

    this.saveOutbox();
    this.logEvent(
      "Vote queued",
      `Added vote from ${vote.voterAadhaar.substring(0, 4)}... for candidate ${vote.candidateId}`
    );

    return queueItem;
  }

  /**
   * Get all pending items in queue
   */
  getPendingItems(): DTNQueueItem[] {
    return this.dtnOutbox.items.filter((item) => item.status === "pending");
  }

  /**
   * Get queue item by ID
   */
  getQueueItem(id: string): DTNQueueItem | undefined {
    return this.dtnOutbox.items.find((item) => item.id === id);
  }

  /**
   * Get all items (for admin dashboard display)
   */
  getAllItems(): DTNQueueItem[] {
    return this.dtnOutbox.items;
  }

  /**
   * ==========================================
   * QUEUE ITEM STATUS UPDATES
   * ==========================================
   */

  /**
   * Mark item as submitted to blockchain
   */
  markAsSubmitted(id: string): DTNQueueItem | null {
    const item = this.getQueueItem(id);
    if (!item) return null;

    item.status = "submitted";
    item.submittedAt = new Date().toISOString();
    item.retryCount += 1;

    this.saveOutbox();
    this.logEvent("Vote submitted", `Queue item ${id} sent to blockchain`);

    return item;
  }

  /**
   * Mark item as confirmed on blockchain
   */
  markAsConfirmed(id: string, signature: string): DTNQueueItem | null {
    const item = this.getQueueItem(id);
    if (!item) return null;

    item.status = "confirmed";
    item.confirmationSignature = signature;

    this.updatePendingCount();
    this.saveOutbox();
    this.logEvent(
      "Vote confirmed",
      `Queue item ${id} confirmed with signature ${signature.substring(0, 8)}...`
    );

    return item;
  }

  /**
   * Mark item as failed
   */
  markAsFailed(id: string, errorMessage: string): DTNQueueItem | null {
    const item = this.getQueueItem(id);
    if (!item) return null;

    item.status = "failed";
    item.errorMessage = errorMessage;
    item.lastRetryAt = new Date().toISOString();

    // Don't update pendingCount yet - may be retried
    this.saveOutbox();
    this.logEvent("Vote failed", `Queue item ${id}: ${errorMessage}`);

    return item;
  }

  /**
   * Retry a failed item
   */
  retryItem(id: string): DTNQueueItem | null {
    const item = this.getQueueItem(id);
    if (!item || item.status !== "failed") return null;

    // Reset to pending, increment retry count
    if (item.retryCount < 3) {
      item.status = "pending";
      item.retryCount += 1;
      item.errorMessage = undefined;
      this.saveOutbox();
      this.logEvent("Vote retry", `Queue item ${id} retrying (attempt ${item.retryCount})`);
      return item;
    }

    return null; // Max retries exceeded
  }

  /**
   * Remove item from queue (after successful confirmation)
   */
  removeItem(id: string): boolean {
    const index = this.dtnOutbox.items.findIndex((item) => item.id === id);
    if (index === -1) return false;

    this.dtnOutbox.items.splice(index, 1);
    this.updatePendingCount();
    this.saveOutbox();

    return true;
  }

  /**
   * Clear all confirmed items
   */
  clearConfirmedItems(): number {
    const initialLength = this.dtnOutbox.items.length;
    this.dtnOutbox.items = this.dtnOutbox.items.filter(
      (item) => item.status !== "confirmed"
    );

    const removedCount = initialLength - this.dtnOutbox.items.length;
    this.updatePendingCount();
    this.saveOutbox();

    this.logEvent("Queue cleanup", `Removed ${removedCount} confirmed items`);

    return removedCount;
  }

  /**
   * ==========================================
   * QUEUE STATISTICS
   * ==========================================
   */

  /**
   * Get queue statistics
   */
  getStats() {
    const stats = {
      total: this.dtnOutbox.items.length,
      pending: 0,
      submitted: 0,
      confirmed: 0,
      failed: 0,
    };

    this.dtnOutbox.items.forEach((item) => {
      (stats as any)[item.status] = ((stats as any)[item.status] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get queue summary for UI display
   */
  getSummary(): string {
    const stats = this.getStats();
    return `Pending: ${stats.pending} | Submitted: ${stats.submitted} | Confirmed: ${stats.confirmed} | Failed: ${stats.failed}`;
  }

  /**
   * ==========================================
   * NETWORK STATUS
   * ==========================================
   */

  /**
   * Set network status
   */
  setNetworkStatus(status: NetworkStatus): void {
    const wasOffline =
      this.networkStatus === NetworkStatus.OFFLINE ||
      this.networkStatus === NetworkStatus.CHECKING;
    const isNowOnline = status === NetworkStatus.ONLINE;

    this.networkStatus = status;
    this.dtnOutbox.networkStatus = status;
    this.saveOutbox();

    // Trigger sync when coming back online
    if (wasOffline && isNowOnline) {
      this.logEvent("Network restored", "Triggering DTN queue sync");
      if (this.onSyncCallback) {
        this.onSyncCallback();
      }
    }
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.networkStatus === NetworkStatus.ONLINE;
  }

  /**
   * Check if has pending items
   */
  hasPending(): boolean {
    return this.getPendingItems().length > 0;
  }

  /**
   * ==========================================
   * PERSISTENCE
   * ==========================================
   */

  /**
   * Load outbox from localStorage
   */
  private loadOutbox(): DTNOutbox {
    if (typeof window === "undefined") {
      return {
        items: [],
        networkStatus: NetworkStatus.OFFLINE,
        pendingCount: 0,
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DTN_OUTBOX);
      if (!stored) {
        return {
          items: [],
          networkStatus: NetworkStatus.OFFLINE,
          pendingCount: 0,
        };
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error("Failed to load DTN outbox:", error);
      return {
        items: [],
        networkStatus: NetworkStatus.OFFLINE,
        pendingCount: 0,
      };
    }
  }

  /**
   * Save outbox to localStorage
   */
  private saveOutbox(): void {
    if (typeof window === "undefined") return;

    try {
      this.dtnOutbox.lastSyncTime = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.DTN_OUTBOX, JSON.stringify(this.dtnOutbox));
    } catch (error) {
      console.error("Failed to save DTN outbox:", error);
    }
  }

  /**
   * ==========================================
   * UTILITIES
   * ==========================================
   */

  /**
   * Update pending count
   */
  private updatePendingCount(): void {
    this.dtnOutbox.pendingCount = this.dtnOutbox.items.filter(
      (item) => item.status === "pending" || item.status === "submitted"
    ).length;
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    if (typeof window === "undefined") return;

    // Initial status check
    this.setNetworkStatus(
      navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE
    );

    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.setNetworkStatus(NetworkStatus.ONLINE);
    });

    window.addEventListener("offline", () => {
      this.setNetworkStatus(NetworkStatus.OFFLINE);
    });
  }

  /**
   * Register callback for when network comes back online
   */
  onSyncRequired(callback: () => void): void {
    this.onSyncCallback = callback;
  }

  /**
   * Log event for debugging
   */
  private logEvent(event: string, details: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[DTN ${timestamp}] ${event}: ${details}`);
  }

  /**
   * Export queue for debugging
   */
  exportQueue(): string {
    return JSON.stringify(this.dtnOutbox, null, 2);
  }

  /**
   * Clear all queue items (dev/testing only)
   */
  clearAll(): void {
    this.dtnOutbox.items = [];
    this.dtnOutbox.pendingCount = 0;
    this.saveOutbox();
    this.logEvent("Queue cleared", "All items removed (dev/testing)");
  }
}

// Create singleton instance
let dtnManagerInstance: DTNManager | null = null;

/**
 * Get singleton DTN Manager instance
 */
export function getDTNManager(): DTNManager {
  if (!dtnManagerInstance) {
    dtnManagerInstance = new DTNManager();
  }
  return dtnManagerInstance;
}

/**
 * Export types for use
 */
export { DTNQueueItem, DTNOutbox };
