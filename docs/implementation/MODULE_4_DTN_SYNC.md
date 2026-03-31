# Module 4: DTN Forwarding Implementation Guide

## 1. Objective
To monitor the local network status. When the connection to the internet is re-established, intercept the `pending` votes from the DTN outbox and automatically push them to the Solana Blockchain.

## 2. Tech Stack
- React.js (Hooks)
- `react-router-dom` (Housed at a secure `/analytics` or `/dashboard` master route)
- Solana Web3.js (`sendAndConfirmRawTransaction`)

## 3. Step-by-Step Implementation

### Step 3.1: Network Listener Hook (`useNetworkListener.js`)
- Implement a custom React hook leveraging the browser's native `navigator.onLine` and window `online`/`offline` event listeners.
- Toggle an internal state between `true` and `false`. This can also encompass a manual "Simulate Offline Mode" toggle for testing purposes.

### Step 3.2: Sync Processor (`dtnSync.js`)
- Trigger a sync loop every time `isOnline` switches to `true`.
- **Fetch Queue:** Retrieve all objects marked `pending` from `dtn_outbox`.
- **Send Transactions:** For each pending transaction:
  1. Deserialize the Base64 signed transaction.
  2. Broadcast via `connection.sendRawTransaction(txBase64)`.
  3. Wait for network confirmation `connection.confirmTransaction(txHash)`.

### Step 3.3: Robust Retry & Status Strategy
- **Success:** Update the status of the item in `dtn_outbox` to `confirmed`.
- **Failure:** If RPC rate limit hit or timeout, increment a `retry_count`. Delay (e.g. 5 seconds), and retry. After `MAX_RETRIES`, flip status to `failed`.

### Step 3.4: Dashboard UI (`DTNSync.jsx`)
- Build a Dashboard showing DTN Statistics:
  - Total Queued
  - Currently Syncing (Progress Bar)
  - Synced successfully
  - Failed Syncs
- Include a manual "Sync Now" button in case automatic sync fires while network is still patchy.

## 4. Verification & Testing
- ✅ Go offline, cast 2 votes. Both go to DTN.
- ✅ Turn Wi-Fi back on. Check dashboard. Both should sync and hit `confirmed`.
- ✅ Disconnect Wi-Fi *during* the sync process: gracefully handles failure and preserves state.