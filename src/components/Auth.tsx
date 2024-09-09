import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';

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

  return (
    <div className="space-y-4 mb-5">
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <Button onClick={handleSignOut}>
            Sign Out
          </Button>
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handleSignIn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in with Email'}
          </Button>
        </>
      )}
    </div>
  );
};

export default Auth;
