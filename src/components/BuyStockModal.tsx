import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";

interface BuyStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  userId: string;
  stockSymbol: string;
  currentPrice: number;
}

const BuyStockModal: React.FC<BuyStockModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userId,
  stockSymbol,
  currentPrice,
}) => {
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCashBalance = async () => {
      if (!isOpen) return;  // Ensure fetch only happens if modal is open
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/get_cash_balance', {
          params: { user_id: userId }
        });
        setCashBalance(response.data.cash_balance);
        setLoading(false);
        setAmount(0);  // Reset amount when modal opens
      } catch (err) {
        setError('Failed to fetch cash balance.');
        setLoading(false);
      }
    };

    fetchCashBalance();
  }, [isOpen, userId]);

  const handleAmountChange = (value: number[]) => {
    setAmount(parseFloat(value[0].toFixed(2)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= cashBalance) {
      setAmount(parseFloat(value.toFixed(2)));
    }
  };

  const quantity = amount / currentPrice;

  const handleBuy = () => {
    onConfirm(quantity);
    onClose();  // Close the modal after confirming
  };

  if (!isOpen) return null; // Ensure modal isn't rendered when closed

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy {stockSymbol} Stock</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-2">Available Balance: ${cashBalance.toFixed(2)}</p>
          <p className="mb-2">Choose the amount to invest:</p>
          <Slider
            min={0}
            max={cashBalance}
            step={0.01}
            value={[amount]}
            onValueChange={handleAmountChange}
          />
          <Input
            type="number"
            value={amount}
            onChange={handleInputChange}
            min={0}
            max={cashBalance}
            step={0.01}
            className="mt-2"
          />
          <p className="mt-2">
            Price per share: ${currentPrice.toFixed(2)}
          </p>
          <p className="mt-2">
            Shares to buy: {quantity.toFixed(6)}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleBuy} disabled={amount <= 0 || amount > cashBalance}>
            Buy for ${amount.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuyStockModal;
