import React, { useState } from 'react';
import Auth from '../components/Auth';
import Portfolio from '../components/Portfolio';

interface User {
  id: string;
  email: string;
}

const AuthWrapper: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  const handleUserChange = (user: User | null, portfolioId: string | null) => {
    setUser(user);
    setPortfolioId(portfolioId);
  };

  return (
    <div className="mt-8">
      <Auth onUserChange={handleUserChange} />
      {user && portfolioId && <Portfolio userId={user.id} portfolioId={portfolioId} />}
    </div>
  );
};

export default AuthWrapper;
