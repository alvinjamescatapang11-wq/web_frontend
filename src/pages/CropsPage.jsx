import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Leaf, Plus, Sprout, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';

const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const emptyForm = { farmerId: '', farmId: '', cropTypeId: '', plantingDate: today, expectedHarvestDate: '', areaHectares: '', season: '', notes: '' };

export default function CropsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canManage = ['cao_admin', 'cao_staff', 'barangay_personnel'].includes(user.role);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [cropResponse, refsResponse] = await Promise.all([
        api.get('/api/crop-plantings'),
        canManage ? api.get('/api/agriculture/references') : Promise.resolve(null),
      ]);
      setRecords(cropResponse.data.data);
      if (refsResponse) {
        setTypes(refsResponse.data.data.cropTypes.filter((type) => Number(type.is_sample) === 0));
        const [farmResponse, optionsResponse] = await Promise.all([api.get('/api/farms'), api.get('/api/farms/options')]);
        setFarms(farmResponse.data.data);
        setFarmers(optionsResponse.data.data.farmers);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => { loadData(); }, [loadData]);

  async function createRecord(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/crop-plantings', {
        ...form,
        farmerId: Number(form.farmerId),
        farmId: Number(form.farmId),
        cropTypeId: Number(form.cropTypeId),
        expectedHarvestDate: form.expectedHarvestDate || null,
        areaHectares: form.areaHectares || null,
        season: form.season.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success('Crop planting recorded.');
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function archive(record) {
    if (!window.confirm(`Archive ${record.crop_name} planting for ${record.farmer_name}?`)) return;
    try {
      await api.delete(`/api/crop-plantings/${record.id}`);
      toast.success('Crop planting archived.');
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
        <div className="records-heading"><div><span className="panel-kicker">HIGH-VALUE CROPS</span><h1>Crop plantings</h1><p>Track planting area and expected harvest dates in your permitted scope.</p></div>
          {canManage && <button className="records-primary" onClick={() => setShowForm((open) => !open)} type="button">{showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? 'Close form' : 'Add planting'}</button>}</div>
        {showForm && <form className="records-form" onSubmit={createRecord}>
          <h2>Record a crop planting</h2>
          {types.length === 0 && <p className="rice-empty">No verified crop types are configured. Sample reference values cannot be used.</p>}
          <div className="records-form-grid">
            <label>Farmer<select onChange={(event) => setForm({ ...form, farmerId: event.target.value, farmId: '' })} required value={form.farmerId}><option value="">Select a farmer</option>{farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.first_name} {farmer.last_name} · {farmer.barangay_name}</option>)}</select></label>
            <label>Farm<select disabled={!form.farmerId} onChange={(event) => setForm({ ...form, farmId: event.target.value })} required value={form.farmId}><option value="">Select a farm</option>{availableFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.farm_name || `Farm ${farm.id}`}</option>)}</select></label>
            <label>Crop type<select onChange={(event) => setForm({ ...form, cropTypeId: event.target.value })} required value={form.cropTypeId}><option value="">Select a crop</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
            <label>Planting date<input max={today} onChange={(event) => setForm({ ...form, plantingDate: event.target.value })} required type="date" value={form.plantingDate} /></label>
            <label>Expected harvest<input min={form.plantingDate} onChange={(event) => setForm({ ...form, expectedHarvestDate: event.target.value })} type="date" value={form.expectedHarvestDate} /></label>
            <label>Area (hectares)<input min="0.0001" step="0.0001" type="number" onChange={(event) => setForm({ ...form, areaHectares: event.target.value })} value={form.areaHectares} /></label>
            <label>Season<input maxLength="80" onChange={(event) => setForm({ ...form, season: event.target.value })} value={form.season} /></label>
            <label>Notes<input maxLength="5000" onChange={(event) => setForm({ ...form, notes: event.target.value })} value={form.notes} /></label>
          </div>
          <button className="records-primary" disabled={saving || !types.length || !availableFarms.length} type="submit">{saving ? 'Saving…' : 'Save planting'}</button>
        </form>}
        <div className="records-toolbar"><span>{records.length} planting records</span></div>
        {error && <div className="records-error" role="alert">{error}<button onClick={loadData} type="button">Retry</button></div>}
        <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Crop / farmer</th><th>Farm / barangay</th><th>Planted</th><th>Expected harvest</th><th>Area</th>{canManage && <th>Action</th>}</tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan={canManage ? 6 : 5}>Loading crop records…</td></tr>
            : records.length === 0 ? <tr><td className="records-empty" colSpan={canManage ? 6 : 5}><Sprout size={20} />No crop planting records.</td></tr>
              : records.map((item) => <tr key={item.id}><td><strong>{item.crop_name}</strong><small>{item.farmer_name}</small></td><td>{item.farm_name || `Farm ${item.farm_id}`}<small>{item.barangay_name}</small></td><td>{item.planting_date}</td><td>{item.expected_harvest_date || '—'}</td><td>{item.area_hectares ? `${Number(item.area_hectares).toLocaleString()} ha` : '—'}</td>{canManage && <td><button className="records-text-button" onClick={() => archive(item)} type="button">Archive</button></td>}</tr>)}
          </tbody>
        </table></div>
        <p className="records-note"><Leaf size={14} /> Crops and farm/farmer relationships are validated by the LavaLust backend.</p>
      </section>
    </main>
  );
}
