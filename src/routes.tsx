
import React, { ReactNode } from 'react';
import Dashboard from './pages/Dashboard';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
}

const routes: RouteConfig[] = [
  {
    name: 'Dashboard',
    path: '/',
    element: <Dashboard />
  }
];

export default routes;
