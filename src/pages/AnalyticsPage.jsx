import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, RefreshCw, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [years, setYears] = useState('5');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/analytics/harvest-trend', { params: { years: Number(years) } });
      setAnalysis(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [years]);

  useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

  return (
    <main className="records-page">
      <header className="records-topbar">
        <Brand />
        <Link to={user.role === 'farmer' ? '/farmer/dashboard' : '/dashboard'} className="records-back"><ArrowLeft size={16} /> Dashboard</Link>
      </header>
      <section className="records-content">
        <div className="records-heading">
          <div><span className="panel-kicker">AGRICULTURAL ANALYTICS</span><h1>Harvest trend estimates</h1><p>Historical harvest totals and a simple trend projection for your authorized scope.</p></div>
          <div className="report-actions">
            <label>Historical years<select onChange={(event) => setYears(event.target.value)} value={years}>{Array.from({ length: 8 }, (_, index) => String(index + 3)).map((item) => <option key={item} value={item}>{item} years</option>)}</select></label>
            <button className="records-primary secondary" disabled={loading} onClick={loadAnalysis} type="button"><RefreshCw size={15} /> Refresh</button>
          </div>
        </div>
        {error && <div className="records-error" role="alert">{error}<button onClick={loadAnalysis} type="button">Retry</button></div>}
        <div className="analytics-disclaimer"><TrendingUp size={16} /><span>Estimates use ordinary least-squares linear trends from years with recorded harvests. They are not agronomic forecasts and do not account for weather, planted area, pests, prices, or missing records. Three consecutive years of observations through the current year are required per commodity and unit.</span></div>
        <div className="records-toolbar"><strong><BarChart3 size={15} /> {analysis ? `${analysis.firstYear}–${analysis.lastYear} actual harvests · ${analysis.forecastYear} trend` : 'Harvest trend analysis'}</strong><span>{analysis?.series?.length ?? 0} commodity / unit series</span></div>
        <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Barangay</th><th>Commodity</th><th>Unit</th><th>Recorded years</th><th>Historical quantities</th><th>Next-year estimate</th></tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan="6">Analyzing recorded harvests…</td></tr>
            : analysis?.series?.length ? analysis.series.map((series) => <tr key={`${series.barangayName}-${series.commodity}-${series.unit}`}>
              <td>{series.barangayName}</td><td>{series.commodity}</td><td>{series.unit}</td>
              <td>{series.observations.map((observation) => observation.year).join(', ')}</td>
              <td>{series.observations.map((observation) => `${observation.year}: ${Number(observation.quantity).toLocaleString()} (${observation.harvestCount} records)`).join(' · ')}</td>
              <td>{series.forecastQuantity === null ? series.forecastNote : `${Number(series.forecastQuantity).toLocaleString()} ${series.unit}`}</td>
            </tr>)
              : <tr><td className="records-empty" colSpan="6"><BarChart3 size={20} />No recorded harvests are available in your authorized scope yet.</td></tr>}
          </tbody>
        </table></div>
        <p className="records-note"><BarChart3 size={14} /> Quantities are never combined across different units. Estimates are clamped to zero and should be treated as a basic historical trend only.</p>
      </section>
    </main>
  );
}
