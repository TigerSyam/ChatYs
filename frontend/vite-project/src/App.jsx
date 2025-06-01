import React, { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import Auth from './components/Auth';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Check for existing token
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthSuccess = (newToken) => {
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className={`app-container ${theme}`}>
      {isAuthenticated ? (
        <>
          <header className="app-header">
            <h1>ChatY</h1>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </header>
          <ChatWindow token={token} onThemeChange={handleThemeChange} />
        </>
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
};

export default App;
