import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api'
import { Transaction, Keypair, xdr } from 'stellar-sdk'

let publicKey: string | null = null

export async function connectWallet(): Promise<string> {
  try {
    const connected = await isConnected()
    if (!connected) {
      throw new Error('Freighter not connected')
    }
    const pk = await getPublicKey()
    publicKey = pk
    return pk
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    throw error
  }
}

export async function getPublicKey(): Promise<string | null> {
  if (!publicKey) {
    try {
      const connected = await isConnected()
      if (connected) {
        publicKey = await getPublicKey()
      }
    } catch (e) {
      return null
    }
  }
  return publicKey
}

export async function signTransaction(xdrString: string, networkPassphrase: string): Promise<string> {
  try {
    return await signTransaction(xdrString, networkPassphrase)
  } catch (error) {
    console.error('Failed to sign transaction:', error)
    throw error
  }
}

export async function callContract(
  contractId: string,
  fn: string,
  args: any[],
  publicKey: string
): Promise<string> {
  throw new Error('Not implemented - use simulateContract for now')
}

export async function simulateContract(
  contractId: string,
  fn: string,
  args: any[]
): Promise<any> {
  const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC || 'https://soroban-testnet.stellar.org'
  
  const params = args.map((arg, i) => ({
    type: 'string',
    value: String(arg)
  }))

  const requestBody = {
    jsonrpc: '2.0',
    id: 1,
    method: 'simulate',
    params: {
      contractId,
      method: fn,
      args: params
    }
  }

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })

  const result = await response.json()
  return result
}

export async function getCurrentLedger(): Promise<number> {
  const horizonUrl = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org'
  const response = await fetch(`${horizonUrl}/ledger`)
  const data = await response.json()
  return data.sequence
}

export async function sendNativePayment(to: string, amountXLM: string, source: string): Promise<string> {
  throw new Error('Not implemented')
}