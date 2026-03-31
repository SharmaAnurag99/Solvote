# ROFV UI - Next.js Frontend

This is the Next.js frontend for the ROFV (Resilient Offline-First Voting) system. It provides three main interfaces:

## 🌐 Routes

- **`/`** - Home page with feature overview
- **`/admin`** - Admin Portal (Electoral Officer setup)
- **`/booth/verify`** - Voter identity verification
- **`/booth/vote`** - Vote casting (works offline!)
- **`/analytics`** - Master dashboard (DTN sync + vote tally)

## 📚 Mocks

All UI components are built with mocked data. Refer to [MOCKS.md](./MOCKS.md) for:
- What's currently mocked
- How to replace mocks with real backend APIs
- Environment variables needed
- Smart contract integration points

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test Aadhaar Numbers (for mocked verification)
```
111122223333
444455556666
777788889999
123456789012
```

## 📁 Project Structure

```
rofv-ui/
├── app/                          # Next.js app router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   ├── admin/
│   │   └── page.tsx             # Admin panel
│   ├── booth/
│   │   ├── verify/
│   │   │   └── page.tsx         # Voter verification
│   │   └── vote/
│   │       └── page.tsx         # Vote casting
│   └── analytics/
│       └── page.tsx             # Results dashboard
├── components/                   # React components (future)
├── lib/                         # Utilities & helpers (future)
├── public/                      # Static files
├── MOCKS.md                     # Mock data documentation
├── next.config.ts              # Next.js config
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

## 🎨 Styling

Uses **Tailwind CSS** with custom components defined in `globals.css`:
- `.btn-primary` - Blue action button
- `.btn-secondary` - Gray button
- `.input-field` - Form input
- `.card` - Elevated white card
- `.badge-success`, `.badge-warning`, `.badge-error`, `.badge-info` - Status badges

## 🔑 Key Features Implemented

✅ Route separation (Admin / Voter / Analytics)
✅ Complete UI mockups
✅ localStorage persistence for offline simulation
✅ Network status detection
✅ DTN queue simulation
✅ Vote receipt generation
✅ Results visualization

## 🔄 State Management

Currently using React hooks + localStorage for mocking. Will be replaced with:
- API calls to backend
- IndexedDB for larger offline persistence
- WebSocket for real-time updates

## 📝 Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID_HERE
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Refer to [MOCKS.md](./MOCKS.md) for complete list.

## 🔗 Integration Points

See [MOCKS.md](./MOCKS.md) for:
1. **Admin Panel** - Merkle root generation & smart contract initialization
2. **Polling Booth** - Identity verification & vote signing
3. **Analytics** - DTN sync & blockchain results

## 📦 Dependencies

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 🧪 Testing

### Test Offline Voting
1. Go to `/booth/vote`
2. Toggle "Simulate Offline Mode"
3. Select candidate and cast vote
4. Check DTN queue in Dashboard

### Test DTN Sync
1. Cast vote while offline
2. Go to `/analytics`
3. See "Pending" votes
4. Toggle offline off and click "Sync Now"
5. Watch votes move to "Confirmed"

## 🚨 Known Limitations (Mocked)

- No real blockchain interaction
- No actual Merkle tree generation
- No real ZK proofs
- Results are simulated
- Whitelist is hardcoded

**See [MOCKS.md](./MOCKS.md) for replacement guide.**

## 🔐 Security Notes

- Aadhaar numbers are cleared from state immediately after verification
- No sensitive data stored in localStorage (mocks only)
- Uses password fields for identity input
- Ready for real crypto when backend implemented

## 📞 Support

For integration questions, refer to [MOCKS.md](./MOCKS.md) and the main [BLUEPRINT.md](../BLUEPRINT.md) in the project root.

---

**Built with:** Next.js 15 + TypeScript + Tailwind CSS  
**Status:** UI Complete - Ready for Backend Integration  
**Last Updated:** March 31, 2026
