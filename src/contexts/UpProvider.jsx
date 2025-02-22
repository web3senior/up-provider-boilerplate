/**
 * @component UpProvider
 * @description Context provider that manages Universal Profile (UP) wallet connections and state
 * for LUKSO blockchain interactions on Grid. It handles wallet connection status, account management, and chain
 * information while providing real-time updates through event listeners.
 *
 * @provides {UpProviderContext} Context containing:
 * - provider: UP-specific wallet provider instance
 * - client: Viem wallet client for blockchain interactions
 * - chainId: Current blockchain network ID
 * - accounts: Array of connected wallet addresses
 * - contextAccounts: Array of Universal Profile accounts
 * - walletConnected: Boolean indicating active wallet connection
 * - selectedAddress: Currently selected address for transactions
 * - isSearching: Loading state indicator
 */
import { createClientUPProvider } from '@lukso/up-provider'
import { createWalletClient, custom } from 'viem'
import { lukso, luksoTestnet } from 'viem/chains'
import { createContext, useContext, useEffect, useState, useMemo } from 'react'

const UpContext = createContext()

const provider = typeof window !== 'undefined' ? createClientUPProvider() : null

export function useUpProvider() {
  const context = useContext(UpContext)
  if (!context) {
    throw new Error('useUpProvider must be used within a UpProvider')
  }
  return context
}

export function UpProvider({ children }) {
  const [chainId, setChainId] = useState(0)
  const [accounts, setAccounts] = useState([])
  const [contextAccounts, setContextAccounts] = useState([])
  const [walletConnected, setWalletConnected] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  const client = useMemo(() => {
    if (provider && chainId) {
      return createWalletClient({
        chain: chainId === 42 ? lukso : luksoTestnet,
        transport: custom(provider),
      })
    }
    return null
  }, [chainId])

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        if (!client || !provider) return

        const _chainId = await provider.request('eth_chainId')
        if (!mounted) return
        setChainId(_chainId)

        const _accounts = await provider.request('eth_accounts', [])
        if (!mounted) return
        setAccounts(_accounts)

        const _contextAccounts = provider.contextAccounts
        if (!mounted) return
        setContextAccounts(_contextAccounts)
        setWalletConnected(_accounts.length > 0 && _contextAccounts.length > 0)
      } catch (error) {
        console.error(error)
      }
    }

    init()

    if (provider) {
      const accountsChanged = (_accounts) => {
        setAccounts(_accounts)
        setWalletConnected(_accounts.length > 0 && contextAccounts.length > 0)
      }

      const contextAccountsChanged = (_accounts) => {
        setContextAccounts(_accounts)
        setWalletConnected(accounts.length > 0 && _accounts.length > 0)
      }

      const chainChanged = (_chainId) => {
        setChainId(_chainId)
      }

      provider.on('accountsChanged', accountsChanged)
      provider.on('chainChanged', chainChanged)
      provider.on('contextAccountsChanged', contextAccountsChanged)

      return () => {
        mounted = false
        provider.removeListener('accountsChanged', accountsChanged)
        provider.removeListener('contextAccountsChanged', contextAccountsChanged)
        provider.removeListener('chainChanged', chainChanged)
      }
    }
    // If you want to be responsive to account changes
    // you also need to look at the first account rather
    // then the length or the whole array. Unfortunately react doesn't properly
    // look at array values like vue or knockout.
  }, [client, accounts[0], contextAccounts[0]])

  // There has to be a useMemo to make sure the context object doesn't change on every
  // render.
  const data = useMemo(() => {
    return {
      provider,
      client,
      chainId,
      accounts,
      contextAccounts,
      walletConnected,
      selectedAddress,
      setSelectedAddress,
      isSearching,
      setIsSearching,
    }
  }, [client, chainId, accounts, contextAccounts, walletConnected, selectedAddress, isSearching])
  return (
    <UpContext.Provider value={data}>
      <div className="min-h-screen flex items-center justify-center">{children}</div>
    </UpContext.Provider>
  )
}
