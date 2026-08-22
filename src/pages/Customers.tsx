import { useEffect, useState } from 'react';
import { db, Customer } from '../db/schema';

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(''); // using as village/town
  const [gstin, setGstin] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const allCustomers = await db.getCustomers();
      setCustomers(allCustomers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name) return alert("Name is required");
    const customer: Customer = {
      id: crypto.randomUUID(),
      name,
      phone,
      address,
      gstin,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      await db.saveCustomer(customer);
      setShowModal(false);
      setName('');
      setPhone('');
      setAddress('');
      setGstin('');
      loadCustomers();
    } catch (e) {
      console.error(e);
      alert("Failed to save customer");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Customers</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Customer</button>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Phone</th>
              <th style={{ padding: '12px' }}>Village / Town</th>
              <th style={{ padding: '12px' }}>GSTIN</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{c.name}</td>
                <td style={{ padding: '12px' }}>{c.phone}</td>
                <td style={{ padding: '12px' }}>{c.address}</td>
                <td style={{ padding: '12px' }}>{c.gstin}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No customers added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px' }}>
            <h3>Add New Customer</h3>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Name</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Village / Town</label>
              <input type="text" className="input-field" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="form-group">
              <label>GSTIN (Optional)</label>
              <input type="text" className="input-field" value={gstin} onChange={e => setGstin(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
