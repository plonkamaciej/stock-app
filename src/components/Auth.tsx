import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface AuthProps {
  onUserChange: (user: User | null, portfolioId: string | null) => void;
}

interface User {
  id: string;
  email: string;
}

const Auth: React.FC<AuthProps> = ({ onUserChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Ensure the effect only runs once when the component mounts
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    const storedPortfolioId = localStorage.getItem('portfolio_id');

    // Only call onUserChange if session data is found
    if (storedToken && storedUser && storedPortfolioId) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      onUserChange(parsedUser, storedPortfolioId);
    }
    // The empty dependency array ensures this useEffect runs only once on mount
  }, []); // Empty array makes sure the effect runs only once

  const handleSignIn = async () => {
    setLoading(true);
    try {
      // Send authentication request to Flask backend
      const response = await axios.post('http://localhost:5000/authenticate', { email, password });
      
      // Destructure the data returned from the Flask backend
      const { user_id, portfolio_id, access_token } = response.data;
      
      // Store session token and user data in localStorage
      const loggedInUser: User = { id: user_id, email };
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      localStorage.setItem('portfolio_id', portfolio_id);

      setUser(loggedInUser);
      onUserChange(loggedInUser, portfolio_id);
    } catch (error: any) {
      console.error('Authentication failed:', error.response?.data || error.message);
      onUserChange(null, null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = useCallback(() => {
    // Clear session data from state and localStorage
    setUser(null);
    onUserChange(null, null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('portfolio_id');
  }, [onUserChange]);

  const handleSignUp = async () => {
    setLoading(true);
    try {
        const response = await axios.post('http://localhost:5000/signup', { email, password });
        const { user_id, portfolio_id, access_token } = response.data;

        const loggedInUser: User = { id: user_id, email };
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        localStorage.setItem('portfolio_id', portfolio_id);

        setUser(loggedInUser);
        onUserChange(loggedInUser, portfolio_id);
        setIsModalOpen(false);
    } catch (error: any) {
        const errorMessage = error.response?.data?.error || "Unknown error occurred during signup";
        console.error('Rejestracja nie powiodła się:', errorMessage);
        alert(`Rejestracja nie powiodła się: ${errorMessage}`);
    } finally {
        setLoading(false);
    }
};

  return (
    <div className="space-y-4 mb-5">
      {user ? (
        <div>
          <p>Witaj, {user.email}
          <Button onClick={handleSignOut} variant="outline" className="ml-5">
            Wyloguj
          </Button>
          </p>
        </div>
      ) : (
        <>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handleSignIn} disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Zarejestruj się</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rejestracja</DialogTitle>
              </DialogHeader>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={handleSignUp} disabled={loading}>
                {loading ? 'Rejestracja...' : 'Zarejestruj się'}
              </Button>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default Auth;
