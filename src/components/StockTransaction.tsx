import React, { useState } from 'react';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface StockTransactionProps {
  userId: string;
  portfolioId: string;
}

const StockTransaction: React.FC<StockTransactionProps> = ({ userId, portfolioId }) => {
  const [stockSymbol, setStockSymbol] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleTransaction = async () => {
    if (loading) return; // Prevent duplicate submissions
    setLoading(true);
    setMessage(null);

    // Validate quantity
    if (quantity <= 0) {
      setMessage('Quantity must be greater than zero.');
      setLoading(false);
      return;
    }

    const endpoint = transactionType === 'buy' ? 'buy_stock' : 'sell_stock';
    const apiUrl = `http://localhost:5000/${endpoint}`;

    try {
      const response = await axios.post(apiUrl, {
        user_id: userId,
        portfolio_id: portfolioId,
        stock_symbol: stockSymbol.toUpperCase(), // Uppercase stock symbol for consistency
        quantity: quantity,
      });

      if (response.status === 200) {
        setMessage(`${transactionType === 'buy' ? 'Bought' : 'Sold'} ${quantity} shares of ${stockSymbol.toUpperCase()} successfully.`);
      } else {
        setMessage(`Failed to ${transactionType === 'buy' ? 'buy' : 'sell'} stock.`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{transactionType === 'buy' ? 'Buy Stock' : 'Sell Stock'}</h2>
      <Input
        type="text"
        placeholder="Stock Symbol"
        value={stockSymbol}
        onChange={(e) => setStockSymbol(e.target.value.toUpperCase())} // Automatically uppercase stock symbol
      />
      <Input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        min={1} // Ensure quantity is at least 1
      />
      <div className="flex space-x-4">
        <Button variant={transactionType === 'buy' ? 'default' : 'ghost'} onClick={() => setTransactionType('buy')}>
          Buy
        </Button>
        <Button variant={transactionType === 'sell' ? 'default' : 'ghost'} onClick={() => setTransactionType('sell')}>
          Sell
        </Button>
      </div>
      <Button
        onClick={handleTransaction}
        disabled={loading || !stockSymbol || quantity <= 0} // Disable if inputs are invalid
      >
        {loading ? 'Processing...' : `${transactionType === 'buy' ? 'Buy' : 'Sell'} Stock`}
      </Button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default StockTransaction;
