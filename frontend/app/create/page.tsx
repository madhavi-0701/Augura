'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateMarket() {
  const router = useRouter()
  const [wallet, setWallet] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<any>(null)
  
  const [question, setQuestion] = useState('')
  const [oracle, setOracle] = useState('')
  const [sharePrice, setSharePrice] = useState('')
  const [deadline, setDeadline] = useState('')
  const [resolution, setResolution] = useState('')

  useEffect(() => {
    async function init() {
      try {
        const { getPublicKey, connectWallet } = await import('@/lib/stellar')
        const { getConfig } = await import('@/lib/contract')
        
        let pk = await getPublicKey()
        if (!pk) {
          pk = await connectWallet()
        }
        setWallet(pk)
        
        const cfg = await getConfig()
        setConfig(cfg)
      } catch (e) {
        console.error(e)
      }
    }
    init()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!wallet) {
      alert('Please connect your wallet first')
      return
    }
    if (!question || !oracle || !sharePrice || !deadline || !resolution) {
      alert('Please fill all fields')
      return
    }

    setLoading(true)
    try {
      const { createMarket, dateToApproxLedger } = await import('@/lib/contract')
      const { getCurrentLedger } = await import('@/lib/stellar')
      
      const currentLedger = await getCurrentLedger()
      
      const deadlineDate = new Date(deadline)
      const resolutionDate = new Date(resolution)
      
      const deadlineLedger = dateToApproxLedger(deadlineDate, currentLedger)
      const resolutionLedger = dateToApproxLedger(resolutionDate, currentLedger)
      
      const marketId = await createMarket(
        question,
        oracle,
        parseFloat(sharePrice),
        deadlineLedger,
        resolutionLedger
      )
      
      router.push(`/market/${marketId}`)
    } catch (e) {
      console.error(e)
      alert('Failed to create market')
    }
    setLoading(false)
  }

  if (!wallet) {
    return <div className="text-center py-12">Please connect your wallet to create a market.</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Market</h1>

      {config && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
          <p className="text-sm">Creating this market costs {config.creation_fee / 10000000} XLM</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">What are you predicting?</label>
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full border p-3 rounded-lg"
            placeholder="e.g., XLM above $0.15 on ledger 5000000"
            maxLength={128}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Oracle Address</label>
          <input
            type="text"
            value={oracle}
            onChange={e => setOracle(e.target.value)}
            className="w-full border p-3 rounded-lg"
            placeholder="G..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">The wallet address that will resolve this market.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Share Price (XLM)</label>
          <input
            type="number"
            step="0.0001"
            min="0.0001"
            value={sharePrice}
            onChange={e => setSharePrice(e.target.value)}
            className="w-full border p-3 rounded-lg"
            placeholder="0.01"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Fixed price per share in XLM.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Trading Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full border p-3 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Resolution Deadline</label>
            <input
              type="datetime-local"
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              className="w-full border p-3 rounded-lg"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Market'}
        </button>
      </form>
    </div>
  )
}