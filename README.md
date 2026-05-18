# Augura - Binary Prediction Market Protocol on Stellar

Augura is a decentralized binary prediction market protocol built on Soroban. Anyone can create a market around any verifiable future event, and participants can buy YES or NO shares. When the market resolves, winning shareholders claim a proportional payout from the market's liquidity pool.

## Overview

- **Blockchain**: Stellar (Soroban)
- **Frontend**: Next.js 14 (App Router)
- **Wallet**: Freighter Wallet
- **License**: MIT

## Features

- Create binary prediction markets for any event
- Fixed-price share buying (MVP)
- Oracle-based resolution
- Winner payouts from market pool
- Protocol fee on claims

## Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.81+ (for contract compilation)
- Freighter Wallet browser extension

### Installation

1. Clone the repository:
```bash
git clone https://github.com/madhavi-0701/Augura.git
cd Augura
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your contract ID and network settings
```

4. Run the frontend:
```bash
npm run dev
```

### Smart Contract Setup

1. Build the contract:
```bash
cd contracts/prediction
soroban contract build
```

2. Deploy to testnet:
```bash
soroban contract deploy --wasm target/wasm32v1-none/release/prediction.wasm --source testnet
```

3. Initialize the contract:
```bash
soroban contract invoke <CONTRACT_ID> -- initialize --admin <YOUR_ADDRESS> --creation_fee 10000000 --protocol_fee_bps 200 --void_grace_ledgers 100
```

## Usage

### Creating a Market

1. Connect your Freighter wallet
2. Navigate to `/create`
3. Fill in:
   - Question (what you're predicting)
   - Oracle address (who will resolve the market)
   - Share price (cost per share in XLM)
   - Trading deadline (when trading closes)
   - Resolution deadline (when oracle can resolve)

### Buying Shares

1. Browse markets at `/markets`
2. Click on a market
3. Select YES or NO
4. Enter quantity and confirm

### Resolving as Oracle

1. After resolution deadline passes
2. Go to your market page
3. Click "Resolve YES" or "Resolve NO"

### Claiming Winnings

1. After market resolves
2. Go to your market page
3. Click "Claim Winnings"

## Project Structure

```
augura/
├── contracts/prediction/    # Soroban smart contract
├── frontend/                 # Next.js frontend
│   ├── app/                 # App router pages
│   ├── lib/                 # Helper libraries
│   └── components/          # React components
└── docs/                    # Documentation
```

## Development

### Contract

```bash
cd contracts/prediction
soroban contract build
```

### Frontend

```bash
cd frontend
npm run dev
```

## Contributing

See CONTRIBUTING.md for guidelines.

## License

MIT