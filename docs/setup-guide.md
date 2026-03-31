# 🔧 Setup Guide: ROFV MVP Development

## Prerequisites

Before starting, ensure you have:

### 1. System Requirements
- **OS:** macOS (Sonoma or later) / Ubuntu 20.04+ / Windows WSL2
- **Node.js:** v16 or higher
- **RAM:** 4GB minimum (8GB recommended)
- **Disk Space:** 10GB free (for Solana/Rust/Node dependencies)

### 2. Install Required Tools

#### A. Node.js & npm
```bash
# Check if installed
node --version
npm --version

# If not, install from https://nodejs.org/
# Or using Homebrew (macOS):
brew install node
```

#### B. Solana CLI
```bash
# Install Solana CLI suite
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Add to PATH
export PATH="/Users/anuragsharma/.local/share/solana/install/active_release/bin:$PATH"

# Verify
solana --version
```

#### C. Rust & Cargo
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify
rustc --version
cargo --version
```

#### D. Anchor Framework
```bash
# Install Anchor
npm install -g @coral-xyz/anchor-cli

# Or using cargo
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# Verify
anchor --version
```

### 3. Configure Solana CLI

```bash
# Set cluster to Devnet (free SOL)
solana config set --url devnet

# Generate keypair (if needed)
solana-keygen new

# Check configuration
solana config get

# Output should show: Cluster: devnet, RPC URL: https://api.devnet.solana.com
```

## Project Setup

### Step 1: Clone/Navigate to Project

```bash
cd /Users/anuragsharma/Workspace/Projects/BlockVote/Final\ Project
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install

# Verify installation
npm list react @solana/web3.js snarkjs circomlibjs
```

### Step 3: Install Contract Dependencies

```bash
cd ../contracts
npm install

# Build to check for errors
anchor build
```

## Development Environment Setup

### Quick Start Script

Create `setup.sh` in project root:

```bash
#!/bin/bash
set -e

echo "🚀 ROFV MVP Setup"
echo "=================="

# Check prerequisites
echo "✓ Checking prerequisites..."
node --version
npm --version
solana --version
anchor --version
rustc --version

# Frontend setup
echo "✓ Setting up frontend..."
cd frontend
npm install
cd ..

# Contract setup
echo "✓ Setting up contracts..."
cd contracts
npm install
anchor build
cd ..

# Create initial state files
mkdir -p .local

# Output success
echo ""
echo "✅ Setup complete!"
echo "📝 Next steps:"
echo "   1. Start frontend: cd frontend && npm run dev"
echo "   2. Build contracts: cd contracts && anchor build"
echo "   3. Read BLUEPRINT.md for development guide"
```

Run it:
```bash
chmod +x setup.sh
./setup.sh
```

## Running the Project

### Terminal 1: Frontend Development Server

```bash
cd frontend
npm run dev

# Output will show:
# > vite
# ➜  Local:   http://localhost:3000/
# ➜  press h to show help
```

### Terminal 2: Local Solana Validator (Optional)

For complete offline development:

```bash
# Install Solana test validator
solana-test-validator

# In another terminal, check it's running:
solana ping
```

Or use devnet (easier for MVP):
```bash
# No action needed - Devnet is public RPC
solana config set --url devnet
```

### Terminal 3: Contract Development

```bash
cd contracts

# Watch for changes and rebuild
anchor build

# Deploy to Devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test --provider.cluster devnet
```

## IDE Setup (VS Code)

### Recommended Extensions

1. **Rust Analyzer** (`rust-lang.rust-analyzer`)
   - For Rust contract development

2. **Prettier** (`esbenp.prettier-vscode`)
   - Code formatting

3. **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
   - React shortcuts

4. **Solana Foundation** (`solana.solana-extension`)
   - Solana development support

### VS Code Settings

Create or update `.vscode/settings.json`:

```json
{
  "[rust]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  },
  "[javascript]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/target": true,
    "**/.anchor": true
  }
}
```

## Environment Variables

### Create `.env.local` in `frontend/`

```env
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC=https://api.devnet.solana.com
VITE_ADMIN_WALLET=YOUR_ADMIN_PUBKEY_HERE
```

### Create `.env` in `contracts/`

```env
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
```

## Solana Devnet Fund

Get free SOL on Devnet (only for testing):

```bash
# Request SOL airdrop
solana airdrop 2

# Check balance
solana balance

# Should show: ~2 SOL (may take a minute)
```

You can request airdrop 2 SOL every 24 hours.

## Troubleshooting

### Issue: "anchor: command not found"
```bash
# Reinstall Anchor
npm install -g @coral-xyz/anchor-cli

# Or add to PATH manually
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Issue: Node modules conflicts
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Rust compilation errors
```bash
# Update Rust
rustup update

# Clear cache
cargo clean
anchor build
```

### Issue: "Airdrop rate limited"
```bash
# Wait 24 hours or use multiple wallets
# Or use test-validator for unlimited SOL
solana-test-validator
```

### Issue: "RPC request failed"
```bash
# Check network status
curl https://api.devnet.solana.com
solana ping

# Try different RPC endpoint if devnet is congested
solana config set --url https://solana-api.projectserum.com
```

## Development Workflow

### For Module Development

```bash
# 1. Start frontend dev server
cd frontend && npm run dev

# 2. In another terminal, watch contract changes
cd contracts && anchor build --watch # (if supported)

# 3. In another terminal, view contract logs
solana logs <PROGRAM_ID> --url devnet

# 4. Code, test, iterate
```

### For Testing

```bash
# Unit tests for contracts
cd contracts
anchor test --provider.cluster devnet

# React component tests (if added)
cd ../frontend
npm run test
```

### For Deployment

```bash
# Build frontend for production
cd frontend
npm run build

# Deploy contract to Devnet
cd ../contracts
anchor deploy --provider.cluster devnet
```

## Next Steps

1. ✅ Complete setup and verify all tools work
2. 📖 Read [BLUEPRINT.md](../BLUEPRINT.md) for development guide
3. 🟢 Start with [Module 1: Admin Panel](../modules/module-1-admin/README.md)
4. 🟠 Progress through modules sequentially
5. 🧪 Test each module before moving to next

## Support Resources

- **Solana Docs:** https://docs.solana.com/
- **Anchor Book:** https://book.anchor-lang.com/
- **Web3.js Docs:** https://solana-labs.github.io/solana-web3.js/
- **snarkjs Docs:** https://github.com/iden3/snarkjs
- **Solana Discord:** https://discord.gg/solana

---

**Setup Complete!** 🎉  
Ready to start Module 1 development.

**Last Updated:** March 30, 2026
