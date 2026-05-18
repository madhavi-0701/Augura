import { simulateContract, getCurrentLedger } from './stellar'

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || ''

export interface Market {
  id: number
  creator: string
  question: string
  oracle: string
  share_price: number
  deadline_ledger: number
  resolution_ledger: number
  status: number
  outcome: number | null
  yes_shares_sold: number
  no_shares_sold: number
  total_pool: number
  created_at: number
}

export interface ShareBalance {
  market_id: number
  holder: string
  yes_shares: number
  no_shares: number
  claimed: boolean
}

export interface ProtocolConfig {
  admin: string
  creation_fee: number
  protocol_fee_bps: number
  treasury_balance: number
  void_grace_ledgers: number
}

async function callContract(fn: string, args: any[] = []): Promise<any> {
  if (!CONTRACT_ID) throw new Error('Contract ID not configured')
  
  const result = await simulateContract(CONTRACT_ID, fn, args)
  
  if (result.error) {
    throw new Error(result.error.message || 'Contract call failed')
  }
  
  if (result.result) {
    return result.result
  }
  
  return result
}

export async function createMarket(
  question: string,
  oracle: string,
  sharePriceXLM: number,
  deadlineLedger: number,
  resolutionLedger: number
): Promise<number> {
  const sharePriceStroops = xlmToStroops(sharePriceXLM.toString())
  const result = await callContract('create_market', [
    question,
    oracle,
    sharePriceStroops,
    deadlineLedger,
    resolutionLedger
  ])
  return parseInt(result)
}

export async function getMarket(marketId: number): Promise<Market> {
  const result = await callContract('get_market', [marketId])
  return result
}

export async function getMarketCount(): Promise<number> {
  try {
    const result = await callContract('get_market_count', [])
    return result || 0
  } catch {
    return 0
  }
}

export async function getMarketsByCreator(creator: string): Promise<number[]> {
  const result = await callContract('get_markets_by_creator', [creator])
  return result || []
}

export async function getConfig(): Promise<ProtocolConfig> {
  const result = await callContract('get_config', [])
  return {
    admin: result[0],
    creation_fee: parseInt(result[1]),
    protocol_fee_bps: parseInt(result[2]),
    treasury_balance: parseInt(result[3]),
    void_grace_ledgers: parseInt(result[4])
  }
}

export async function buyShares(
  marketId: number,
  side: number,
  quantity: number
): Promise<ShareBalance> {
  const result = await callContract('buy_shares', [marketId, side, quantity])
  return {
    market_id: marketId,
    holder: '',
    yes_shares: parseInt(result[0]),
    no_shares: parseInt(result[1]),
    claimed: result[2]
  }
}

export async function getShareBalance(marketId: number, holder: string): Promise<ShareBalance> {
  const result = await callContract('get_share_balance', [marketId, holder])
  return {
    market_id: marketId,
    holder,
    yes_shares: parseInt(result[0]),
    no_shares: parseInt(result[1]),
    claimed: result[2]
  }
}

export async function resolve(marketId: number, outcome: number): Promise<void> {
  await callContract('resolve', [marketId, outcome])
}

export async function voidMarket(marketId: number): Promise<void> {
  await callContract('void_market', [marketId])
}

export async function claim(marketId: number): Promise<number> {
  const result = await callContract('claim', [marketId])
  return parseInt(result)
}

export async function claimRefund(marketId: number): Promise<number> {
  const result = await callContract('claim_refund', [marketId])
  return parseInt(result)
}

export async function withdrawTreasury(): Promise<number> {
  const result = await callContract('withdraw_treasury', [])
  return parseInt(result)
}

export function ledgerToApproxDate(ledger: number, currentLedger: number): Date {
  const ledgersPerDay = 17280
  const ledgersDiff = ledger - currentLedger
  const daysUntil = Math.ceil(ledgersDiff / ledgersPerDay)
  return new Date(Date.now() + daysUntil * 24 * 60 * 60 * 1000)
}

export function dateToApproxLedger(date: Date, currentLedger: number): number {
  const msPerLedger = 5000
  const diffMs = date.getTime() - Date.now()
  const ledgersDiff = Math.floor(diffMs / msPerLedger)
  return currentLedger + ledgersDiff
}

export function calculateWinningPayout(
  market: Market,
  sharesHeld: number,
  side: number
): string {
  if (market.status !== 1 || market.outcome === null) return '0'
  
  const winningSide = market.outcome
  if (winningSide !== side) return '0'
  
  const winningShares = side === 0 ? market.yes_shares_sold : market.no_shares_sold
  const totalWinning = side === 0 ? market.yes_shares_sold : market.no_shares_sold
  
  if (winningShares === 0 || totalWinning === 0) return '0'
  
  const grossPayout = (sharesHeld / totalWinning) * market.total_pool
  return stroopsToXLM(Math.floor(grossPayout).toString())
}

export function calculateYesProbability(market: Market): number {
  const total = market.yes_shares_sold + market.no_shares_sold
  return total === 0 ? 50 : (market.yes_shares_sold / total) * 100
}

export function stroopsToXLM(stroops: string): string {
  return (parseInt(stroops) / 10000000).toFixed(7)
}

export function xlmToStroops(xlm: string): string {
  return Math.floor(parseFloat(xlm) * 10000000).toString()
}