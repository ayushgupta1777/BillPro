import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { Home } from './pages/Home';
import { NewBill } from './pages/NewBill';
import { History } from './pages/History';
import { Customers } from './pages/Customers';
import { Items } from './pages/Items';
import { Settings } from './pages/Settings';
import { SyncProvider } from './utils/SyncContext';
import './App.css';

function App() {
  return (
    <SyncProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="new-bill" element={<NewBill />} />
          <Route path="history" element={<History />} />
          <Route path="customers" element={<Customers />} />
          <Route path="items" element={<Items />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </SyncProvider>
  );
}

export default App;
