// Portfolio.tsx

import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import StockTransaction from './StockTransaction'
import AddCash from './AddCash'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'
import 'chartjs-adapter-date-fns'
import { Button } from './ui/button'
import ReactDOM from 'react-dom'
import CashBalanceCard from './CashBalanceCard'

// Import Crosshair Plugin
import CrosshairPlugin from 'chartjs-plugin-crosshair'
import Chart from 'chart.js/auto'

// Register the Crosshair Plugin
Chart.register(CrosshairPlugin)

// Define chartOptions outside the component
const chartOptions = {
  responsive: true,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  hover: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    crosshair: {
      line: {
        color: '#F66', // Crosshair line color
        width: 1,      // Crosshair line width
      },
      sync: {
        enabled: false, // Disable synchronization with other charts
      },
      zoom: {
        enabled: false, // Disable zooming
      },
      snap: {
        enabled: true, // Snap to data points
      },
      callbacks: {
        beforeZoom: () => false, // Prevent zooming
        afterZoom: () => {},     // Do nothing after zoom
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function (context : any) {
          const label = context.dataset.label || ''
          const value = context.parsed.y || 0
          return `${label}: $${value.toFixed(2)}`
        },
      },
    },
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'month',
        displayFormats: {
          month: 'MMM yyyy',
        },
        tooltipFormat: 'PP',
      },
      title: {
        display: true,
        text: 'Date',
      },
      grid: {
        display: true,
      },
    },
    y: {
      beginAtZero: false,
      title: {
        display: true,
        text: 'Price',
      },
      grid: {
        display: true,
      },
    },
  },
}

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

interface HistoricalDataPoint {
  date: string // Ensure this is a valid date string
  close: number
}

