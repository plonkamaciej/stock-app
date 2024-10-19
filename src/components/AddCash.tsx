import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface AddCashProps {
  portfolioId: string;
  userId: string;

}

const AddCash: React.FC<AddCashProps> = ({ portfolioId, userId }) => {
  const [amount, setAmount] = useState<string>('');
  const [isValidAmount, setIsValidAmount] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const numericAmount = parseFloat(amount);
    setIsValidAmount(numericAmount > 0 && !isNaN(numericAmount));
  }, [amount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Usuń zera wiodące i zachowaj tylko cyfry
    const sanitizedValue = value.replace(/^0+/, '').replace(/[^\d]/g, '');
    setAmount(sanitizedValue);
  };

  const handleAddCash = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post('http://localhost:5000/add_cash', {
        portfolio_id: portfolioId,
        user_id: userId,
        amount: parseFloat(amount) || 0,
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
      <h2 className="text-xl font-semibold">Dodaj gotówkę do konta</h2>
      <Input
        type="text"
        placeholder="Kwota"
        value={amount}
        onChange={handleInputChange}
      />
      <Button onClick={handleAddCash} disabled={loading || !isValidAmount}>
        {loading ? 'Dodawanie gotówki...' : 'Dodaj gotówkę'}
      </Button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default AddCash;
