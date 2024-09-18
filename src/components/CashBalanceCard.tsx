// CashBalanceCard.tsx

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'

interface CashBalanceCardProps {
  userId: string
}

const CashBalanceCard: React.FC<CashBalanceCardProps> = ({ userId }) => {
  const [cashBalance, setCashBalance] = useState<number | null>(null)
  const [totalStocksValue, setTotalStocksValue] = useState<number | null>(null)
  const [totalPortfolioValue, setTotalPortfolioValue] = useState<number | null>(null)
  const [totalInvested, setTotalInvested] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get_cash_balance', {
          params: { user_id: userId },
        })
        setCashBalance(response.data.cash_balance)
        setTotalStocksValue(response.data.total_stocks_value)
        setTotalPortfolioValue(response.data.total_portfolio_value)
        setTotalInvested(response.data.total_invested)
      } catch (err: any) {
        console.error(err)
        setError('Failed to load portfolio data.')
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Portfolio Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Cash Balance: ${cashBalance?.toFixed(2)}</p>
        <p>Total Stocks Value: ${totalStocksValue?.toFixed(2)}</p>
        <p>Total Portfolio Value: ${totalPortfolioValue?.toFixed(2)}</p>
        <p>Your money invested: ${totalInvested?.toFixed(2)}</p>
      </CardContent>
    </Card>
  )
}

export default CashBalanceCard
