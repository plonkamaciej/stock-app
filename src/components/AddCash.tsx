import React, { useState } from 'react';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface AddCashProps {
  portfolioId: string;
  userId: string;

}

const AddCash: React.FC<AddCashProps> = ({ portfolioId, userId }) => {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAddCash = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post('http://localhost:5000/add_cash', {
        portfolio_id: portfolioId,
        user_id: userId,
        amount: amount,
      });

      if (response.status === 200) {
        setMessage(`Successfully added $${amount} to your account. New balance: $${response.data.new_cash_balance}`);
      } else {
        setMessage('Failed to add cash to your account.');
      }
    } catch (error : any) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
      window.location.reload()
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Add Cash to Account</h2>
      <Input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <Button onClick={handleAddCash} disabled={loading}>
        {loading ? 'Adding Cash...' : 'Add Cash'}
      </Button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default AddCash;
