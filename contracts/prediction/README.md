# Prediction Market Contract

Soroban smart contract for binary prediction markets on Stellar.

## Build

```bash
soroban contract build
```

## Deploy

```bash
soroban contract deploy --wasm target/wasm32v1-none/release/prediction.wasm --source testnet
```

## Initialize

```bash
soroban contract invoke <CONTRACT_ID> -- initialize \
  --admin G... \
  --creation_fee 10000000 \
  --protocol_fee_bps 200 \
  --void_grace_ledgers 100
```

## Functions

- `initialize` - Initialize protocol config
- `create_market` - Create a new prediction market
- `buy_shares` - Buy YES or NO shares
- `resolve` - Resolve market (oracle only)
- `claim` - Claim winnings
- `void_market` - Void unresolved market
- `claim_refund` - Get refund from voided market
- `withdraw_treasury` - Withdraw protocol fees (admin only)
- `get_market` - Get market details
- `get_market_count` - Get total markets
- `get_config` - Get protocol config
- `get_share_balance` - Get user's share balance

## Stub Functions (Not Implemented)

- `set_share_price_lmsr` - Switch to LMSR pricing
- `add_liquidity` - Add LP liquidity
- `remove_liquidity` - Remove LP liquidity
- `resolve_multi_sig` - Multi-sig oracle resolution
- `update_oracle` - Rotate oracle address
- `set_creation_fee` - Update creation fee
- `set_protocol_fee_bps` - Update protocol fee