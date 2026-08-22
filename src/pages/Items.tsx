import { useEffect, useState } from 'react';
import { db, Item } from '../db/schema';

export function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [name, setName] = useState('');
  const [hsn, setHsn] = useState('');
  const [rate, setRate] = useState<number | ''>('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const allItems = await db.getItems();
      setItems(allItems);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name) return alert("Item Name is required");
    const item: Item = {
      id: crypto.randomUUID(),
      name,
      hsn,
      rate: Number(rate) || 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      await db.saveItem(item);
      setShowModal(false);
      setName('');
      setHsn('');
      setRate('');
      loadItems();
    } catch (e) {
      console.error(e);
      alert("Failed to save item");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Items Inventory</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Item</button>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '12px' }}>Item Name</th>
              <th style={{ padding: '12px' }}>HSN Code</th>
              <th style={{ padding: '12px' }}>Default Rate</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{i.name}</td>
                <td style={{ padding: '12px' }}>{i.hsn}</td>
                <td style={{ padding: '12px' }}>{i.rate ? `₹ ${i.rate.toFixed(2)}` : '-'}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No items added yet.</td>
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
            <h3>Add New Item</h3>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Item Name</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>HSN Code</label>
              <input type="text" className="input-field" value={hsn} onChange={e => setHsn(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Default Rate</label>
              <input type="number" className="input-field" value={rate} onChange={e => setRate(e.target.value ? Number(e.target.value) : '')} />
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
