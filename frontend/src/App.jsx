import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import Caregiver from './pages/Caregiver';
import './App.css';

// Navigation component to use useLocation
function Navigation() {
  const location = useLocation();
  const isSetup = location.pathname === '/setup';

  if (isSetup) return null;

  return (
    <nav className="app-nav">
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
      <Link to="/caregiver" className={location.pathname === '/caregiver' ? 'active' : ''}>Caregiver</Link>
      <Link to="/setup">⚙️ Setup</Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>DoseWise</h1>
          <Navigation />
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/caregiver" element={<Caregiver />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
