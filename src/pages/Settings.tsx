import { useState } from 'react';
import { db } from '../db/schema';

export function Settings() {
  const [loading, setLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');

  const handleBackup = async () => {
    try {
      setLoading(true);
      const data = await db.exportAllData();
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `billora_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to generate backup.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!confirm("Are you sure you want to restore? This will overwrite your existing data. (An automatic fail-safe backup will be saved locally before overwriting)")) {
        return;
      }

      setLoading(true);
      setRestoreMessage('Restoring data...');

      try {
        const text = await file.text();
        await db.importAllData(text);
        setRestoreMessage('Data restored successfully! Please restart the application.');
        alert("Data restored successfully! The application will now reload.");
        window.location.reload();
      } catch (err) {
        console.error(err);
        setRestoreMessage('Restore failed: ' + (err as Error).message);
        alert('Restore failed. Check console for details.');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Settings</h2>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <h3>Backup & Restore</h3>
        <p style={{ color: '#666', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Protect your business data. Backups contain all customers, items, bills, and settings. 
          Save your backup files securely offline.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-primary" 
            onClick={handleBackup} 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Export Backup (JSON)'}
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={handleRestore}
            disabled={loading}
          >
            Restore from Backup
          </button>
        </div>

        {restoreMessage && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#eef2ff', borderRadius: '4px', color: '#333' }}>
            {restoreMessage}
          </div>
        )}
      </div>
    </div>
  );
}
