import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, PawPrint, Plus, ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';

const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const emptyLivestock = { farmerId: '', farmId: '', categoryId: '', quantity: '1', acquiredOn: '', notes: '' };
const emptyHealth = { livestockId: '', recordType: '', description: '', administeredOn: today, nextDueOn: '', provider: '' };

export default function LivestockPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyLivestock);
  const [healthForm, setHealthForm] = useState(emptyHealth);
  const [showForm, setShowForm] = useState(false);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canManage = ['cao_admin', 'cao_staff', 'barangay_personnel'].includes(user.role);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [livestockResponse, healthResponse] = await Promise.all([
        api.get('/api/livestock'),
        api.get('/api/livestock-health'),
      ]);
      setRecords(livestockResponse.data.data);
      setHealthRecords(healthResponse.data.data);
      if (canManage) {
        const [refsResponse, farmResponse, optionsResponse] = await Promise.all([
          api.get('/api/agriculture/references'), api.get('/api/farms'), api.get('/api/farms/options'),
        ]);
        setCategories(refsResponse.data.data.livestockCategories.filter((item) => Number(item.is_sample) === 0));
        setFarms(farmResponse.data.data);
        setFarmers(optionsResponse.data.data.farmers);
        setHealthForm((current) => ({ ...current, livestockId: current.livestockId || String(livestockResponse.data.data[0]?.id || '') }));
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => { loadData(); }, [loadData]);

  async function createLivestock(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/livestock', {
        ...form, farmerId: Number(form.farmerId), farmId: form.farmId ? Number(form.farmId) : null,
        categoryId: Number(form.categoryId), quantity: Number(form.quantity), acquiredOn: form.acquiredOn || null,
        notes: form.notes.trim() || null,
      });
      toast.success('Livestock record created.');
      setForm(emptyLivestock);
      setShowForm(false);
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function createHealth(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/livestock-health', {
        ...healthForm, livestockId: Number(healthForm.livestockId),
        administeredOn: healthForm.administeredOn || null, nextDueOn: healthForm.nextDueOn || null,
      });
      toast.success('Health record added.');
      setHealthForm({ ...emptyHealth, livestockId: healthForm.livestockId });
      setShowHealthForm(false);
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function archive(item) {
    if (!window.confirm(`Archive ${item.category_name} record for ${item.farmer_name}?`)) return;
    try {
      await api.delete(`/api/livestock/${item.id}`);
      toast.success('Livestock record archived.');
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    }
  }

  const availableFarms = farms.filter((farm) => String(farm.farmer_id) === form.farmerId);

  return (
    <main className="records-page">
      <header className="records-topbar"><Brand /><Link to={user.role === 'farmer' ? '/farmer/dashboard' : '/dashboard'} className="records-back"><ArrowLeft size={16} /> Dashboard</Link></header>
      <section className="records-content">
        <div className="records-heading"><div><span className="panel-kicker">ANIMAL REGISTRY</span><h1>Livestock &amp; health</h1><p>Track livestock quantities and care records in your authorized scope.</p></div>
          {canManage && <div className="livestock-heading-actions">
            <button className="records-primary" onClick={() => setShowForm((open) => !open)} type="button">{showForm ? <X size={16} /> : <Plus size={16} />} Livestock</button>
            <button className="records-primary secondary" onClick={() => setShowHealthForm((open) => !open)} type="button">{showHealthForm ? <X size={16} /> : <Plus size={16} />} Health record</button>
          </div>}</div>
        {showForm && <form className="records-form" onSubmit={createLivestock}>
          <h2>Register livestock</h2>
          {categories.length === 0 && <p className="rice-empty">No verified livestock categories are configured. Sample reference values cannot be used.</p>}
          <div className="records-form-grid">
            <label>Farmer<select onChange={(event) => setForm({ ...form, farmerId: event.target.value, farmId: '' })} required value={form.farmerId}><option value="">Select a farmer</option>{farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.first_name} {farmer.last_name} · {farmer.barangay_name}</option>)}</select></label>
            <label>Farm (optional)<select onChange={(event) => setForm({ ...form, farmId: event.target.value })} value={form.farmId}><option value="">No farm linked</option>{availableFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.farm_name || `Farm ${farm.id}`}</option>)}</select></label>
            <label>Category<select onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required value={form.categoryId}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>Quantity<input min="1" step="1" type="number" onChange={(event) => setForm({ ...form, quantity: event.target.value })} required value={form.quantity} /></label>
            <label>Acquired on<input max={today} onChange={(event) => setForm({ ...form, acquiredOn: event.target.value })} type="date" value={form.acquiredOn} /></label>
            <label>Notes<input maxLength="5000" onChange={(event) => setForm({ ...form, notes: event.target.value })} value={form.notes} /></label>
          </div>
          <button className="records-primary" disabled={saving || !categories.length} type="submit">{saving ? 'Saving…' : 'Save livestock'}</button>
        </form>}
        {showHealthForm && <form className="records-form" onSubmit={createHealth}>
          <h2>Record livestock health care</h2>
          <div className="records-form-grid">
            <label>Livestock<select onChange={(event) => setHealthForm({ ...healthForm, livestockId: event.target.value })} required value={healthForm.livestockId}><option value="">Select a livestock record</option>{records.map((item) => <option key={item.id} value={item.id}>{item.category_name} · {item.farmer_name} ({item.quantity})</option>)}</select></label>
            <label>Record type<input maxLength="80" onChange={(event) => setHealthForm({ ...healthForm, recordType: event.target.value })} required value={healthForm.recordType} /></label>
            <label>Description<input maxLength="5000" onChange={(event) => setHealthForm({ ...healthForm, description: event.target.value })} required value={healthForm.description} /></label>
            <label>Administered on<input max={today} onChange={(event) => setHealthForm({ ...healthForm, administeredOn: event.target.value })} type="date" value={healthForm.administeredOn} /></label>
            <label>Next due<input onChange={(event) => setHealthForm({ ...healthForm, nextDueOn: event.target.value })} type="date" value={healthForm.nextDueOn} /></label>
            <label>Provider<input maxLength="150" onChange={(event) => setHealthForm({ ...healthForm, provider: event.target.value })} value={healthForm.provider} /></label>
          </div>
          <button className="records-primary" disabled={saving || !records.length} type="submit">{saving ? 'Saving…' : 'Save health record'}</button>
        </form>}
        {error && <div className="records-error" role="alert">{error}<button onClick={loadData} type="button">Retry</button></div>}
        <div className="records-toolbar"><strong>Livestock</strong><span>{records.length} records</span></div>
        <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Animal/category</th><th>Farmer</th><th>Farm / barangay</th><th>Quantity</th><th>Acquired</th>{canManage && <th>Action</th>}</tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan={canManage ? 6 : 5}>Loading livestock…</td></tr>
            : records.length === 0 ? <tr><td className="records-empty" colSpan={canManage ? 6 : 5}><PawPrint size={20} />No livestock records.</td></tr>
              : records.map((item) => <tr key={item.id}><td><strong>{item.category_name}</strong></td><td>{item.farmer_name}</td><td>{item.farm_name || 'No farm linked'}<small>{item.barangay_name}</small></td><td>{Number(item.quantity).toLocaleString()}</td><td>{item.acquired_on || '—'}</td>{canManage && <td><button className="records-text-button" onClick={() => archive(item)} type="button">Archive</button></td>}</tr>)}
          </tbody>
        </table></div>
        <div className="records-toolbar livestock-health-heading"><strong><ShieldCheck size={15} /> Health and care records</strong><span>{healthRecords.length} records</span></div>
        <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Record</th><th>Livestock / farmer</th><th>Administered</th><th>Next due</th><th>Provider</th></tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan="5">Loading care records…</td></tr>
            : healthRecords.length === 0 ? <tr><td className="records-empty" colSpan="5">No livestock health records.</td></tr>
              : healthRecords.map((item) => <tr key={item.id}><td><strong>{item.record_type}</strong><small>{item.description}</small></td><td>{item.category_name} · {item.farmer_name}</td><td>{item.administered_on || '—'}</td><td>{item.next_due_on || '—'}</td><td>{item.provider || '—'}</td></tr>)}
          </tbody>
        </table></div>
        <p className="records-note"><PawPrint size={14} /> Categories marked as sample reference data are not accepted for new livestock records.</p>
      </section>
    </main>
  );
}
