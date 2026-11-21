import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Leaf, Plus, Search, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';

const emptyForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  registryNumber: '',
  phone: '',
  email: '',
  primaryLivelihood: '',
  barangayId: '',
};

export default function FarmersPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRecords = useCallback(async (page = 1) => {
    setError('');
    setLoading(true);
    try {
      const [farmerResponse, barangayResponse] = await Promise.all([
        api.get('/api/farmers', { params: { q: query, page, perPage: 20 } }),
        api.get('/api/barangays'),
      ]);
      const result = farmerResponse.data.data;
      setRecords(result.data);
      setPagination(result.pagination);
      setBarangays(barangayResponse.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  async function createFarmer(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        barangayId: form.barangayId ? Number(form.barangayId) : undefined,
      };
      await api.post('/api/farmers', payload);
      toast.success('Farmer record created.');
      setForm(emptyForm);
      setShowForm(false);
      await loadRecords();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function archiveFarmer(record) {
    if (!window.confirm(`Archive ${record.first_name} ${record.last_name}?`)) return;
    try {
      await api.delete(`/api/farmers/${record.id}`);
      toast.success('Farmer record archived.');
      await loadRecords(pagination?.page || 1);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    }
  }

  const canChooseBarangay = user.role !== 'barangay_personnel';
  return (
    <main className="records-page">
      <header className="records-topbar">
        <Brand />
        <Link to="/dashboard" className="records-back"><ArrowLeft size={16} /> Dashboard</Link>
      </header>
      <section className="records-content">
        <div className="records-heading">
          <div>
            <span className="panel-kicker">AGRICULTURAL REGISTRY</span>
            <h1>Farmer records</h1>
            <p>Search and manage farmer information in your authorized data scope.</p>
          </div>
          <button className="records-primary" onClick={() => setShowForm((open) => !open)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Close form' : 'Add farmer'}
          </button>
        </div>
        {showForm && (
          <form className="records-form" onSubmit={createFarmer}>
            <h2>Register a farmer</h2>
            <div className="records-form-grid">
              <label>First name<input maxLength="100" onChange={(event) => setForm({ ...form, firstName: event.target.value })} required value={form.firstName} /></label>
              <label>Middle name<input maxLength="100" onChange={(event) => setForm({ ...form, middleName: event.target.value })} value={form.middleName} /></label>
              <label>Last name<input maxLength="100" onChange={(event) => setForm({ ...form, lastName: event.target.value })} required value={form.lastName} /></label>
              <label>Registry number<input maxLength="80" onChange={(event) => setForm({ ...form, registryNumber: event.target.value })} value={form.registryNumber} /></label>
              <label>Phone<input maxLength="40" onChange={(event) => setForm({ ...form, phone: event.target.value })} value={form.phone} /></label>
              <label>Email<input maxLength="255" onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" value={form.email} /></label>
              <label>Primary livelihood<input maxLength="150" onChange={(event) => setForm({ ...form, primaryLivelihood: event.target.value })} value={form.primaryLivelihood} /></label>
              {canChooseBarangay && (
                <label>Barangay<select onChange={(event) => setForm({ ...form, barangayId: event.target.value })} required value={form.barangayId}>
                  <option value="">Select a barangay</option>
                  {barangays.map((barangay) => <option key={barangay.id} value={barangay.id}>{barangay.name}</option>)}
                </select></label>
              )}
            </div>
            <button className="records-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save farmer record'}</button>
          </form>
        )}
        <div className="records-toolbar">
          <form className="records-search" onSubmit={(event) => { event.preventDefault(); loadRecords(); }}>
            <Search size={16} />
            <input maxLength="100" onChange={(event) => setQuery(event.target.value)} placeholder="Search name, registry number, or phone" value={query} />
            <button type="submit">Search</button>
          </form>
          <span>{pagination?.total ?? 0} records</span>
        </div>
        {error && <div className="records-error" role="alert">{error}<button onClick={() => loadRecords()} type="button">Retry</button></div>}
        <div className="records-table-wrap">
          <table className="records-table">
            <thead><tr><th>Farmer</th><th>Barangay</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td className="records-empty" colSpan="5">Loading farmer records…</td></tr>
                : records.length === 0 ? <tr><td className="records-empty" colSpan="5"><UserRound size={20} />No farmer records found.</td></tr>
                  : records.map((record) => (
                    <tr key={record.id}>
                      <td><strong>{[record.first_name, record.middle_name, record.last_name, record.suffix].filter(Boolean).join(' ')}</strong><small>{record.registry_number || (record.is_sample ? 'Sample record' : 'No registry number')}</small></td>
                      <td>{record.barangay_name}</td>
                      <td>{record.phone || record.email || '—'}</td>
                      <td><span className={`record-status ${Number(record.is_active) ? 'active' : 'inactive'}`}>{Number(record.is_active) ? 'Active' : 'Inactive'}</span></td>
                      <td><button className="records-text-button" disabled={!Number(record.is_active)} onClick={() => archiveFarmer(record)} type="button">Archive</button></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {pagination?.pages > 1 && <div className="records-pagination"><button disabled={pagination.page <= 1} onClick={() => loadRecords(pagination.page - 1)} type="button">Previous</button><span>Page {pagination.page} of {pagination.pages}</span><button disabled={pagination.page >= pagination.pages} onClick={() => loadRecords(pagination.page + 1)} type="button">Next</button></div>}
        <p className="records-note"><Leaf size={14} /> Farmer records are restricted by the backend to your assigned barangay where applicable. Sample profiles are labeled.</p>
      </section>
    </main>
  );
}
