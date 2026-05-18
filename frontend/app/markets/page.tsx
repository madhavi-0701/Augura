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
}

export default function Markets() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function fetchMarkets() {
      try {
        const { getMarketCount, getMarket } = await import('@/lib/contract')
        const count = await getMarketCount()
        const marketsData: Market[] = []
        
        for (let i = 1; i <= count; i++) {
          try {
            const market = await getMarket(i)
            marketsData.push(market as unknown as Market)
          } catch (e) {}
        }
        
        setMarkets(marketsData)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    fetchMarkets()
  }, [])

  function getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Open'
      case 1: return 'Resolved'
      case 2: return 'Closed'
      case 3: return 'Voided'
      default: return 'Unknown'
    }
  }

  function formatXLM(stroops: number): string {
    return (stroops / 10000000).toFixed(2)
  }

  const filteredMarkets = filter === 'all' 
    ? markets 
    : markets.filter(m => m.status === parseInt(filter))

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">All Markets</h1>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>All</button>
        <button onClick={() => setFilter('0')} className={`px-4 py-2 rounded ${filter === '0' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Open</button>
        <button onClick={() => setFilter('1')} className={`px-4 py-2 rounded ${filter === '1' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>Resolved</button>
        <button onClick={() => setFilter('3')} className={`px-4 py-2 rounded ${filter === '3' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>Voided</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredMarkets.length === 0 ? (
        <p>No markets found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMarkets.map(market => {
            const total = market.yes_shares_sold + market.no_shares_sold
            const yesPct = total === 0 ? 50 : (market.yes_shares_sold / total) * 100
            
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
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    market.status === 0 ? 'bg-green-100 text-green-800' :
                    market.status === 1 ? 'bg-purple-100 text-purple-800' :
                    market.status === 3 ? 'bg-red-100 text-red-800' :
                    'bg-gray-100'
                  }`}>
                    {getStatusLabel(market.status)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}