import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import BuyStockModal from './BuyStockModal';
import SellStockModal from './SellStockModal';
import { stockSymbolList } from '../data/stockSymbols';
import { cn } from "@/lib/utils";

interface StockTransactionProps {
  userId: string;
  portfolioId: string;
  ownedStocks: {
    stock_symbol: string;
    quantity: number;
  }[];
}

const StockTransaction: React.FC<StockTransactionProps> = ({
  userId,
  portfolioId,
  ownedStocks,
}) => {
  const [stockSymbol, setStockSymbol] = useState('');
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cashBalance, setCashBalance] = useState(0);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [currentStockPrice, setCurrentStockPrice] = useState(0);
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchCashBalance = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/get_cash_balance?user_id=${userId}`
        );
        setCashBalance(response.data.cash_balance);
        setTotalPortfolioValue(response.data.total_portfolio_value);
      } catch (error) {
        console.error('Error fetching account balance:', error);
      }
    };

    fetchCashBalance();
  }, [userId]);

  useEffect(() => {
    const fetchStockPrice = async () => {
      if (stockSymbol) {
        try {
          // Fetch the stock price from the Flask API
          const response = await axios.get(
            `http://localhost:5000/get_stock_price?symbol=${stockSymbol}`
          );
          setCurrentStockPrice(response.data.price);  // Set the stock price
        } catch (error) {
          console.error('Error fetching stock price:', error);
          setMessage('Error fetching stock price. Please try again.');
        }
      }
    };

    fetchStockPrice();
  }, [stockSymbol]);

  useEffect(() => {
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    const fetchSuggestions = () => {
      if (stockSymbol.length > 0) {
        const filteredSuggestions = stockSymbolList.filter(stock => 
          stock.symbol.toLowerCase().includes(stockSymbol.toLowerCase()) ||
          stock.name.toLowerCase().includes(stockSymbol.toLowerCase())
        );
        
        const sortedSuggestions = filteredSuggestions.sort((a, b) => {
          const aSymbolMatch = a.symbol.toLowerCase().startsWith(stockSymbol.toLowerCase());
          const bSymbolMatch = b.symbol.toLowerCase().startsWith(stockSymbol.toLowerCase());
          const aNameMatch = a.name.toLowerCase().startsWith(stockSymbol.toLowerCase());
          const bNameMatch = b.name.toLowerCase().startsWith(stockSymbol.toLowerCase());
          
          if (aSymbolMatch && !bSymbolMatch) return -1;
          if (!aSymbolMatch && bSymbolMatch) return 1;
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
          return 0;
        });

        setSuggestions(sortedSuggestions);
        setShowSuggestions(inputFocused && sortedSuggestions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [stockSymbol, inputFocused]);

  const handleBuyConfirm = async (quantity: number) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post('http://localhost:5000/buy_stock', {
        user_id: userId,
        portfolio_id: portfolioId,
        stock_symbol: stockSymbol.toUpperCase(),
        amount: quantity * currentStockPrice,
      });

      if (response.status === 200) {
        
        setMessage(
          `${quantity * currentStockPrice}$ purchase successfull.`
        );

        // Update cash balance and portfolio value
        const updatedBalanceResponse = await axios.get(
          `http://localhost:5000/get_cash_balance?user_id=${userId}`
        );
        setCashBalance(updatedBalanceResponse.data.cash_balance);
        setTotalPortfolioValue(updatedBalanceResponse.data.total_portfolio_value);
      } else {
        setMessage('Failed to buy shares.');
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSellConfirm = async (amount: number) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post(
        'http://localhost:5000/sell_stock',
        {
          portfolio_id: portfolioId,
          stock_symbol: stockSymbol.toUpperCase(),
          amount: amount,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        setMessage(response.data.message);

        // Aktualizuj saldo gotówkowe i wartość portfela
        const updatedBalanceResponse = await axios.get(
          `http://localhost:5000/get_cash_balance?user_id=${userId}`
        );
        setCashBalance(updatedBalanceResponse.data.cash_balance);
        setTotalPortfolioValue(updatedBalanceResponse.data.total_portfolio_value);
      } else {
        setMessage('Nie udało się sprzedać akcji.');
      }
    } catch (error: any) {
      console.error('Błąd transakcji:', error);
      setMessage(`Błąd: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
      setIsSellModalOpen(false);
    }
  };

  const handleSelectStock = (value: string) => {
    setStockSymbol(value);
    fetchStockPrice(value);
  };

  const fetchStockPrice = async (symbol: string) => {
    if (symbol) {
      try {
        const response = await axios.get(
          `http://localhost:5000/get_stock_price?symbol=${symbol}`
        );
        setCurrentStockPrice(response.data.price);
      } catch (error) {
        console.error('Błąd podczas pobierania ceny akcji:', error);
        setMessage('Błąd podczas pobierania ceny akcji. Spróbuj ponownie.');
      }
    }
  };

  const handleTransaction = () => {
    if (transactionType === 'buy') {
      setIsBuyModalOpen(true);
    } else {
      setIsSellModalOpen(true);
    }
  };

  const handleSelectSuggestion = (symbol: string) => {
    setStockSymbol(symbol);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStockSymbol(e.target.value);
  };

  const handleInputFocus = () => {
    setInputFocused(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => setInputFocused(false), 200);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <Button
          variant={transactionType === 'buy' ? 'default' : 'ghost'}
          onClick={() => setTransactionType('buy')}
        >
          Kup
        </Button>
        <Button
          variant={transactionType === 'sell' ? 'default' : 'ghost'}
          onClick={() => setTransactionType('sell')}
        >
          Sprzedaj
        </Button>
      </div>
      <h2 className="text-xl font-semibold">
        {transactionType === 'buy' ? 'Kup akcje' : 'Sprzedaj akcje'}
      </h2>

      {transactionType === 'buy' ? (
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Symbol akcji lub nazwa firmy"
            value={stockSymbol}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul 
              className="absolute z-10 max-h-48 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md top-full left-0 mt-1"
              style={{ width: inputWidth ? `${inputWidth}px` : '100%' }}
            >
              {suggestions.map((stock) => (
                <li
                  key={stock.symbol}
                  onClick={() => handleSelectSuggestion(stock.symbol)}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  {stock.symbol} - {stock.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <Select onValueChange={handleSelectStock} value={stockSymbol}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Wybierz akcje do sprzedaży" />
          </SelectTrigger>
          <SelectContent>
            {ownedStocks.map((stock) => (
              <SelectItem key={stock.stock_symbol} value={stock.stock_symbol}>
                {stock.stock_symbol} - {stock.quantity.toFixed(6)} akcji
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="mt-4">
        <p>Saldo gotówkowe: ${cashBalance.toFixed(2)}</p>
        <p>Całkowita wartość portfela: ${totalPortfolioValue.toFixed(2)}</p>
      </div>

      <Button onClick={handleTransaction} disabled={loading || !stockSymbol}>
        {loading ? 'Przetwarzanie...' : transactionType === 'buy' ? 'Kup akcje' : 'Sprzedaj akcje'}
      </Button>

      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}

      <BuyStockModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onConfirm={handleBuyConfirm}
        userId={userId}
        stockSymbol={stockSymbol}
        currentPrice={currentStockPrice}
      />

      <SellStockModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onConfirm={handleSellConfirm}
        stockSymbol={stockSymbol}
        currentPrice={currentStockPrice}
        ownedQuantity={ownedStocks.find(stock => stock.stock_symbol === stockSymbol)?.quantity || 0}
      />
    </div>
  );
};

export default StockTransaction;