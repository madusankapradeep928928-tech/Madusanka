import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import MainLayout from '@/components/layouts/MainLayout';
import LoginPage from '@/components/auth/LoginPage';
import routes from './routes';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_auth') === 'true';
  });

  const handleLogin = (password: string) => {
    const adminKey = 'Pradeep1993';
    const memberKeys = ['KA12', 'NI12', 'SA12', 'RO12', 'DI12', 'MA12', 'SU12', 'LA12', 'TH12', 'CH12'];
    
    if (password === adminKey || memberKeys.includes(password)) {
      setIsAuthenticated(true);
      localStorage.setItem('is_auth', 'true');
      localStorage.setItem('user_role', password === adminKey ? 'admin' : 'member');
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <MainLayout>
      <Routes>
        {routes.map((route, index) => (
          <Route
            key={index}
            path={route.path}
            element={route.element}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <IntersectObserver />
      <AppContent />
      <Toaster position="top-center" />
    </Router>
  );
};

export default App;
