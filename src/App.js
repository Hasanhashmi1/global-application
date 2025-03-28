import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login/login';
import Dashboard from './components/dashboard/dashboard';
import { useState } from 'react';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('authToken');
  });

  return (
    <BrowserRouter basename="/global-application">
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login setIsAuthenticated={setIsAuthenticated} />
        } />
        
        <Route path="/dashboard" element={
          isAuthenticated ? <Dashboard setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/login" replace />
        } />
        
        <Route path="/" element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;