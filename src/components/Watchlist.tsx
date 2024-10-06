import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, Trash2 } from "lucide-react";
import axios from 'axios';
import { stockSymbolList } from '../data/stockSymbols';
import { cn } from "@/lib/utils";

interface Stock {
  stock_symbol: string;
  company_name: string;
  current_price: number;
  daily_return: number;
  day_low: number;
  day_high: number;
  fifty_two_week_low: number;
  fifty_two_week_high: number;
}

interface WatchlistProps {
  userId: string;
}

const PriceRangeBar: React.FC<{
  currentPrice: number;
  lowPrice: number;
  highPrice: number;
  label: string;
}> = ({ currentPrice, lowPrice, highPrice, label }) => {
  const range = highPrice - lowPrice;
  const position = ((currentPrice - lowPrice) / range) * 100;

  return (
    <div className="mb-2">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="relative h-1 bg-gray-200 rounded-full">
        <div
          className="absolute h-full bg-green-500 rounded-full"
          style={{ width: `${position}%` }}
        ></div>
        <div
          className="absolute w-2 h-2 bg-white border-2 border-green-500 rounded-full -mt-0.5 transform -translate-x-1/2"
          style={{ left: `${position}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>${lowPrice.toFixed(2)}</span>
        <span>${currentPrice.toFixed(2)}</span>
        <span>${highPrice.toFixed(2)}</span>
      </div>
    </div>
  );
};

export const Watchlist: React.FC<WatchlistProps> = ({ userId }) => {
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [newStock, setNewStock] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  useEffect(() => {
    fetchWatchlist();
  }, [userId]);

  useEffect(() => {
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    const fetchSuggestions = () => {
      if (newStock.length > 0) {
        const filteredSuggestions = stockSymbolList.filter(stock => 
          stock.symbol.toLowerCase().includes(newStock.toLowerCase()) ||
          stock.name.toLowerCase().includes(newStock.toLowerCase())
        );
        
        const sortedSuggestions = filteredSuggestions.sort((a, b) => {
          const aSymbolMatch = a.symbol.toLowerCase().startsWith(newStock.toLowerCase());
          const bSymbolMatch = b.symbol.toLowerCase().startsWith(newStock.toLowerCase());
          const aNameMatch = a.name.toLowerCase().startsWith(newStock.toLowerCase());
          const bNameMatch = b.name.toLowerCase().startsWith(newStock.toLowerCase());
          
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
  }, [newStock, inputFocused]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/watchlist?user_id=${userId}`);
      setWatchlist(response.data);
      setLoading(false);
    } catch (err) {
      setError('Nie udało się załadować watchlisty');
      setLoading(false);
    }
  };

  const addToWatchlist = async () => {
    try {
      await axios.post(`http://localhost:5000/watchlist/add`, {
        user_id: userId,
        stock_symbol: newStock.toUpperCase()
      });
      setNewStock('');
      fetchWatchlist();
    } catch (err) {
      setError('Nie udało się dodać akcji do watchlisty');
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await axios.delete(`http://localhost:5000/watchlist/remove?user_id=${userId}&stock_symbol=${symbol}`);
      fetchWatchlist();
    } catch (err) {
      setError('Nie udało się usunąć akcji z watchlisty');
    }
  };

  const handleSelectSuggestion = (symbol: string) => {
    setNewStock(symbol);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewStock(e.target.value);
  };

  const handleInputFocus = () => {
    setInputFocused(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => setInputFocused(false), 200);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(watchlist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWatchlist(items);
    // Tutaj możesz dodać logikę do zapisania nowej kolejności w bazie danych
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="watchlist">
        {(provided) => (
          <Card className="col-span-2">
            <CardContent>
              <div className="flex space-x-2 mb-4 relative mt-10">
                <Input
                  ref={inputRef}
                  placeholder="Symbol akcji lub nazwa firmy"
                  value={newStock}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <Button onClick={addToWatchlist}>
                  <Plus className="h-4 w-4 mr-2" /> Dodaj
                </Button>
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
              {error && <p className="text-red-500 mb-4">{error}</p>}
              {loading ? (
                <p>Ładowanie watchlisty...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Nazwa firmy</TableHead>
                      <TableHead>Cena</TableHead>
                      <TableHead>Dzienny zwrot</TableHead>
                      <TableHead>Zakresy cenowe</TableHead>
                      <TableHead>Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                    {watchlist.map((stock, index) => (
                      <Draggable key={stock.stock_symbol} draggableId={stock.stock_symbol} index={index}>
                        {(provided, snapshot) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "transition-colors",
                              snapshot.isDragging && "bg-accent shadow-lg"
                            )}
                            style={{
                              ...provided.draggableProps.style,
                              marginBottom: '8px',
                            }}
                          >
                            <TableCell>{stock.stock_symbol}</TableCell>
                            <TableCell>{stock.company_name}</TableCell>
                            <TableCell>${stock.current_price.toFixed(2)}</TableCell>
                            <TableCell className={stock.daily_return >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {stock.daily_return.toFixed(2)}%
                            </TableCell>
                            <TableCell>
                              <PriceRangeBar
                                currentPrice={stock.current_price}
                                lowPrice={stock.day_low}
                                highPrice={stock.day_high}
                                label="ZAKRES DZIENNY"
                              />
                              <PriceRangeBar
                                currentPrice={stock.current_price}
                                lowPrice={stock.fifty_two_week_low}
                                highPrice={stock.fifty_two_week_high}
                                label="ZAKRES 52-TYGODNIOWY"
                              />
                            </TableCell>
                            <TableCell>
                              <Button variant="destructive" size="sm" onClick={() => removeFromWatchlist(stock.stock_symbol)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default Watchlist;