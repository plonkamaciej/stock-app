import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface CashBalanceCardProps {
  userId: string
}

const CashBalanceCard: React.FC<CashBalanceCardProps> = ({ userId }) => {
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

  // Fetch investment chart data
  useEffect(() => {
    const fetchInvestmentChartData = async () => {
      setLoadingChart(true)
      try {
        const chartResponse = await axios.get('http://localhost:5000/get_investment_chart_data', {
          params: { user_id: userId },
        })
        setInvestmentData(chartResponse.data.investment_over_time)
      } catch (err: any) {
        console.error(err)
        setChartError('Failed to load investment chart data.')
      } finally {
        setLoadingChart(false)
      }
    }

    fetchInvestmentChartData()
  }, [userId])

  // Fetch portfolio history data for the second line
  useEffect(() => {
    const fetchPortfolioHistory = async () => {
      setLoadingHistory(true)
      try {
        const historyResponse = await axios.get('http://localhost:5000/fetch_portfolio_history', {
          params: { portfolio_id: userId }, // Assuming userId is the portfolio_id
        })
        setHistoryData(historyResponse.data)
      } catch (err: any) {
        console.error(err)
        setHistoryError('Failed to load portfolio history data.')
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchPortfolioHistory()
  }, [userId])

  const isLoading = loadingPortfolio || loadingChart || loadingHistory

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

  if (portfolioError || chartError || historyError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{portfolioError || chartError || historyError}</p>
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
        <CardTitle className="text-xl">Portfolio Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Cash Balance: ${cashBalance?.toFixed(2)}</p>
        <p>Total Stocks Value: ${totalStocksValue?.toFixed(2)}</p>
        <p>Total Portfolio Value: ${totalPortfolioValue?.toFixed(2)}</p>
        <p>Your money invested: ${totalInvested?.toFixed(2)}</p>

        <ResponsiveContainer width="100%" height={300} className="p-3 mt-8">
          <LineChart data={investmentData}>
            <XAxis dataKey="date" tickFormatter={formatXAxisDate} />
            <YAxis />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="invested_amount" stroke="#8884d8" />
            <Line type="monotone" dataKey="total_value" stroke="#82ca9d" data={historyData} /> {/* Second line */}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default CashBalanceCard
