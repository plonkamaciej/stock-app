import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface CashBalanceCardProps {
  userId: string
  portfolioId: string
}

const CashBalanceCard: React.FC<CashBalanceCardProps> = ({ userId, portfolioId }) => {
  const [cashBalance, setCashBalance] = useState<number | null>(null)
  const [totalStocksValue, setTotalStocksValue] = useState<number | null>(null)
  const [totalPortfolioValue, setTotalPortfolioValue] = useState<number | null>(null)
  const [totalInvested, setTotalInvested] = useState<number | null>(null)
  const [investmentData, setInvestmentData] = useState<any[]>([])
  const [historyData, setHistoryData] = useState<any[]>([]) // To store portfolio history
  const [loadingPortfolio, setLoadingPortfolio] = useState<boolean>(true)
  const [loadingChart, setLoadingChart] = useState<boolean>(true)
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true) // For portfolio history
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const [chartError, setChartError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null) // For portfolio history

  // Fetch portfolio data
  useEffect(() => {
    const fetchPortfolioData = async () => {
      setLoadingPortfolio(true)
      try {
        const portfolioResponse = await axios.get('http://localhost:5000/get_cash_balance', {
          params: { user_id: userId },
        })
        setCashBalance(portfolioResponse.data.cash_balance)
        setTotalStocksValue(portfolioResponse.data.total_stocks_value)
        setTotalPortfolioValue(portfolioResponse.data.total_portfolio_value)
        setTotalInvested(portfolioResponse.data.total_invested)
      } catch (err: any) {
        console.error(err)
        setPortfolioError('Failed to load portfolio data.')
      } finally {
        setLoadingPortfolio(false)
      }
    }

    fetchPortfolioData()
  }, [userId])

  // Fetch portfolio history data for return_value and invested_value
  useEffect(() => {
    const fetchPortfolioHistory = async () => {
      setLoadingHistory(true)
      try {
        const historyResponse = await axios.get('http://localhost:5000/get_portfolio_history', {
          params: { portfolio_id: portfolioId }, 
        })
        
        // Dodaj punkt zerowy przed pierwszą inwestycją
        const sortedData = historyResponse.data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        if (sortedData.length > 0) {
          const firstDate = new Date(sortedData[0].created_at);
          firstDate.setDate(firstDate.getDate() - 1); // Ustaw datę na dzień przed pierwszą inwestycją
          const zeroPoint = {
            created_at: firstDate.toISOString(),
            invested_value: 0,
            return_value: 0
          };
          sortedData.unshift(zeroPoint);
        }
        
        setHistoryData(sortedData)
      } catch (err: any) {
        console.error(err)
        setHistoryError('Nie udało się załadować danych historycznych portfela.')
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchPortfolioHistory()
  }, [portfolioId])

  const isLoading = loadingPortfolio || loadingHistory

  const formatXAxisDate = (tickItem: string) => {
    const date = new Date(tickItem)
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  // Tooltip style customization
  const tooltipStyle = {
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid',
    borderColor: '#ccc',
  }

  if (portfolioError || historyError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{portfolioError || historyError}</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          Portfolio Overview - Zwrot całkowity: ${(totalPortfolioValue - totalInvested).toFixed(2)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Cash Balance: ${cashBalance?.toFixed(2)}</p>
        <p>Total Stocks Value: ${totalStocksValue?.toFixed(2)}</p>
        <p>Total Portfolio Value: ${totalPortfolioValue?.toFixed(2)}</p>
        <p>Your money invested: ${totalInvested?.toFixed(2)}</p>

        <ResponsiveContainer width="100%" height={300} className="p-3 mt-8">
          <LineChart data={historyData}> {/* Plot return_value and invested_value */}
            <XAxis dataKey="created_at" tickFormatter={formatXAxisDate} />
            <YAxis />
            <Tooltip contentStyle={tooltipStyle} />
            
            {/* Line for Invested Value */}
            <Line type="monotone" dataKey="invested_value" stroke="#8884d8" />

            {/* Line for Return Value */}
            <Line type="monotone" dataKey="return_value" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default CashBalanceCard
