import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './app.css';

import Home from './pages/Home';
import Omen from './pages/Omen';
import Records from './pages/Records'

function App() {
  

  return (
    <Router>
      <div className="app-container">
        
        <nav className="sidebar">
          <h2 className="sidebar-title">Flood Gate</h2>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/Records">Records</Link></li>
            <li><Link to="/omen">Omen</Link></li>
          </ul>
        </nav>

        
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/Records" element={<Records />} />
            <Route path="/omen" element={<Omen />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;