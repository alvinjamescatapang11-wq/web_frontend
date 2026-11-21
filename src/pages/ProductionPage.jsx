import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Plus, Wheat, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';

const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const emptyProduction = { farmerId: '', farmId: '', cropTypeId: '', riceVarietyId: '', productionYear: String(new Date().getFullYear()), season: '', quantity: '', unit: '', notes: '' };
const emptyHarvest = { farmerId: '', farmId: '', cropPlantingId: '', ricePlantingId: '', productionId: '', harvestedOn: today, quantity: '', unit: '', qualityNotes: '' };

export default function ProductionPage() {
  const { user } = useAuth();
  const [production, setProduction] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [cropPlantings, setCropPlantings] = useState([]);
  const [ricePlantings, setRicePlantings] = useState([]);
  const [productionForm, setProductionForm] = useState(emptyProduction);
  const [harvestForm, setHarvestForm] = useState(emptyHarvest);
  const [showProduction, setShowProduction] = useState(false);
  const [showHarvest, setShowHarvest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canManage = ['cao_admin', 'cao_staff', 'barangay_personnel'].includes(user.role);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [productionResponse, harvestResponse] = await Promise.all([
        api.get('/api/production'), api.get('/api/harvests'),
      ]);
      setProduction(productionResponse.data.data);
      setHarvests(harvestResponse.data.data);
      if (canManage) {
        const [referenceResponse, optionResponse, farmResponse] = await Promise.all([
          api.get('/api/production/references'), api.get('/api/production/options'), api.get('/api/farms'),
        ]);
        setCropTypes(referenceResponse.data.data.cropTypes);
        setVarieties(referenceResponse.data.data.riceVarieties);
        setFarmers(optionResponse.data.data.farmers);
        setCropPlantings(optionResponse.data.data.cropPlantings);
        setRicePlantings(optionResponse.data.data.ricePlantings);
        setFarms(farmResponse.data.data);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => { loadData(); }, [loadData]);

  async function submitProduction(event) {
    event.preventDefault();
    if (Boolean(productionForm.cropTypeId) === Boolean(productionForm.riceVarietyId)) {
      toast.error('Choose one crop type or rice variety.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/production', {
        ...productionForm, farmerId: Number(productionForm.farmerId), farmId: Number(productionForm.farmId),
        cropTypeId: productionForm.cropTypeId ? Number(productionForm.cropTypeId) : null,
        riceVarietyId: productionForm.riceVarietyId ? Number(productionForm.riceVarietyId) : null,
        productionYear: Number(productionForm.productionYear), quantity: Number(productionForm.quantity),
        season: productionForm.season.trim() || null, notes: productionForm.notes.trim() || null,
      });
      toast.success('Production summary recorded.');
      setProductionForm(emptyProduction);
      setShowProduction(false);
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function submitHarvest(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/harvests', {
        ...harvestForm,
        farmerId: Number(harvestForm.farmerId), farmId: Number(harvestForm.farmId),
        cropPlantingId: harvestForm.cropPlantingId ? Number(harvestForm.cropPlantingId) : null,
        ricePlantingId: harvestForm.ricePlantingId ? Number(harvestForm.ricePlantingId) : null,
        productionId: harvestForm.productionId ? Number(harvestForm.productionId) : null,
        quantity: Number(harvestForm.quantity), qualityNotes: harvestForm.qualityNotes.trim() || null,
      });
      toast.success('Harvest record created.');
      setHarvestForm(emptyHarvest);
      setShowHarvest(false);
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  const productionFarms = farms.filter((farm) => String(farm.farmer_id) === productionForm.farmerId);
  const harvestFarms = farms.filter((farm) => String(farm.farmer_id) === harvestForm.farmerId);
  const matchingCropPlantings = cropPlantings.filter((item) => String(item.farmer_id) === harvestForm.farmerId && String(item.farm_id) === harvestForm.farmId);
  const matchingRicePlantings = ricePlantings.filter((item) => String(item.farmer_id) === harvestForm.farmerId && String(item.farm_id) === harvestForm.farmId);
  const matchingProductions = production.filter((item) => String(item.farmer_id) === harvestForm.farmerId && String(item.farm_id) === harvestForm.farmId);

  return (
    <main className="records-page">
      <header className="records-topbar"><Brand /><Link to={user.role === 'farmer' ? '/farmer/dashboard' : '/dashboard'} className="records-back"><ArrowLeft size={16} /> Dashboard</Link></header>
      <section className="records-content">
        <div className="records-heading"><div><span className="panel-kicker">AGRICULTURAL OUTPUT</span><h1>Production &amp; harvest</h1><p>Record production summaries and individual harvest events.</p></div>
          {canManage && <div className="livestock-heading-actions">
            <button className="records-primary" onClick={() => setShowProduction((open) => !open)} type="button">{showProduction ? <X size={15} /> : <Plus size={15} />} Production</button>
            <button className="records-primary secondary" onClick={() => setShowHarvest((open) => !open)} type="button">{showHarvest ? <X size={15} /> : <Plus size={15} />} Harvest</button>
          </div>}</div>
        {error && <div className="records-error" role="alert">{error}<button onClick={loadData} type="button">Retry</button></div>}
        {showProduction && <form className="records-form" onSubmit={submitProduction}>
          <h2>Record production summary</h2>
          <div className="records-form-grid">
            <label>Farmer<select onChange={(event) => setProductionForm({ ...productionForm, farmerId: event.target.value, farmId: '' })} required value={productionForm.farmerId}><option value="">Select farmer</option>{farmers.map((item) => <option key={item.id} value={item.id}>{item.first_name} {item.last_name} · {item.barangay_name}</option>)}</select></label>
            <label>Farm<select onChange={(event) => setProductionForm({ ...productionForm, farmId: event.target.value })} required value={productionForm.farmId}><option value="">Select farm</option>{productionFarms.map((item) => <option key={item.id} value={item.id}>{item.farm_name || `Farm ${item.id}`}</option>)}</select></label>
            <label>Crop type (choose either crop or rice)<select onChange={(event) => setProductionForm({ ...productionForm, cropTypeId: event.target.value, riceVarietyId: event.target.value ? '' : productionForm.riceVarietyId })} value={productionForm.cropTypeId}><option value="">No crop selected</option>{cropTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Rice variety<select onChange={(event) => setProductionForm({ ...productionForm, riceVarietyId: event.target.value, cropTypeId: event.target.value ? '' : productionForm.cropTypeId })} value={productionForm.riceVarietyId}><option value="">No rice variety selected</option>{varieties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Production year<input max={new Date().getFullYear()} min="1900" onChange={(event) => setProductionForm({ ...productionForm, productionYear: event.target.value })} required type="number" value={productionForm.productionYear} /></label>
            <label>Season<input maxLength="80" onChange={(event) => setProductionForm({ ...productionForm, season: event.target.value })} value={productionForm.season} /></label>
            <label>Total quantity<input min="0.001" step="0.001" onChange={(event) => setProductionForm({ ...productionForm, quantity: event.target.value })} required type="number" value={productionForm.quantity} /></label>
            <label>Unit<input maxLength="40" onChange={(event) => setProductionForm({ ...productionForm, unit: event.target.value })} required value={productionForm.unit} /></label>
            <label>Notes<input maxLength="5000" onChange={(event) => setProductionForm({ ...productionForm, notes: event.target.value })} value={productionForm.notes} /></label>
          </div>
          <button className="records-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save production summary'}</button>
        </form>}
        {showHarvest && <form className="records-form" onSubmit={submitHarvest}>
          <h2>Record a harvest</h2>
          <div className="records-form-grid">
            <label>Farmer<select onChange={(event) => setHarvestForm({ ...harvestForm, farmerId: event.target.value, farmId: '', cropPlantingId: '', ricePlantingId: '', productionId: '' })} required value={harvestForm.farmerId}><option value="">Select farmer</option>{farmers.map((item) => <option key={item.id} value={item.id}>{item.first_name} {item.last_name} · {item.barangay_name}</option>)}</select></label>
            <label>Farm<select onChange={(event) => setHarvestForm({ ...harvestForm, farmId: event.target.value, cropPlantingId: '', ricePlantingId: '', productionId: '' })} required value={harvestForm.farmId}><option value="">Select farm</option>{harvestFarms.map((item) => <option key={item.id} value={item.id}>{item.farm_name || `Farm ${item.id}`}</option>)}</select></label>
            <label>Crop planting (optional)<select onChange={(event) => setHarvestForm({ ...harvestForm, cropPlantingId: event.target.value, ricePlantingId: event.target.value ? '' : harvestForm.ricePlantingId })} value={harvestForm.cropPlantingId}><option value="">Not linked</option>{matchingCropPlantings.map((item) => <option key={item.id} value={item.id}>{item.crop_name} · #{item.id}</option>)}</select></label>
            <label>Rice planting (optional)<select onChange={(event) => setHarvestForm({ ...harvestForm, ricePlantingId: event.target.value, cropPlantingId: event.target.value ? '' : harvestForm.cropPlantingId })} value={harvestForm.ricePlantingId}><option value="">Not linked</option>{matchingRicePlantings.map((item) => <option key={item.id} value={item.id}>{item.variety_name} · #{item.id}</option>)}</select></label>
            <label>Production summary (optional)<select onChange={(event) => setHarvestForm({ ...harvestForm, productionId: event.target.value })} value={harvestForm.productionId}><option value="">Not linked</option>{matchingProductions.map((item) => <option key={item.id} value={item.id}>#{item.id} · {item.production_year}</option>)}</select></label>
            <label>Harvest date<input max={today} onChange={(event) => setHarvestForm({ ...harvestForm, harvestedOn: event.target.value })} required type="date" value={harvestForm.harvestedOn} /></label>
            <label>Quantity<input min="0.001" step="0.001" onChange={(event) => setHarvestForm({ ...harvestForm, quantity: event.target.value })} required type="number" value={harvestForm.quantity} /></label>
            <label>Unit<input maxLength="40" onChange={(event) => setHarvestForm({ ...harvestForm, unit: event.target.value })} required value={harvestForm.unit} /></label>
            <label>Quality notes<input maxLength="5000" onChange={(event) => setHarvestForm({ ...harvestForm, qualityNotes: event.target.value })} value={harvestForm.qualityNotes} /></label>
          </div>
          <button className="records-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save harvest'}</button>
        </form>}
        <div className="records-toolbar"><strong>Recorded harvests</strong><span>{harvests.length} records</span></div>
        <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Harvest date</th><th>Crop</th><th>Farmer / farm</th><th>Barangay</th><th>Quantity</th></tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan="5">Loading harvests…</td></tr>
            : harvests.length === 0 ? <tr><td className="records-empty" colSpan="5"><Wheat size={20} />No harvest records.</td></tr>
              : harvests.map((item) => <tr key={item.id}><td>{item.harvested_on}</td><td>{item.crop_name || 'Unspecified crop'}</td><td>{item.farmer_name}<small>{item.farm_name || 'Farm record'}</small></td><td>{item.barangay_name}</td><td>{Number(item.quantity).toLocaleString()} {item.unit}</td></tr>)}
          </tbody>
        </table></div>
        <div className="records-toolbar"><strong>Production summaries</strong><span>{production.length} records</span></div>
        <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Year / season</th><th>Crop / variety</th><th>Farmer / farm</th><th>Barangay</th><th>Total</th></tr></thead>
          <tbody>{loading ? <tr><td className="records-empty" colSpan="5">Loading production…</td></tr>
            : production.length === 0 ? <tr><td className="records-empty" colSpan="5">No production summaries.</td></tr>
              : production.map((item) => <tr key={item.id}><td>{item.production_year}<small>{item.season || 'Season not specified'}</small></td><td>{item.crop_name || item.variety_name || 'Unspecified crop'}</td><td>{item.farmer_name}<small>{item.farm_name || 'Farm record'}</small></td><td>{item.barangay_name}</td><td>{Number(item.total_quantity).toLocaleString()} {item.unit}</td></tr>)}
          </tbody>
        </table></div>
      </section>
    </main>
  );
}
