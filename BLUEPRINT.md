# 🚀 MVP Developer Blueprint: ROFV (Resilient Offline-First Voting)

**Project Goal:** To build a fully functional prototype of the ROFV architecture, proving that offline cryptographic voting (via Durable Nonces), ZK-Privacy, and Simulated DTN can work together seamlessly on the Solana blockchain.

**Tech Stack (Required):**
* **Frontend:** React.js / Next.js (For Admin Panel & Voter Kiosk UI)
* **ZK-Privacy:** `circom` (for circuit) & `snarkjs` (for generating/verifying proofs in browser)
* **Blockchain:** Solana Web3.js & Anchor Framework (Rust) for Smart Contracts.
* **Network:** Solana Devnet.

---

## 🟢 Module 1: The Admin Panel (Whitelist & Setup)

**Objective:** Bypass the need for physical biometric scanners. The Admin (You) will pre-approve dummy Aadhaar numbers to create the "Merkle Tree" of eligible voters.

**UI Elements:**
1. Text Input: `Enter Voter Aadhaar (e.g., 123456)`
2. Button: `[Add to Whitelist]`
3. Button: `[Generate Election Merkle Root]`

**Developer Logic:**
* App ek local array maintain karegi: `whitelist = ["123456", "987654", "112233"]`.
* Jab aap Generate dabayenge, code `circomlibjs` ka `Poseidon Hash` use karke in numbers ko hash karega aur ek **Merkle Tree** banayega.
* Is Tree ka **Merkle Root** (ek long alphanumeric string) Solana Smart Contract par as a "Public Variable" save kar diya jayega. (Yeh prove karega ki list lock ho chuki hai).

**Deliverables:**
- [ ] Whitelist input form
- [ ] Local state management for voters
- [ ] Merkle Tree generation using circomlibjs
- [ ] Display Merkle Root
- [ ] Store root on Solana contract

---

## 🟠 Module 2: The Polling Booth (Privacy Layer)

**Objective:** Voter aayega, apna ID dalega, aur system bina uski identity reveal kiye ZK-Proof banayega.

**UI Elements:**
1. Text Input: `Enter Your Aadhaar ID`
2. Button: `[Verify Identity]`

**Developer Logic:**
* Jab voter ID dalta hai, frontend check karta hai ki kya yeh ID `whitelist` array mein hai.
* **If NO:** Show error *"Not an eligible voter."*
* **If YES:** Frontend `snarkjs.groth16.fullProve()` call karta hai.
* **The Magic:** Yeh function voter ka ID aur uski Merkle path input leta hai, aur ek **ZK-Proof** + **Nullifier Hash** generate karta hai.
* *Crucial Step:* Code turant UI se Aadhaar ID ko clear (wipe) kar dega. Screen par aayega: *"Identity Verified & Anonymized. Proceed to Vote."*

**Deliverables:**
- [ ] Voter ID input form
- [ ] Whitelist verification logic
- [ ] Merkle proof generation
- [ ] snarkjs integration for ZK-Proof computation
- [ ] Nullifier hash generation
- [ ] Identity auto-wipe from UI
- [ ] Proceed to vote screen

---

## 🔴 Module 3: Offline Cryptography & Simulated DTN

**Objective:** Bina internet ke vote ko lock karna aur local storage mein save karna.

**UI Elements:**
1. Candidate Selection: `[Candidate A] [Candidate B] [Candidate C]`
2. Big Button: `[CAST SECURE VOTE]`
3. **The Simulator Toggle Switch:** `[📶 ONLINE] / [📵 OFFLINE (Shadow Zone)]`

**Developer Logic (The Core Paper Implementation):**
* **Preparation:** Polling booth start hote hi (jab internet ho), system Solana Devnet se 10 `Durable Nonces` fetch karke ek local JSON file mein rakh lega.
* **When Voter Casts Vote (Toggle is OFFLINE):**
    1. Code ZK-Proof, Nullifier, aur Candidate Choice ko combine karega.
    2. Code ek pre-fetched Durable Nonce uthayega.
    3. `SystemProgram.nonceAdvance` ko use karke transaction ko **offline sign** karega.
    4. Code is signed payload ko ek array `dtn_outbox = []` (LocalStorage) mein push kar dega.
    5. Screen par VVPAT Receipt generate hogi: *"Vote Locked Offline! Receipt Hash: 0xabc123..."*

