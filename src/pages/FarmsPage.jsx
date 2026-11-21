import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Leaf, MapPin, Plus, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';

const emptyForm = {
  farmerId: '',
  farmName: '',
  locationDescription: '',
  latitude: '',
  longitude: '',
  areaHectares: '',
  ownershipType: '',
};

export default function FarmsPage() {
  const { user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [farmers, setFarmers] = useState([]);
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
      const farmResponse = await api.get('/api/farms');
      setFarms(farmResponse.data.data);
      if (canManage) {
        const optionsResponse = await api.get('/api/farms/options');
        setFarmers(optionsResponse.data.data.farmers);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => { loadData(); }, [loadData]);

  async function createFarm(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/farms', {
        ...form,
        farmerId: Number(form.farmerId),
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        areaHectares: form.areaHectares || null,
      });
      toast.success('Farm record created.');
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function archiveFarm(farm) {
    const confirmed = window.confirm(`Archive ${farm.farm_name || 'this farm record'}? Linked production records prevent archiving.`);
    if (!confirmed) return;
    try {
      await api.delete(`/api/farms/${farm.id}`);
      toast.success('Farm record archived.');
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
            <span className="panel-kicker">AGRICULTURAL REGISTRY</span>
            <h1>Farm records</h1>
            <p>Manage farms and locations attached to active farmer profiles.</p>
          </div>
          {canManage && <button className="records-primary" onClick={() => setShowForm((open) => !open)} type="button">
            {showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? 'Close form' : 'Add farm'}
          </button>}
        </div>
        {showForm && <form className="records-form" onSubmit={createFarm}>
          <h2>Register a farm</h2>
          <div className="records-form-grid">
            <label>Farmer<select onChange={(event) => setForm({ ...form, farmerId: event.target.value })} required value={form.farmerId}>
              <option value="">Select a farmer</option>
              {farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.first_name} {farmer.last_name} · {farmer.barangay_name}</option>)}
            </select></label>
            <label>Farm name<input maxLength="150" onChange={(event) => setForm({ ...form, farmName: event.target.value })} value={form.farmName} /></label>
            <label>Location description<input maxLength="500" onChange={(event) => setForm({ ...form, locationDescription: event.target.value })} value={form.locationDescription} /></label>
            <label>Area (hectares)<input min="0.0001" step="0.0001" type="number" onChange={(event) => setForm({ ...form, areaHectares: event.target.value })} value={form.areaHectares} /></label>
            <label>Latitude<input max="90" min="-90" step="any" type="number" onChange={(event) => setForm({ ...form, latitude: event.target.value })} value={form.latitude} /></label>
            <label>Longitude<input max="180" min="-180" step="any" type="number" onChange={(event) => setForm({ ...form, longitude: event.target.value })} value={form.longitude} /></label>
            <label>Ownership type<input maxLength="80" onChange={(event) => setForm({ ...form, ownershipType: event.target.value })} value={form.ownershipType} /></label>
          </div>
          <button className="records-primary" disabled={saving || !farmers.length} type="submit">{saving ? 'Saving…' : 'Save farm record'}</button>
        </form>}
        <div className="records-toolbar"><span>{farms.length} farms</span></div>
        {error && <div className="records-error" role="alert">{error}<button onClick={loadData} type="button">Retry</button></div>}
        <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Farm</th><th>Farmer</th><th>Barangay</th><th>Area</th><th>Location</th>{canManage && <th>Actions</th>}</tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan={canManage ? 6 : 5}>Loading farm records…</td></tr>
            : farms.length === 0 ? <tr><td className="records-empty" colSpan={canManage ? 6 : 5}><Leaf size={20} />No farm records available.</td></tr>
              : farms.map((farm) => <tr key={farm.id}>
                <td><strong>{farm.farm_name || 'Farm record'}</strong><small>{farm.ownership_type || 'Ownership not specified'}</small></td>
                <td>{farm.farmer_name}</td><td>{farm.barangay_name}</td>
                <td>{farm.area_hectares ? `${Number(farm.area_hectares).toLocaleString()} ha` : '—'}</td>
                <td>{farm.latitude !== null && farm.longitude !== null ? <span className="farm-coordinate"><MapPin size={13} /> {farm.latitude}, {farm.longitude}</span> : farm.location_description || 'Coordinates not recorded'}</td>
                {canManage && <td><button className="records-text-button" onClick={() => archiveFarm(farm)} type="button">Archive</button></td>}
              </tr>)}
          </tbody>
        </table></div>
        <p className="records-note"><Search size={14} /> Maps are linked only for records with user-supplied coordinates; none are inferred.</p>
      </section>
    </main>
  );
}
