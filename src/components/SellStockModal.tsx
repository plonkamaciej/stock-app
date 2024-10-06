import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";

interface SellStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  stockSymbol: string;
  currentPrice: number;
  ownedQuantity: number;
}

const SellStockModal: React.FC<SellStockModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  stockSymbol,
  currentPrice,
  ownedQuantity,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const maxSellValue = ownedQuantity * currentPrice;

  useEffect(() => {
    if (isOpen) {
      setAmount(0);  // Reset amount when modal opens
    }
  }, [isOpen]);

  const handleAmountChange = (value: number[]) => {
    setAmount(parseFloat(value[0].toFixed(2)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= maxSellValue) {
      setAmount(parseFloat(value.toFixed(2)));
    }
  };

  const quantityToSell = amount / currentPrice;

  const handleSell = () => {
    console.log("Sprzedaż akcji:", { stockSymbol, amount, currentPrice });
    onConfirm(amount);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sprzedaj akcje {stockSymbol}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-2">Posiadane akcje: {ownedQuantity.toFixed(6)}</p>
          <p className="mb-2">Maksymalna wartość do sprzedaży: ${maxSellValue.toFixed(2)}</p>
          <p className="mb-2">Wybierz kwotę do sprzedaży:</p>
          <Slider
            min={0}
            max={maxSellValue}
            step={0.01}
            value={[amount]}
            onValueChange={handleAmountChange}
          />
          <Input
            type="number"
            value={amount}
            onChange={handleInputChange}
            min={0}
            max={maxSellValue}
            step={0.01}
            className="mt-2"
          />
          <p className="mt-2">
            Cena za akcję: ${currentPrice.toFixed(2)}
          </p>
          <p className="mt-2">
            Akcje do sprzedaży: {quantityToSell.toFixed(6)}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Anuluj
          </Button>
          <Button onClick={handleSell} disabled={amount <= 0 || amount > maxSellValue}>
            Sprzedaj za ${amount.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SellStockModal;