**Deliverables:**
- [ ] Durable Nonce fetching from Solana
- [ ] Nonce caching in localStorage
- [ ] Online/Offline toggle simulator
- [ ] Vote payload construction
- [ ] Offline transaction signing
- [ ] DTN outbox management (localStorage)
- [ ] VVPAT receipt generation
- [ ] Receipt hash display

---

## 🔵 Module 4: The DTN Forwarding (Sync to Blockchain)

**Objective:** Dikhana ki internet aate hi votes safely blockchain par chale jate hain.

**Developer Logic:**
* UI par jab aap Simulator Toggle ko wapas **[📶 ONLINE]** par click karenge:
    1. Ek function trigger hoga jo `dtn_outbox` array ko loop karega.
    2. Har ek locked vote ke liye `connection.sendRawTransaction()` call hoga jo use seedha Solana Devnet par bhej dega.
    3. Transaction success hone par `dtn_outbox` se woh vote clear ho jayega.

**Deliverables:**
- [ ] DTN outbox reader
- [ ] Batch transaction submission logic
- [ ] `connection.sendRawTransaction()` integration
- [ ] Transaction status tracking
- [ ] Retry mechanism for failed submissions
- [ ] Outbox cleanup after successful submissions

---

## 🟣 Module 5: Smart Contract (Tallying & Verification)

**Objective:** Solana Devnet par vote count karna aur double voting rokna.

**Developer Logic (Anchor/Rust):**
* **Double Voting Check:** Contract check karega ki kya input `Nullifier` ka PDA (Program Derived Address) pehle se bana hua hai? 
    * Agar haan -> `Throw Error: AlreadyVoted` (Isse agar koi offline intercept karke 2 baar vote bheje, toh network use reject kar dega).
    * Agar nahi -> PDA create karega.
* **ZK Verification:** Contract on-chain ZK-proof verify karega.
* **Tallying:** Candidate ke counter mein `+1` karega.
* **Public Dashboard:** Ek alag webpage banaiye jahan live vote count dikhe. Yahan voter apna Receipt Hash dalkar check kar sakta hai: *"✅ Transaction Verified on Solana Devnet."*

**Deliverables:**
- [ ] Anchor project setup
- [ ] Smart contract for election state
- [ ] Nullifier PDA check (double voting prevention)
- [ ] On-chain ZK proof verification
- [ ] Vote tallying logic
- [ ] Public dashboard for results
- [ ] Receipt verification page

---

## 📋 Implementation Priority (MVP Speed)

**Week 1-2:**
1. Module 1: Admin Panel (UI + Merkle Tree generation)
2. Module 2: Polling Booth (Identity verification with mock hash)
3. Basic React setup with modules

**Week 2-3:**
1. Module 3: Offline signing with Durable Nonces
2. Module 4: DTN forwarding logic
3. localStorage management

**Week 3-4:**
1. Module 5: Smart Contract development
2. Integration with frontend
3. Testing on Solana Devnet

**Week 4-5:**
1. Full integration testing
2. ZK-Circuit optimization (if time permits)
3. Dashboard & verification page

---

## 💡 Developer Tips for MVP Speed:

* **ZK-SNARK circuits:** ZK likhna lamba kaam ho sakta hai. MVP ke pehle hafte mein use "dummy mock" kar lo (sirf basic hash use karke), aur apna 90% focus **Durable Nonce offline signing** aur **Smart Contract PDAs** par lagao. Paper ki main novelty wahi hai!
* **DTN Storage:** DTN ke liye SQLite use karne ki zaroorat nahi hai. Browser ka `window.localStorage` MVP simulation ke liye perfectly kaam karega.
* **Solana Setup:** Solana CLI aur Anchor Framework install karke devnet par test kar lo.
* **React Structure:** Modular components likho - AdminPanel, PollingBooth, Dashboard separately.

---

## 🔧 Technical Notes:

- **Merkle Tree Lib:** Use `circomlibjs` for Poseidon hashing
- **ZK Proofs:** `snarkjs` for proof generation/verification
- **Offline Signing:** `@solana/web3.js` with `SystemProgram.nonceAdvance`
- **State Management:** React hooks or lightweight state library
- **Smart Contracts:** Anchor Framework (type-safe Solana development)

---

## ✅ Success Metrics:

- Admin can create whitelist and generate Merkle root
- Voter can verify identity without exposing Aadhaar
- Vote can be cast offline and queued in DTN
- DTN automatically syncs when online
- Smart contract prevents double voting
- Dashboard shows real-time vote tallies
- Receipt hash verification works end-to-end

