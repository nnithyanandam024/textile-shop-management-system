import React from 'react';
import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
};

export default App;
