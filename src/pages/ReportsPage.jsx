import { useCallback, useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, BarChart3, Printer, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';

const currentYear = new Date().getFullYear();

export default function ReportsPage() {
  const { user } = useAuth();
  const [year, setYear] = useState(String(currentYear));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/reports/harvests', { params: { year: Number(year) } });
      setReport(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { loadReport(); }, [loadReport]);

  function downloadCsv() {
    const headings = ['Year', 'Barangay', 'Commodity', 'Harvest count', 'Total quantity', 'Unit'];
    const rows = (report?.rows || []).map((item) => [
      report.year,
      item.barangay_name,
      item.commodity,
      item.harvest_count,
      item.total_quantity,
      item.unit,
    ]);
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const contents = [headings, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', contents], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `agritrack-harvest-summary-${report.year}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="records-page">
      <header className="records-topbar"><Brand /><Link to={user.role === 'farmer' ? '/farmer/dashboard' : '/dashboard'} className="records-back"><ArrowLeft size={16} /> Dashboard</Link></header>
      <section className="records-content">
        <div className="records-heading"><div><span className="panel-kicker">AGRICULTURAL REPORTING</span><h1>Harvest summary</h1><p>Actual recorded harvests only, grouped by commodity and unit in your authorized scope.</p></div>
          <div className="report-actions"><label>Year<select onChange={(event) => setYear(event.target.value)} value={year}>{Array.from({ length: Math.min(20, currentYear - 1899) }, (_, index) => String(currentYear - index)).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <button className="records-primary secondary" disabled={loading} onClick={loadReport} type="button"><RefreshCw size={15} /> Refresh</button>
            <button className="records-primary" disabled={loading || !report?.rows?.length} onClick={downloadCsv} type="button"><ArrowDownToLine size={15} /> Export CSV</button>
            <button className="records-primary secondary" disabled={loading || !report?.rows?.length} onClick={() => window.print()} type="button"><Printer size={15} /> Print / Save PDF</button>
          </div></div>
        {error && <div className="records-error" role="alert">{error}<button onClick={loadReport} type="button">Retry</button></div>}
        <div className="records-toolbar"><strong><BarChart3 size={15} /> {report ? `Harvests in ${report.year}` : 'Harvest summary'}</strong><span>{report?.rows?.length ?? 0} grouped totals</span></div>
        <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Barangay</th><th>Commodity</th><th>Harvest records</th><th>Total quantity</th><th>Unit</th></tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan="5">Preparing report…</td></tr>
            : report?.rows?.length ? report.rows.map((item, index) => <tr key={`${item.barangay_name}-${item.commodity}-${item.unit}-${index}`}><td>{item.barangay_name}</td><td>{item.commodity}</td><td>{Number(item.harvest_count).toLocaleString()}</td><td>{Number(item.total_quantity).toLocaleString()}</td><td>{item.unit}</td></tr>)
              : <tr><td className="records-empty" colSpan="5"><BarChart3 size={20} />No harvests were recorded for this year in your authorized scope.</td></tr>}
          </tbody>
        </table></div>
        <p className="records-note"><BarChart3 size={14} /> Quantities with different units are kept separate. This report does not estimate missing or future production.</p>
      </section>
    </main>
  );
}
