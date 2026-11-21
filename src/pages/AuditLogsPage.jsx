import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../api/client.js';
import Brand from '../components/Brand.jsx';

function jsonLabel(value) {
  if (!value) return '—';
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return JSON.stringify(parsed);
  } catch {
    return 'Details unavailable';
  }
}

export default function AuditLogsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/admin/audit-logs');
      setRecords(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  return (
    <main className="records-page">
      <header className="records-topbar"><Brand /><Link to="/dashboard" className="records-back"><ArrowLeft size={16} /> Dashboard</Link></header>
      <section className="records-content">
        <div className="records-heading"><div><span className="panel-kicker">SYSTEM GOVERNANCE</span><h1>Audit log</h1><p>Recent recorded security and data-management events. Administrator access only.</p></div>
          <button className="records-primary secondary" disabled={loading} onClick={loadRecords} type="button"><RefreshCw size={15} /> Refresh</button></div>
        {error && <div className="records-error" role="alert">{error}<button onClick={loadRecords} type="button">Retry</button></div>}
        <div className="records-toolbar"><strong><ShieldCheck size={15} /> Recent activity</strong><span>Latest {records.length} events</span></div>
        <div className="records-table-wrap"><table className="records-table audit-table">
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Module / record</th><th>Barangay</th><th>Changes</th></tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan="6">Loading audit records…</td></tr>
            : records.length === 0 ? <tr><td className="records-empty" colSpan="6">No audit records.</td></tr>
              : records.map((item) => <tr key={item.id}>
                <td>{new Date(String(item.created_at).replace(' ', 'T')).toLocaleString()}</td>
                <td>{item.actor_name || 'System'}<small>{item.role_slug || 'system'}</small></td>
                <td>{item.action}</td>
                <td>{item.module}<small>{item.record_id || '—'}</small></td>
                <td>{item.barangay_name || '—'}</td>
                <td><small className="audit-values">Before: {jsonLabel(item.old_values)}</small><small className="audit-values">After: {jsonLabel(item.new_values)}</small></td>
              </tr>)}
          </tbody>
        </table></div>
        <p className="records-note"><ShieldCheck size={14} /> Audit records are read-only and limited to the latest 200 entries.</p>
      </section>
    </main>
  );
}
