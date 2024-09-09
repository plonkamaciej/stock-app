import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import StockTransaction from './StockTransaction'
import AddCash from './AddCash'

interface PortfolioProps {
  userId: string
  portfolioId: string
}

interface Stock {
  stock_symbol: string
  quantity: number
  average_price: number
  current_price: number
  value: number
  return: string // Return as a percentage string
  company_name: string // Company name
}

interface PortfolioData {
  stocks: Stock[]
}

const Portfolio: React.FC<PortfolioProps> = ({ userId, portfolioId }) => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/get_all_stocks',
          {
            params: { user_id: userId, portfolio_id: portfolioId },
          },
        )
        setPortfolio({ stocks: response.data.owned_stocks })
      } catch (err) {
        setError('Failed to load portfolio data.')
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [userId, portfolioId])

  if (loading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p>{error}</p>
  }

  if (!portfolio || portfolio.stocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            You currently have no stocks in your portfolio. Start adding some
            stocks to see them here.
          </p>
          <AddCash portfolioId={portfolioId} />
          <StockTransaction userId={userId} portfolioId={portfolioId} />
        </CardContent>
      </Card>
    )
  }

  // Filter out stocks with quantity of 0
  const nonZeroStocks = portfolio.stocks.filter((stock) => stock.quantity > 0)

  if (nonZeroStocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You currently have no valid stocks in your portfolio.</p>
          <AddCash portfolioId={portfolioId} />
          <StockTransaction userId={userId} portfolioId={portfolioId} />
        </CardContent>
      </Card>
    )
  }

  // Helper function to generate company logo URL using stock ticker symbol
  const getStockLogoUrl = (stockSymbol: string) => {
    // Try using the stock ticker symbol to get a logo
    return `https://logo.clearbit.com/${stockSymbol.toLowerCase()}.com`
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Portfolio Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            <ul className="list-inside list-disc">
              {nonZeroStocks.map((stock) => (
                <li key={stock.stock_symbol} className="mb-4 flex items-center">
                  {/* Display Stock Icon using stock ticker */}
                  <div className="flex h-[80px] w-[80px] rounded-lg items-center justify-center bg-black mr-5">
                    <p className="text-2xl font-extrabold text-white">
                      {stock.stock_symbol}
                    </p>
                  </div>

                  <div>
                    <p>Quantity: {stock.quantity}</p>
                    <p>Average Price: ${stock.average_price.toFixed(2)}</p>
                    <p>Current Price: ${stock.current_price.toFixed(2)}</p>
                    <p>Current Value: ${stock.value.toFixed(2)}</p>
                    <p>Return: {stock.return}</p>{' '}
                    {/* Display return as a percentage */}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Stock transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <StockTransaction userId={userId} portfolioId={portfolioId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Add cash</CardTitle>
        </CardHeader>
        <CardContent>
          <AddCash portfolioId={portfolioId} />
        </CardContent>
      </Card>
    </div>
  )
}

export default Portfolio
