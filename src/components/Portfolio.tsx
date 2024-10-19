// Portfolio.tsx

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

// Import Crosshair Plugin
import CrosshairPlugin from 'chartjs-plugin-crosshair'
import Chart from 'chart.js/auto'
import Watchlist from './Watchlist'
import { Loader2 } from 'lucide-react'

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [stockOrder, setStockOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Funkcja do wymuszenia ponownego renderowania
  const handleTransactionComplete = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  // Fetch portfolio data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Pobieranie danych portfolio
        const response = await axios.get('http://localhost:5000/get_all_stocks', {
          params: { user_id: userId },
        });
        setPortfolio({ stocks: response.data.owned_stocks });

        // Ładowanie zapisanego porządku z localStorage
        const savedOrder = localStorage.getItem(`stockOrder_${userId}`);
        if (savedOrder) {
          setStockOrder(JSON.parse(savedOrder));
        }

        // Tutaj możesz dodać inne zapytania, jeśli są potrzebne
      } catch (err) {
        console.error(err);
        setError('Wystąpił błąd podczas ładowania danych.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, refreshKey]);

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

  // Filter out stocks with quantity of 0
  const nonZeroStocks = portfolio?.stocks.filter((stock) => stock.quantity > 0) || [];
  console.log(nonZeroStocks)

  useEffect(() => {
    // Ładowanie zapisanego porządku z localStorage
    const savedOrder = localStorage.getItem(`stockOrder_${userId}`);
    if (savedOrder) {
      setStockOrder(JSON.parse(savedOrder));
    }
  }, [userId]);

  useEffect(() => {
    // Aktualizacja stockOrder, gdy portfolio się zmieni
    if (portfolio?.stocks) {
      const newOrder = stockOrder.length > 0
        ? stockOrder.filter(symbol => portfolio.stocks.some(stock => stock.stock_symbol === symbol))
        : portfolio.stocks.map(stock => stock.stock_symbol);
      setStockOrder(newOrder);
    }
  }, [portfolio]);

  const onDragEnd = (result: any) => {
    if (!result.destination || !portfolio) {
      return;
    }

    const newOrder = Array.from(stockOrder);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);

    setStockOrder(newOrder);
    localStorage.setItem(`stockOrder_${userId}`, JSON.stringify(newOrder));
  };

  // Sortowanie akcji zgodnie z zapisanym porządkiem
  const sortedStocks = useMemo(() => {
    if (!portfolio?.stocks) return [];
    return [...portfolio.stocks].sort((a, b) => {
      const indexA = stockOrder.indexOf(a.stock_symbol);
      const indexB = stockOrder.indexOf(b.stock_symbol);
      return indexA - indexB;
    });
  }, [portfolio, stockOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="mr-2 h-16 w-16 animate-spin" />
        <span className="text-xl font-semibold">Ładowanie danych...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-xl font-semibold text-red-500">{error}</span>
      </div>
    );
  }

  if (nonZeroStocks?.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Twoje Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Aktualnie nie posiadasz żadnych akcji w swoim portfolio.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Dodaj Środki</CardTitle>
          </CardHeader>
          <CardContent>
            <AddCash portfolioId={portfolioId} userId={userId}/>
          </CardContent>
        </Card>
        
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Transakcje Akcji</CardTitle>
          </CardHeader>
          <CardContent>
            <StockTransaction 
              userId={userId} 
              portfolioId={portfolioId} 
              ownedStocks={nonZeroStocks}
              onTransactionComplete={handleTransactionComplete}
            />
          </CardContent>
        </Card>

            <Watchlist userId={userId} />

      </div>
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

  // Funkcja do generowania koloru tła
  const generateBackgroundColor = (symbol: string) => {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 80%)`;
  };

  return (
    <div className="grid grid-cols-2 gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="stocks">
              {(provided) => (
                <ul 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="mt-4 max-h-96 overflow-y-auto space-y-2"
                >
                  {sortedStocks.map((stock, index) => (
                    <Draggable key={stock.stock_symbol} draggableId={stock.stock_symbol} index={index}>
                      {(provided, snapshot) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`rounded-lg p-4 ease-in-out cursor-pointer
                            ${snapshot.isDragging ? 'bg-accent shadow-lg' : 'bg-card hover:bg-accent/50'}`}
                          onClick={() => {
                            setSelectedStock(stock)
                            setTimeframe('1mo')
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div 
                                className="h-12 w-12 rounded-full flex items-center justify-center text-primary-foreground font-bold"
                                style={{ backgroundColor: generateBackgroundColor(stock.stock_symbol) }}
                              >
                                {stock.stock_symbol.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{stock.stock_symbol}</p>
                                <p className="text-sm text-muted-foreground">{stock.quantity.toFixed(6)} akcji</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">$ {stock.value.toFixed(2)}</p>
                              <p className={`text-sm ${parseFloat(stock.return) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {parseFloat(stock.return) >= 0 ? '+' : ''}{stock.return}
                              </p>
                            </div>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      <CashBalanceCard userId={userId} portfolioId={portfolioId} />

      {/* Stock Transactions and Add Cash Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Stock Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <StockTransaction 
            userId={userId} 
            portfolioId={portfolioId} 
            ownedStocks={nonZeroStocks}
            onTransactionComplete={handleTransactionComplete}
          />
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
      <div className="col-span-2">
        <Watchlist userId={userId} />
      </div>
      
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
              <p>Average Price: {selectedStock.average_price.toFixed(2)}$</p>
              <p>Current Price: {selectedStock.current_price.toFixed(2)}$</p>
              <p>Current Value: {selectedStock.value.toFixed(2)}$</p>
              <p>Return: {selectedStock.return}</p>
              <p>Reurn in USD: {((selectedStock.current_price - selectedStock.average_price)*selectedStock.quantity).toFixed(2)}$</p>
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