const Portfolio: React.FC<PortfolioProps> = ({ userId, portfolioId }) => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[] | null>(null)
  const [historicalLoading, setHistoricalLoading] = useState<boolean>(false)
  const [historicalError, setHistoricalError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<string>('1mo') // Default timeframe

  const isMounted = useRef(true) // To prevent setting state on unmounted component

  // Timeframe options mapping
  const timeframeOptions = [
    { label: '1 Day', value: '1d' },
    { label: '1 Month', value: '1mo' },
    { label: '1 Year', value: '1y' },
    { label: '2 Years', value: '2y' },
    { label: '5 Years', value: '5y' },
    { label: 'Max', value: 'max' },
  ]

  console.log(portfolioId)

  // Fetch portfolio data
  useEffect(() => {
    isMounted.current = true
    const fetchPortfolio = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get_all_stocks', {
          params: { user_id: userId },
        })
        if (isMounted.current) {
          setPortfolio({ stocks: response.data.owned_stocks })
        }
      } catch (err) {
        console.error(err)

      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    }

    fetchPortfolio()

    return () => {
      isMounted.current = false
    }
  }, [userId])

  // Fetch historical data when a stock or timeframe is selected
  useEffect(() => {
    let didCancel = false
    if (selectedStock) {
      const fetchHistoricalData = async () => {
        setHistoricalLoading(true)
        setHistoricalData(null) // Clear old data
        try {
          const response = await axios.get('http://localhost:5000/get_historical_data', {
            params: {
              stock_symbol: selectedStock.stock_symbol,
              timeframe: timeframe,
            },
            timeout: 10000, // 10 seconds timeout
          })
          if (!didCancel) {
            setHistoricalData(response.data.historical_prices)
            setHistoricalError(null)
          }
        } catch (err: any) {
          console.error(err)
          if (!didCancel) {
            if (err.response && err.response.data && err.response.data.error) {
              setHistoricalError(err.response.data.error)
            } else {
              setHistoricalError('Failed to load historical data.')
            }
            setHistoricalData(null)
          }
        } finally {
          if (!didCancel) {
            setHistoricalLoading(false)
          }
        }
      }

      fetchHistoricalData()

      // Cleanup function to cancel outdated requests
      return () => {
        didCancel = true
      }
    }
  }, [selectedStock, timeframe])

  // Ensure that historicalData is available
  const chartData = historicalData && selectedStock ? {
    datasets: [
      {
        label: `${selectedStock.stock_symbol} Price`,
        data: historicalData.map((point) => ({
          x: new Date(point.date), // Convert to Date object
          y: point.close,
        })),
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
        pointRadius: 0, // Hide the points to make the line smooth
      },
    ],
  } : null

  if (loading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p>{error}</p>
  }



  // Filter out stocks with quantity of 0
  const nonZeroStocks = portfolio?.stocks.filter((stock) => stock.quantity > 0)

  if (nonZeroStocks?.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You currently have no valid stocks in your portfolio.</p>
          <AddCash portfolioId={portfolioId} userId={userId}/>
          <StockTransaction userId={userId} portfolioId={portfolioId} />
        </CardContent>
      </Card>
    )
  }

  // Function to close the modal
  const closeModal = () => {
    setSelectedStock(null)
    setHistoricalData(null)
    setHistoricalError(null)
  }

  // Modal Component using Card from shadcn UI
  const Modal = ({ children }: { children: React.ReactNode }) => {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-black opacity-50"
          onClick={closeModal}
        ></div>
        {/* Modal content using Card */}
        <Card className="relative z-10 w-[800px] p-6">
          {children}
        </Card>
      </div>,
      document.body,
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5">
<Card>
  <CardHeader>
    <CardTitle className="text-xl">Portfolio Stocks</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="mt-4 max-h-96 overflow-y-scroll custom-scrollbar">
      <ul className="list-inside list-disc">
        {nonZeroStocks?.map((stock) => (
          <li
            key={stock.stock_symbol}
            className="mb-4 flex cursor-pointer items-center"
            onClick={() => {
              setSelectedStock(stock)
              setTimeframe('1mo') // Reset timeframe when a new stock is selected
            }}
          >
            <div className="mr-5 flex h-[80px] w-[80px] items-center justify-center rounded-lg bg-black">
              <p className="text-2xl font-extrabold text-white">
                {stock.stock_symbol}
              </p>
            </div>

            <div>
              <p>Company Name: {stock.company_name}</p>
              <p>Quantity: {stock.quantity}</p>
              <p>Average Price: ${stock.average_price.toFixed(2)}</p>
              <p>Current Price: ${stock.current_price.toFixed(2)}</p>
              <p>Current Value: ${stock.value.toFixed(2)}</p>
              <p>Return: {stock.return}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </CardContent>
</Card>


      {/* Stock Transactions and Add Cash Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Stock Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <StockTransaction userId={userId} portfolioId={portfolioId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Add Cash</CardTitle>
        </CardHeader>
        <CardContent>
          <AddCash portfolioId={portfolioId} userId={userId} />
        </CardContent>
      </Card>

      <CashBalanceCard userId={userId} portfolioId={portfolioId} />


      {/* Modal for Stock Details */}
      {selectedStock && (
        <Modal>
          <div className="flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedStock.stock_symbol} Details
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div>
              <p>Company Name: {selectedStock.company_name}</p>
              <p>Quantity: {selectedStock.quantity}</p>
              <p>Average Price: ${selectedStock.average_price.toFixed(2)}</p>
              <p>Current Price: ${selectedStock.current_price.toFixed(2)}</p>
              <p>Current Value: ${selectedStock.value.toFixed(2)}</p>
              <p>Return: {selectedStock.return}</p>
            </div>

            <div className="my-4">
              <p>Select Timeframe:</p>
              <div className="flex flex-wrap">
                {timeframeOptions.map((option) => (
                  <Button
                    className="mr-3 mt-2"
                    key={option.value}
                    onClick={() => setTimeframe(option.value)}
                    disabled={historicalLoading}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>



            {/* Display the graph */}
            <div className="mt-5" style={{ height: '400px' }}>
              {historicalLoading && <p>Loading historical data...</p>}
              {historicalError && <p>{historicalError}</p>}
              {!historicalLoading && historicalData && historicalData.length > 0 && chartData && (
                <Line data={chartData} options={chartOptions} />
              )}
              {!historicalLoading && historicalData && historicalData.length === 0 && (
                <p>No historical data available for this timeframe.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Portfolio
