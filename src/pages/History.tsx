import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, Bill, BillItem } from '../db/schema';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '../components/InvoicePDF';

export function History() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const allBills = await db.getBills();
      setBills(allBills);
    } catch (e) {
      console.error("Failed to load bills", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(b => 
    b.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    (b.customerName || '').toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = async (bill: Bill) => {
    try {
      const items = await db.getBillItems(bill.id);
      
      const blob = await pdf(
        <InvoicePDF 
          invoiceNumber={bill.invoiceNumber}
          date={new Date(bill.date).toLocaleDateString()}
          customerName={bill.customerName}
          customerPhone={bill.customerPhone}
          customerVillage={bill.customerVillage}
          items={items as Partial<BillItem>[]}
          totals={{
            taxableAmount: bill.taxableAmount,
            cgst: bill.cgst,
            sgst: bill.sgst,
            grandTotal: bill.grandTotal
          }}
          cgstRate={1.5} // Hardcoded or retrieve from DB if we added it
          sgstRate={1.5}
        />
      ).toBlob();

      const blobUrl = URL.createObjectURL(blob);
      
      // Iframe print logic
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow?.print();
        } catch (e) {
          window.open(blobUrl, '_blank');
        }
      };
    } catch (err) {
      console.error("Failed to regenerate PDF", err);
      alert("Failed to regenerate PDF");
    }
  };

  const handleDuplicate = (bill: Bill) => {
    // Navigate to new bill and pass the old bill's customer and items (via URL state)
    // We need to fetch items first
    db.getBillItems(bill.id).then(items => {
      navigate('/new-bill', { 
        state: { 
          duplicateCustomer: bill.customerName,
          duplicatePhone: bill.customerPhone,
          duplicateVillage: bill.customerVillage,
          duplicateItems: items 
        } 
      });
    });
  };

  if (loading) return <div>Loading history...</div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Bill History</h2>
        <input 
          type="text" 
          placeholder="Search by Invoice # or Customer" 
          className="input-field" 
          style={{ width: '300px' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Invoice #</th>
              <th style={{ padding: '12px' }}>Customer</th>
              <th style={{ padding: '12px' }}>Total Amount</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map(bill => (
              <tr key={bill.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{new Date(bill.date).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>{bill.invoiceNumber}</td>
                <td style={{ padding: '12px' }}>{bill.customerName}</td>
                <td style={{ padding: '12px' }}>₹ {bill.grandTotal.toFixed(2)}</td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => handlePrint(bill)} className="btn-secondary" style={{ marginRight: '8px' }}>Print</button>
                  <button onClick={() => handleDuplicate(bill)} className="btn-secondary">Duplicate</button>
                </td>
              </tr>
            ))}
            {filteredBills.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No bills found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
