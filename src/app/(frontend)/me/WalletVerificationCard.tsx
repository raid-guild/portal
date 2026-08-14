'use client'

import React, { useState } from 'react'

import { Button } from '@/components/ui/button'

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

type WalletVerificationCardProps = {
  profileExists: boolean
  walletAddress?: string | null
  walletVerifiedAt?: string | null
}

const abbreviatedAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

const responseMessage = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => null)

  if (!response.ok) throw new Error(json?.message || fallback)

  return json
}

export const WalletVerificationCard: React.FC<WalletVerificationCardProps> = ({
  profileExists,
  walletAddress,
  walletVerifiedAt,
}) => {
  const [address, setAddress] = useState(walletAddress || null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [verifiedAt, setVerifiedAt] = useState(walletVerifiedAt || null)

  const connectAndVerify = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum

      if (!provider) {
        throw new Error('Install or open an Ethereum wallet extension to verify your address.')
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      const connectedAddress = Array.isArray(accounts) ? accounts[0] : null

      if (typeof connectedAddress !== 'string') {
        throw new Error('Your wallet did not return an Ethereum address.')
      }

      const challengeResponse = await fetch('/api/profiles/wallet', {
        body: JSON.stringify({ address: connectedAddress, intent: 'challenge' }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const challenge = await responseMessage(
        challengeResponse,
        'Unable to prepare wallet verification.',
      )
      const signature = await provider.request({
        method: 'personal_sign',
        params: [challenge.message, challenge.address],
      })

      if (typeof signature !== 'string') {
        throw new Error('Your wallet did not return a signature.')
      }

      const verificationResponse = await fetch('/api/profiles/wallet', {
        body: JSON.stringify({
          address: challenge.address,
          intent: 'verify',
          message: challenge.message,
          signature,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const verification = await responseMessage(
        verificationResponse,
        'Unable to verify this wallet.',
      )

      setAddress(verification.address)
      setVerifiedAt(verification.walletVerifiedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify this wallet.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="portal-panel">
      <p className="portal-kicker">DAO identity</p>
      <h2 className="mt-3 portal-heading-sm">Verify your member wallet</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Use the Ethereum address connected to your RaidGuild DAO membership. A signature confirms
        that you control the address without sending a transaction or paying gas. Portal may use
        this connection to show DAO membership information in the future.
      </p>

      {address ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <code className="border border-border bg-background/60 px-3 py-2" title={address}>
            {abbreviatedAddress(address)}
          </code>
          <span className="portal-pill">{verifiedAt ? 'Verified wallet' : 'Not verified'}</span>
          {verifiedAt ? (
            <span className="text-xs text-muted-foreground">
              Verified {new Date(verifiedAt).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">No DAO member wallet is connected.</p>
      )}

      <Button
        className="mt-5"
        disabled={!profileExists || isLoading}
        onClick={connectAndVerify}
        type="button"
        variant="outline"
      >
        {isLoading
          ? 'Waiting for signature...'
          : verifiedAt
            ? 'Change verified wallet'
            : 'Connect and verify wallet'}
      </Button>
      {!profileExists ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Create or claim your Portal profile before connecting a wallet.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
