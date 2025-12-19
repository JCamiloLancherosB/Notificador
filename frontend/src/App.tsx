import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import SendNotification from './pages/SendNotification';
import History from './pages/History';
import Templates from './pages/Templates';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <div className="logo">
              📨 Notificador
            </div>
            <nav>
              <ul className="nav">
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/send">Send Notification</Link></li>
                <li><Link to="/templates">Templates</Link></li>
                <li><Link to="/history">History</Link></li>
              </ul>
            </nav>
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/send" element={<SendNotification />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>

        <footer style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#666',
          borderTop: '1px solid #ddd',
          marginTop: '3rem',
        }}>
          <p>&copy; 2024 Techaura Notificador. All rights reserved.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
