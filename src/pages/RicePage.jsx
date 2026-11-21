import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, ClipboardList, RefreshCw, Sprout, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';

const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const emptyPlanting = { farmerId: '', farmId: '', riceVarietyId: '', plantingDate: today, areaHectares: '', season: '', notes: '' };

export default function RicePage() {
  const { user } = useAuth();
  const [plantings, setPlantings] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stages, setStages] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [plantingForm, setPlantingForm] = useState(emptyPlanting);
  const [showPlantingForm, setShowPlantingForm] = useState(false);
  const [plantingId, setPlantingId] = useState('');
  const [stageId, setStageId] = useState('');
  const [observedOn, setObservedOn] = useState(today);
  const [notes, setNotes] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canReview = ['cao_admin', 'cao_staff'].includes(user.role);
  const canManagePlantings = ['cao_admin', 'cao_staff', 'barangay_personnel'].includes(user.role);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const requests = [
        api.get('/api/rice-plantings'),
        api.get('/api/rice-monitoring'),
        api.get('/api/rice-stages'),
        api.get('/api/rice-varieties'),
      ];
      if (canManagePlantings) {
        requests.push(api.get('/api/farms'), api.get('/api/farms/options'));
      }
      const [plantingResponse, monitoringResponse, stageResponse, varietyResponse, farmsResponse, optionsResponse] = await Promise.all(requests);
      setPlantings(plantingResponse.data.data.data);
      setSubmissions(monitoringResponse.data.data.data);
      setStages(stageResponse.data.data);
      setVarieties(varietyResponse.data.data.filter((variety) => Number(variety.is_sample) === 0 && variety.growth_duration_days));
      setPlantingId((current) => current || String(plantingResponse.data.data.data[0]?.id || ''));
      setStageId((current) => current || String(stageResponse.data.data[0]?.id || ''));
      if (canManagePlantings) {
        setFarms(farmsResponse.data.data);
        setFarmers(optionsResponse.data.data.farmers);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [canManagePlantings]);

  useEffect(() => { loadData(); }, [loadData]);

  async function submitUpdate(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/rice-monitoring', {
        plantingId: Number(plantingId),
        stageId: Number(stageId),
        observedOn,
        notes: notes.trim() || null,
      });
      toast.success('Monitoring update sent for review.');
      setNotes('');
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function createPlanting(event) {
    event.preventDefault();
    const farmer = farmers.find((item) => String(item.id) === plantingForm.farmerId);
    if (!farmer) {
      toast.error('Choose an active farmer.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/rice-plantings', {
        ...plantingForm,
        farmerId: Number(plantingForm.farmerId),
        farmId: Number(plantingForm.farmId),
        riceVarietyId: Number(plantingForm.riceVarietyId),
        barangayId: Number(farmer.barangay_id),
        areaHectares: plantingForm.areaHectares || null,
        season: plantingForm.season.trim() || null,
        notes: plantingForm.notes.trim() || null,
      });
      toast.success('Rice planting record created.');
      setPlantingForm(emptyPlanting);
      setShowPlantingForm(false);
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  const selectedFarmer = farmers.find((item) => String(item.id) === plantingForm.farmerId);
  const availableFarms = farms.filter((farm) => String(farm.farmer_id) === plantingForm.farmerId);

  async function reviewSubmission(id, status) {
    const rejectionReason = status === 'rejected' ? (rejectionReasons[id] || '').trim() : '';
    if (status === 'rejected' && !rejectionReason) {
      toast.error('Enter a reason before rejecting this update.');
      return;
    }
    try {
      await api.patch(`/api/rice-monitoring/${id}`, { status, rejectionReason });
      toast.success(status === 'approved' ? 'Monitoring update approved.' : 'Monitoring update rejected.');
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    }
  }

  return (
    <main className="records-page">
      <header className="records-topbar">
        <Brand />
        <Link to={user.role === 'farmer' ? '/farmer/dashboard' : '/dashboard'} className="records-back">
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </header>
      <section className="records-content">
        <div className="records-heading">
          <div>
            <span className="panel-kicker">RICE PRODUCTION</span>
            <h1>Planting &amp; monitoring</h1>
            <p>Review rice planting records and submit or verify field progress updates.</p>
          </div>
          <button className="records-primary" disabled={loading} onClick={loadData} type="button">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {error && <div className="records-error" role="alert">{error}<button onClick={loadData} type="button">Retry</button></div>}

        {canManagePlantings && <section className="records-form rice-update-form">
          <div className="rice-form-heading">
            <h2>Rice planting records</h2>
            <button className="records-text-button" onClick={() => setShowPlantingForm((open) => !open)} type="button">
              {showPlantingForm ? 'Cancel' : 'Add planting'}
            </button>
          </div>
          {showPlantingForm && <form onSubmit={createPlanting}>
            {varieties.length === 0 && <p className="rice-empty">No verified rice variety and maturity duration are configured. Add CAO-approved reference data before creating a planting; sample values are deliberately excluded.</p>}
            <div className="records-form-grid">
              <label>Farmer<select onChange={(event) => setPlantingForm({ ...plantingForm, farmerId: event.target.value, farmId: '' })} required value={plantingForm.farmerId}>
                <option value="">Select a farmer</option>
                {farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.first_name} {farmer.last_name} · {farmer.barangay_name}</option>)}
              </select></label>
              <label>Farm<select disabled={!plantingForm.farmerId} onChange={(event) => setPlantingForm({ ...plantingForm, farmId: event.target.value })} required value={plantingForm.farmId}>
                <option value="">Select a farm</option>
                {availableFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.farm_name || `Farm ${farm.id}`}</option>)}
              </select></label>
              <label>Verified rice variety<select onChange={(event) => setPlantingForm({ ...plantingForm, riceVarietyId: event.target.value })} required value={plantingForm.riceVarietyId}>
                <option value="">Select a variety</option>
                {varieties.map((variety) => <option key={variety.id} value={variety.id}>{variety.name} · {variety.growth_duration_days} days</option>)}
              </select></label>
              <label>Planting date<input max={today} onChange={(event) => setPlantingForm({ ...plantingForm, plantingDate: event.target.value })} required type="date" value={plantingForm.plantingDate} /></label>
              <label>Area (hectares)<input min="0.0001" step="0.0001" type="number" onChange={(event) => setPlantingForm({ ...plantingForm, areaHectares: event.target.value })} value={plantingForm.areaHectares} /></label>
              <label>Season<input maxLength="80" onChange={(event) => setPlantingForm({ ...plantingForm, season: event.target.value })} value={plantingForm.season} /></label>
              <label>Notes<input maxLength="5000" onChange={(event) => setPlantingForm({ ...plantingForm, notes: event.target.value })} value={plantingForm.notes} /></label>
            </div>
            {selectedFarmer && <p className="rice-empty">Barangay is taken from the farmer record: {selectedFarmer.barangay_name}.</p>}
            <button className="records-primary" disabled={saving || !varieties.length || !availableFarms.length} type="submit">{saving ? 'Saving…' : 'Create rice planting'}</button>
            {plantingForm.farmerId && !availableFarms.length && <p className="rice-empty">This farmer has no farm records. Add a farm before creating a planting.</p>}
          </form>}
        </section>}

        <div className="records-toolbar"><strong>Plantings</strong><span>{plantings.length} records</span></div>
        <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Planting date</th><th>Farmer &amp; variety</th><th>Farm / barangay</th><th>Area</th><th>Expected maturity</th><th>Status</th></tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan="6">Loading rice plantings…</td></tr>
            : plantings.length === 0 ? <tr><td className="records-empty" colSpan="6"><Sprout size={20} />No rice planting records yet.</td></tr>
              : plantings.map((item) => <tr key={item.id}>
                <td>{item.planting_date}</td><td><strong>{item.farmer_name}</strong><small>{item.variety_name}</small></td>
                <td>{item.farm_name || `Farm ${item.farm_id}`}<small>{item.barangay_name}</small></td>
                <td>{item.area_hectares ? `${Number(item.area_hectares).toLocaleString()} ha` : '—'}</td>
                <td>{item.expected_maturity_date || '—'}</td><td><span className="record-status active">{item.status}</span></td>
              </tr>)}
          </tbody>
        </table></div>

        <section className="records-form rice-update-form">
          <h2>Submit a monitoring update</h2>
          {!plantings.length ? (
            <p className="rice-empty">No rice planting records are available in your authorized scope yet.</p>
          ) : (
            <form onSubmit={submitUpdate}>
              <div className="records-form-grid">
                <label>Rice planting
                  <select onChange={(event) => setPlantingId(event.target.value)} required value={plantingId}>
                    {plantings.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.variety_name} · {item.farmer_name} · {item.planting_date}
                      </option>
                    ))}
                  </select>
                </label>
                <label>Growth stage
                  <select onChange={(event) => setStageId(event.target.value)} required value={stageId}>
                    {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
                  </select>
                </label>
                <label>Observed on
                  <input max={today} onChange={(event) => setObservedOn(event.target.value)} required type="date" value={observedOn} />
                </label>
                <label>Field notes
                  <input maxLength="5000" onChange={(event) => setNotes(event.target.value)} placeholder="Optional observations" value={notes} />
                </label>
              </div>
              <button className="records-primary" disabled={saving || !stages.length} type="submit">
                <ClipboardList size={15} /> {saving ? 'Submitting…' : 'Submit for review'}
              </button>
            </form>
          )}
        </section>

        <div className="records-toolbar"><strong>Monitoring submissions</strong><span>{submissions.length} records</span></div>
        <div className="records-table-wrap">
          <table className="records-table">
            <thead><tr><th>Observation</th><th>Farmer &amp; variety</th><th>Growth stage</th><th>Notes</th><th>Status</th>{canReview && <th>Review</th>}</tr></thead>
            <tbody>
              {loading ? <tr><td className="records-empty" colSpan={canReview ? 6 : 5}>Loading rice records…</td></tr>
                : submissions.length === 0 ? <tr><td className="records-empty" colSpan={canReview ? 6 : 5}><Sprout size={20} />No monitoring submissions yet.</td></tr>
                  : submissions.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.observed_on}</strong><small>Submitted {new Date(item.submitted_at).toLocaleDateString()}</small></td>
                      <td><strong>{item.farmer_name}</strong><small>{item.variety_name}</small></td>
                      <td>{item.stage}</td>
                      <td>{item.notes || '—'}{item.rejection_reason && <small className="rice-rejection-note">Reason: {item.rejection_reason}</small>}</td>
                      <td><span className={`record-status ${item.status === 'approved' ? 'active' : item.status === 'rejected' ? 'inactive' : ''}`}>{item.status}</span></td>
                      {canReview && <td className="rice-review-actions">
                        {item.status === 'pending' ? (
                          <>
                            <input aria-label="Rejection reason" maxLength="1000" onChange={(event) => setRejectionReasons({ ...rejectionReasons, [item.id]: event.target.value })} placeholder="Reason if rejecting" value={rejectionReasons[item.id] || ''} />
                            <button aria-label="Approve submission" className="records-text-button" onClick={() => reviewSubmission(item.id, 'approved')} type="button"><Check size={15} /> Approve</button>
                            <button aria-label="Reject submission" className="records-text-button reject" onClick={() => reviewSubmission(item.id, 'rejected')} type="button"><X size={15} /> Reject</button>
                          </>
                        ) : <span>{item.reviewed_by_name || 'Reviewed'}</span>}
                      </td>}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <p className="records-note"><Sprout size={14} /> Farmer and barangay visibility is enforced by the backend. Approval actions are limited to CAO Admin and CAO Staff.</p>
      </section>
    </main>
  );
}
