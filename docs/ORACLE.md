# Oracle Guide

## What is an Oracle?

An oracle is a designated address authorized to submit the real-world outcome of a prediction market on-chain. When a market reaches its resolution deadline, the oracle submits the final outcome (YES or NO).

## Becoming an Oracle

1. When creating a market, specify your Stellar address as the oracle
2. Only the oracle address can resolve the market

## Resolving a Market

1. Wait until after the resolution deadline (resolution_ledger)
2. Navigate to the market page at `/market/[id]`
3. You'll see "Oracle Actions" panel if you're the oracle
4. Click "Resolve YES" or "Resolve NO"

### Timing Requirements

- Cannot resolve before resolution_ledger
- Can resolve any time after resolution_ledger
- If not resolved within grace period (void_grace_ledgers), anyone can void the market

## Void Mechanism

If you fail to resolve a market within the grace period:

1. Anyone can call `void_market` after grace period elapses
2. Voided markets allow full refunds to all participants
3. The market becomes invalid and cannot be resolved

## Best Practices

- Monitor markets assigned to your address
- Resolve as soon as possible after resolution deadline
- If you cannot resolve, consider voiding the market so participants can get refunds
- Keep your oracle address secure

## Technical Details

- Oracle address is set at market creation
- Only the oracle can call the `resolve` function
- The oracle cannot resolve before the resolution ledger number