'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Market {
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
}

interface ShareBalance {
  yes_shares: number
  no_shares: number
  claimed: boolean
}

export default function MarketDetail() {
  const params = useParams()
  const marketId = parseInt(params.id as string)
  
  const [market, setMarket] = useState<Market | null>(null)
  const [balance, setBalance] = useState<ShareBalance | null>(null)
  const [wallet, setWallet] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [side, setSide] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        const { getMarket, getShareBalance, getPublicKey } = await import('@/lib/contract')
        const { connectWallet } = await import('@/lib/stellar')
        
        const m = await getMarket(marketId)
        setMarket(m as unknown as Market)
        
        try {
          const pk = await getPublicKey()
          if (pk) {
            setWallet(pk)
            const bal = await getShareBalance(marketId, pk)
            setBalance(bal as unknown as ShareBalance)
          }
        } catch (e) {}
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    fetchData()
  }, [marketId])

  async function handleBuy() {
    if (!quantity || parseInt(quantity) <= 0) return
    setBuying(true)
    try {
      const { buyShares } = await import('@/lib/contract')
      await buyShares(marketId, side, parseInt(quantity))
      window.location.reload()
    } catch (e) {
      alert('Failed to buy shares')
    }
    setBuying(false)
  }

  async function handleResolve(outcome: number) {
    try {
      const { resolve } = await import('@/lib/contract')
      await resolve(marketId, outcome)
      window.location.reload()
    } catch (e) {
      alert('Failed to resolve market')
    }
  }

  async function handleClaim() {
    try {
      const { claim } = await import('@/lib/contract')
      const payout = await claim(marketId)
      alert(`Claimed ${(payout / 10000000).toFixed(2)} XLM`)
      window.location.reload()
    } catch (e) {
      alert('Failed to claim')
    }
  }

  async function handleVoid() {
    try {
      const { voidMarket } = await import('@/lib/contract')
      await voidMarket(marketId)
      window.location.reload()
    } catch (e) {
      alert('Failed to void market')
    }
  }

  if (loading) return <p>Loading...</p>
  if (!market) return <p>Market not found</p>

  const total = market.yes_shares_sold + market.no_shares_sold
  const yesPct = total === 0 ? 50 : (market.yes_shares_sold / total) * 100

  function formatXLM(stroops: number): string {
    return (stroops / 10000000).toFixed(4)
  }

  function truncateAddress(addr: string): string {
    return addr.slice(0, 6) + '...' + addr.slice(-4)
  }

  function getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Open'
      case 1: return 'Resolved'
      case 2: return 'Closed'
      case 3: return 'Voided'
      default: return 'Unknown'
    }
  }

  const isOracle = wallet && market.oracle === wallet

  return (
    <div>
      <Link href="/markets" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Markets</Link>
      
      <div className="border p-6 rounded-lg mb-6">
        <h1 className="text-2xl font-bold mb-2">{market.question}</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className={`inline-block px-2 py-1 rounded ${
              market.status === 0 ? 'bg-green-100' :
              market.status === 1 ? 'bg-purple-100' :
              market.status === 3 ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              {getStatusLabel(market.status)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Oracle</div>
            <div className="font-mono">{truncateAddress(market.oracle)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Share Price</div>
            <div>{formatXLM(market.share_price)} XLM</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Pool</div>
            <div>{formatXLM(market.total_pool)} XLM</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Deadline Ledger</div>
            <div>{market.deadline_ledger}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Resolution Ledger</div>
            <div>{market.resolution_ledger}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Probability</div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-green-600 font-bold">YES {yesPct.toFixed(1)}%</span>
                <span className="text-red-600 font-bold">NO {(100 - yesPct).toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${yesPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {market.status === 1 && market.outcome !== null && (
          <div className="bg-purple-100 p-3 rounded">
            Result: {market.outcome === 0 ? 'YES' : 'NO'} Won
          </div>
        )}
      </div>

      {market.status === 0 && wallet && (
        <div className="border p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Buy Shares</h2>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setSide(0)} className={`px-4 py-2 rounded ${side === 0 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>YES</button>
            <button onClick={() => setSide(1)} className={`px-4 py-2 rounded ${side === 1 ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>NO</button>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="border p-2 rounded w-full"
              min="1"
            />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Cost: {quantity ? formatXLM(market.share_price * parseInt(quantity)) : '0'} XLM
          </p>
          <button
            onClick={handleBuy}
            disabled={buying || !quantity}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {buying ? 'Buying...' : 'Buy Shares'}
          </button>
        </div>
      )}

      {wallet && balance && (balance.yes_shares > 0 || balance.no_shares > 0) && (
        <div className="border p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Your Position</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>YES Shares: {balance.yes_shares}</div>
            <div>NO Shares: {balance.no_shares}</div>
          </div>
          {market.status === 1 && !balance.claimed && market.outcome !== null && (
            <button onClick={handleClaim} className="bg-purple-600 text-white px-6 py-2 rounded">
              Claim Winnings
            </button>
          )}
          {balance.claimed && <p className="text-gray-600">Already claimed</p>}
        </div>
      )}

      {isOracle && market.status === 0 && (
        <div className="border p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Oracle Actions</h2>
          <p className="text-sm text-gray-600 mb-4">You are the oracle for this market.</p>
          <div className="flex gap-2">
            <button onClick={() => handleResolve(0)} className="bg-green-600 text-white px-6 py-2 rounded">
              Resolve YES
            </button>
            <button onClick={() => handleResolve(1)} className="bg-red-600 text-white px-6 py-2 rounded">
              Resolve NO
            </button>
          </div>
        </div>
      )}

      {market.status !== 1 && (
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Void Market</h2>
          <p className="text-sm text-gray-600 mb-4">
            If the oracle fails to resolve after the grace period, anyone can void this market.
          </p>
          <button onClick={handleVoid} className="bg-red-600 text-white px-6 py-2 rounded">
            Void Market
          </button>
        </div>
      )}
    </div>
  )
}