'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Market {
  id: number
  question: string
  status: number
  yes_shares_sold: number
  no_shares_sold: number
  total_pool: number
  deadline_ledger: number
  resolution_ledger: number
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [stats, setStats] = useState({ totalMarkets: 0, totalPool: 0, resolvedCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const { getMarketCount, getMarket, getConfig } = await import('@/lib/contract')
        const count = await getMarketCount()
        const config = await getConfig()
        
        let totalPool = 0
        let resolvedCount = 0
        const marketsData: Market[] = []
        
        for (let i = 1; i <= count; i++) {
          try {
            const market = await getMarket(i)
            const m = market as unknown as Market
            totalPool += m.total_pool
            if (m.status === 1) resolvedCount++
            
            if (m.status === 0) {
              marketsData.push(m)
            }
          } catch (e) {}
        }
        
        setStats({ totalMarkets: count, totalPool, resolvedCount })
        setMarkets(marketsData.slice(0, 6))
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  function calculateYesProbability(yes: number, no: number): number {
    const total = yes + no
    return total === 0 ? 50 : (yes / total) * 100
  }

  function formatXLM(stroops: number): string {
    return (stroops / 10000000).toFixed(2)
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

  return (
    <div>
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4">Predict anything. Settle on-chain.</h1>
        <p className="text-xl text-gray-600 mb-8">
          Decentralized binary prediction markets on Stellar
        </p>
        <div className="space-x-4">
          <Link href="/markets" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Browse Markets
          </Link>
          <Link href="/create" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
            Create Market
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4 mb-12">
        <div className="border p-4 rounded-lg text-center">
          <div className="text-3xl font-bold">{stats.totalMarkets}</div>
          <div className="text-gray-600">Total Markets</div>
        </div>
        <div className="border p-4 rounded-lg text-center">
          <div className="text-3xl font-bold">{formatXLM(stats.totalPool)} XLM</div>
          <div className="text-gray-600">Total Pool</div>
        </div>
        <div className="border p-4 rounded-lg text-center">
          <div className="text-3xl font-bold">{stats.resolvedCount}</div>
          <div className="text-gray-600">Resolved</div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Featured Markets</h2>
        {loading ? (
          <p>Loading...</p>
        ) : markets.length === 0 ? (
          <p>No open markets yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map(market => {
              const yesPct = calculateYesProbability(market.yes_shares_sold, market.no_shares_sold)
              return (
                <Link href={`/market/${market.id}`} key={market.id} className="border p-4 rounded-lg hover:shadow-lg">
                  <div className="font-bold mb-2 truncate">{market.question}</div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>YES {yesPct.toFixed(0)}%</span>
                      <span>NO {(100 - yesPct).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${yesPct}%` }} />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 flex justify-between">
                    <span>{formatXLM(market.total_pool)} XLM</span>
                    <span className={`px-2 py-0.5 rounded ${market.status === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                      {getStatusLabel(market.status)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">How it works</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-2">For Traders</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Browse markets and find one you want to predict</li>
              <li>Buy YES or NO shares at a fixed price</li>
              <li>When the market resolves, claim your winnings</li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">For Creators</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Create a market with a question and oracle</li>
              <li>Set deadline and resolution ledger numbers</li>
              <li>The oracle resolves the market after the deadline</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  )
}