import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, BillItem, Customer, Item } from '../db/schema';
import { calculateBillTotals, calculateRowAmount } from '../utils/calculations';
import { Plus, Trash2, Save, Printer } from 'lucide-react';
import './NewBill.css';

export function NewBill() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
  const [dbItems, setDbItems] = useState<Item[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerVillage, setCustomerVillage] = useState('');
  const [cgstRate, setCgstRate] = useState(1.5);
  const [sgstRate, setSgstRate] = useState(1.5);
  const [items, setItems] = useState<Partial<BillItem>[]>([
    { description: '', quantity: undefined, rate: undefined }
  ]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<string | null>(null);

  // Totals
  const totals = calculateBillTotals(items, cgstRate, sgstRate);

  // Draft Recovery via SQLite
  useEffect(() => {
    // Load draft or duplicate data from location state on mount
    db.getDraft().then(savedDraft => {
      // If we arrived via duplicate, use the duplicate state and don't load draft
      if (location.state && location.state.duplicateCustomer) {
        setCustomerName(location.state.duplicateCustomer || '');
        setCustomerPhone(location.state.duplicatePhone || '');
        setCustomerVillage(location.state.duplicateVillage || '');
        if (location.state.duplicateItems && location.state.duplicateItems.length > 0) {
          setItems(location.state.duplicateItems);
        }
      } else {
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setCustomerName(parsed.customerName || '');
          setCustomerPhone(parsed.customerPhone || '');
          setCustomerVillage(parsed.customerVillage || '');
          if (parsed.items && parsed.items.length > 0) {
            setItems(parsed.items);
          }
          if (parsed.cgstRate !== undefined) setCgstRate(parsed.cgstRate);
          if (parsed.sgstRate !== undefined) setSgstRate(parsed.sgstRate);
        }
      }
      setIsLoaded(true);
    });

    // Load reference data
    db.getCustomers().then(setDbCustomers);
    db.getItems().then(setDbItems);
  }, [location.state]);

  // Save Draft via SQLite
  const saveDraft = useCallback(async () => {
    if (!isLoaded || generatedPdfBlob) return; // don't overwrite if showing success state
    try {
      await db.saveDraft(JSON.stringify({ customerName, customerPhone, customerVillage, items, cgstRate, sgstRate }));
    } catch (err) {
      console.error('Error saving draft to DB:', err);
    }
  }, [customerName, customerPhone, customerVillage, items, cgstRate, sgstRate, isLoaded, generatedPdfBlob]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 400);
    return () => clearTimeout(timer);
  }, [saveDraft]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: undefined, rate: undefined }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const updateItem = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    updateItem(index, field, value);
  };

  const handleSave = async () => {
    if (!customerName) {
      alert("Please enter customer name");
      return;
    }
    alert(`Draft Saved Successfully!`);
  };

  const handlePrint = async () => {
    if (!customerName) {
      alert("Please enter customer name");
      return;
    }
    
    const invoiceNumber = await db.consumeNextInvoiceNumber();
    const date = new Date().toLocaleDateString();

    try {
      // Import dynamically
      const { pdf } = await import('@react-pdf/renderer');
      const { InvoicePDF } = await import('../components/InvoicePDF');
      
      const blob = await pdf(
        <InvoicePDF 
          invoiceNumber={invoiceNumber}
          date={date}
          customerName={customerName}
          customerPhone={customerPhone}
          customerVillage={customerVillage}
          items={items}
          totals={totals}
          cgstRate={cgstRate}
          sgstRate={sgstRate}
        />
      ).toBlob();

      const blobUrl = URL.createObjectURL(blob);
      setGeneratedPdfBlob(blobUrl);

      // Save finalized bill to SQLite
      await db.saveBill(
        { 
          id: invoiceNumber, 
          invoiceNumber, 
          date: Date.now(), 
          customerId: customerName, 
          customerName,
          customerPhone,
          customerVillage,
          taxableAmount: totals.taxableAmount, 
          cgst: totals.cgst, 
          sgst: totals.sgst, 
          grandTotal: totals.grandTotal, 
          status: 'finalized' 
        },
        [] // Simplified for demo
      );

      // Clear draft
      try {
        await db.clearDraft();
      } catch (e) {}
      
      // Auto-trigger print
      setTimeout(() => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          try {
            iframe.contentWindow?.print();
          } catch (e) {
            console.error("Print failed, falling back to window.open", e);
            window.open(blobUrl, '_blank');
          }
        };
      }, 100);
      
    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("Failed to generate PDF. Check console.");
    }
  };

  const openPdf = () => {
    if (generatedPdfBlob) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = generatedPdfBlob;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Print failed, falling back to window.open", e);
          window.open(generatedPdfBlob, '_blank');
        }
      };
    }
  };

  const resetForm = () => {
    setGeneratedPdfBlob(null);
    setCustomerName('');
    setItems([{ description: '', quantity: undefined, rate: undefined }]);
  };

  if (generatedPdfBlob) {
    return (
      <div className="new-bill-container" style={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'var(--color-success)', marginBottom: '1rem' }}>✓ Bill Generated</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>The invoice has been finalized and saved safely.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={openPdf}>
              <Printer size={18} /> Print
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/')}>
              Home
            </button>
            <button className="btn btn-outline" onClick={resetForm}>
              New Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="new-bill-container">
      <header className="new-bill-header">
        <h1 className="page-title">Create New Bill</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleSave}>
            <Save size={18} /> Save Draft
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} /> Generate & Print
          </button>
        </div>
      </header>

      <div className="card form-section customer-section">
        <h3>Customer Details</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Customer Name</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="Enter customer name..." 
              list="customer-list"
              value={customerName}
              onChange={e => {
                const val = e.target.value;
                setCustomerName(val);
                const found = dbCustomers.find(c => c.name === val);
                if (found) {
                  setCustomerPhone(found.phone || '');
                  setCustomerVillage(found.address || ''); // Assuming address is village
                }
              }}
            />
            <datalist id="customer-list">
              {dbCustomers.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Phone Number</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="e.g. 9876543210" 
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Village / Town</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="e.g. Narsinghpur" 
              value={customerVillage}
              onChange={e => setCustomerVillage(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="card form-section tax-settings-section">
        <h3>Tax Rates (Configurable)</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group">
            <label>CGST (%)</label>
            <input 
              type="number" 
              className="input-field"
              value={cgstRate}
              step="0.1"
              onChange={e => setCgstRate(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>SGST (%)</label>
            <input 
              type="number" 
              className="input-field"
              value={sgstRate}
              step="0.1"
              onChange={e => setSgstRate(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="card form-section items-section">
        <h3>Bill Items</h3>
        <table className="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ width: '120px' }}>Qty (Grams)</th>
              <th style={{ width: '150px' }}>Rate per 10g (₹)</th>
              <th style={{ width: '150px' }}>Amount (₹)</th>
              <th style={{ width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Item description"
                    list="item-list"
                    value={item.description}
                    onChange={e => {
                      const val = e.target.value;
                      const found = dbItems.find(i => i.name === val);
                      updateItem(index, 'description', val);
                      if (found) {
                        if (found.rate) updateItem(index, 'rate', found.rate);
                      }
                    }}
                  />
                  <datalist id="item-list">
                    {dbItems.map(i => <option key={i.id} value={i.name} />)}
                  </datalist>
                </td>
                <td style={{ padding: '12px' }}>
                  <input 
                    type="number" 
                    className="input-field text-right" 
                    min="0"
                    step="0.001"
                    value={item.quantity || ''}
                    onChange={e => handleItemChange(index, 'quantity', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    className="input-field text-right" 
                    min="0"
                    step="0.01"
                    value={item.rate || ''}
                    onChange={e => handleItemChange(index, 'rate', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </td>
                <td className="text-right amount-col">
                  {calculateRowAmount(item.quantity || 0, item.rate || 0).toFixed(2)}
                </td>
                <td className="text-center">
                  <button className="icon-btn delete-btn" onClick={() => handleRemoveItem(index)}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button className="btn btn-outline add-item-btn" onClick={handleAddItem}>
          <Plus size={18} /> Add Row
        </button>
      </div>

      <div className="totals-section">
        <div className="card totals-card">
          <div className="total-row">
            <span>Taxable Amount</span>
            <span>₹{totals.taxableAmount.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>CGST ({cgstRate}%)</span>
            <span>₹{totals.cgst.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>SGST ({sgstRate}%)</span>
            <span>₹{totals.sgst.toFixed(2)}</span>
          </div>
          <hr className="divider" />
          <div className="total-row grand-total">
            <span>Grand Total</span>
            <span>₹{totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
