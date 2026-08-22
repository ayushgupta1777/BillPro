import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, TrendingUp, Cloud } from 'lucide-react';
import './Home.css';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header">
        <div>
          <h1 className="welcome-text">Welcome back</h1>
          <p className="text-muted">Here's what's happening with your billing today.</p>
        </div>
        <button 
          className="btn btn-primary new-bill-btn"
          onClick={() => navigate('/new-bill')}
        >
          <PlusCircle size={20} />
          NEW BILL
        </button>
      </header>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon-wrapper blue">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Today's Bills</p>
            <h3 className="stat-value">0</h3>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon-wrapper green">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Today's Revenue</p>
            <h3 className="stat-value">₹0.00</h3>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper gray">
            <Cloud size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Sync Status</p>
            <h3 className="stat-value status-ok">Up to date</h3>
            <p className="stat-subtitle">Local data is safe</p>
          </div>
        </div>
      </div>
      
      <div className="recent-section">
        <h2>Recent Bills</h2>
        <div className="card empty-state">
          <FileText size={48} className="text-muted" />
          <h3>No bills yet</h3>
          <p className="text-muted">Create your first bill to see it here.</p>
          <button 
            className="btn btn-outline mt-4"
            onClick={() => navigate('/new-bill')}
          >
            Create Bill
          </button>
        </div>
      </div>
    </div>
  );
}
