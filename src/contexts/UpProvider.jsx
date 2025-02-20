import { createClientUPProvider } from '@lukso/up-provider'
import { createWalletClient, custom } from 'viem'
import { lukso, luksoTestnet } from 'viem/chains'
import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'

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
  }, [client, accounts.length, contextAccounts.length])

  return (
    <UpContext.Provider
      value={{
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
      }}
    >
      <div className="min-h-screen flex items-center justify-center">{children}</div>
    </UpContext.Provider>
  )
}
