import { useState } from 'react';
import { ArrowLeft, MapPin, Presentation, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';
import { PRESENTATION_DATASETS, PRESENTATION_METRICS } from './presentationDemoData.js';

export default function PresentationDemoPage() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState('farmers');
  const dataset = PRESENTATION_DATASETS.find((item) => item.id === selectedId) || PRESENTATION_DATASETS[0];
  const dashboardPath = user.role === 'farmer' ? '/farmer/dashboard' : '/dashboard';

  return (
    <main className="presentation-page">
      <header className="records-topbar">
        <Brand />
        <Link className="records-back" to={dashboardPath}><ArrowLeft size={16} /> Dashboard</Link>
      </header>
      <section className="presentation-content">
        <div className="presentation-banner" role="note">
          <Presentation size={20} />
          <div>
            <strong>Presentation preview · illustrative dataset</strong>
            <p>These sample records demonstrate AGRI-TRACK screens and workflows. They are fictional, are not official Calapan City CAO data, and are not saved to the database.</p>
          </div>
        </div>
        <div className="presentation-heading">
          <div>
            <span className="panel-kicker">AGRI-TRACK · CALAPAN CITY, ORIENTAL MINDORO</span>
            <h1>Agriculture operations overview</h1>
            <p>A read-only presentation of farmer, farm, production, and reporting workflows.</p>
          </div>
          <Link className="records-primary presentation-map-link" to="/map"><MapPin size={15} /> Demo map</Link>
        </div>
        <div className="presentation-stats">
          {PRESENTATION_METRICS.map((metric) => <article className="presentation-stat" key={metric.label}>
            <span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small>
          </article>)}
        </div>
        <section className="dashboard-panel presentation-records">
          <div className="presentation-section-heading">
            <div><span className="panel-kicker">SAMPLE RECORDS</span><h2>Explore the modules</h2></div>
            <span className="presentation-readonly"><ShieldCheck size={14} /> Read only</span>
          </div>
          <div className="presentation-tabs" aria-label="Demo data modules" role="tablist">
            {PRESENTATION_DATASETS.map((item) => <button
              aria-selected={selectedId === item.id}
              className={selectedId === item.id ? 'presentation-tab selected' : 'presentation-tab'}
              id={`demo-tab-${item.id}`}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              role="tab"
              type="button"
            >{item.label}</button>)}
          </div>
          <div aria-labelledby={`demo-tab-${dataset.id}`} className="records-table-wrap" role="tabpanel">
            <table className="records-table">
              <thead><tr>{dataset.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
              <tbody>{dataset.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="presentation-footnote">All totals and entries on this page are illustrative examples for demonstration only.</p>
        </section>
      </section>
    </main>
  );
}
