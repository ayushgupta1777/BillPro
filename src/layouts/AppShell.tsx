import { Outlet, NavLink } from 'react-router-dom';
import { Home, FileText, History, Users, Package, Settings, Cloud, CloudOff } from 'lucide-react';
import { useSync } from '../utils/SyncContext';
import './AppShell.css';

export function AppShell() {
  const { status, pendingCount } = useSync();
  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/new-bill', label: 'New Bill', icon: <FileText size={20} /> },
    { path: '/history', label: 'History', icon: <History size={20} /> },
    { path: '/customers', label: 'Customers', icon: <Users size={20} /> },
    { path: '/items', label: 'Items', icon: <Package size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Billora</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {status === 'synced' && <><Cloud size={16} color="green" /> <span>Cloud backup up to date</span></>}
          {status === 'syncing' && <><Cloud size={16} color="orange" /> <span>Syncing {pendingCount}...</span></>}
          {status === 'offline' && <><CloudOff size={16} color="gray" /> <span>Waiting for internet ({pendingCount})</span></>}
          {status === 'error' && <><CloudOff size={16} color="red" /> <span>Sync failed ({pendingCount})</span></>}
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
