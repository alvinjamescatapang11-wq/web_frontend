import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Plus, Search, ShieldCheck, UserCog, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import Brand from '../components/Brand.jsx';

const emptyForm = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  role: 'cao_staff',
  barangayId: '',
  farmerId: '',
};
const roleNames = {
  cao_admin: 'CAO Administrator',
  cao_staff: 'CAO Staff',
  barangay_personnel: 'Barangay Personnel',
  farmer: 'Farmer',
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [options, setOptions] = useState({ roles: [], barangays: [], unlinkedFarmers: [] });
  const [pagination, setPagination] = useState(null);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAccounts = useCallback(async (page = 1) => {
    setError('');
    setLoading(true);
    try {
      const [accountsResponse, optionsResponse] = await Promise.all([
        api.get('/api/admin/users', { params: { q: query, role, status, page, perPage: 20 } }),
        api.get('/api/admin/users/options'),
      ]);
      const result = accountsResponse.data.data;
      setAccounts(result.data);
      setPagination(result.pagination);
      setOptions(optionsResponse.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [query, role, status]);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  async function createAccount(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      fullName: form.fullName,
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role,
    };
    if (form.role === 'barangay_personnel') payload.barangayId = Number(form.barangayId);
    if (form.role === 'farmer') payload.farmerId = Number(form.farmerId);
    try {
      await api.post('/api/admin/users', payload);
      toast.success('Account created and audited.');
      setForm(emptyForm);
      setShowForm(false);
      await loadAccounts();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function setActive(account, isActive) {
    const action = isActive ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} ${account.full_name || account.username}?`)) return;
    try {
      await api.patch(`/api/admin/users/${account.id}`, { isActive });
      toast.success(`Account ${isActive ? 'activated' : 'deactivated'}.`);
      await loadAccounts(pagination?.page || 1);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    }
  }

  async function resetPassword(account) {
    const password = window.prompt(`Enter a new password for ${account.full_name || account.username} (at least 12 characters).`);
    if (password === null) return;
    try {
      await api.patch(`/api/admin/users/${account.id}`, { password });
      toast.success('Password reset; active sessions were revoked.');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    }
  }

  return (
    <main className="records-page">
      <header className="records-topbar"><Brand /><Link to="/dashboard" className="records-back"><ArrowLeft size={16} /> Dashboard</Link></header>
      <section className="records-content">
        <div className="records-heading">
          <div><span className="panel-kicker">PROTECTED ADMINISTRATION</span><h1>Account management</h1><p>Create and manage CAO Staff, Barangay Personnel, and linked Farmer accounts.</p></div>
          <button className="records-primary" onClick={() => setShowForm((open) => !open)} type="button">{showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? 'Close form' : 'Create account'}</button>
        </div>
        {showForm && (
          <form className="records-form" onSubmit={createAccount}>
            <h2>Create a user account</h2>
            <p className="records-form-hint">Administrator accounts are provisioned separately from this form.</p>
            <div className="records-form-grid">
              <label>Full name<input maxLength="150" onChange={(event) => setForm({ ...form, fullName: event.target.value })} required value={form.fullName} /></label>
              <label>Username<input maxLength="100" onChange={(event) => setForm({ ...form, username: event.target.value })} required value={form.username} /></label>
              <label>Email<input maxLength="255" onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} /></label>
              <label>Initial password<input autoComplete="new-password" minLength="12" onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} /></label>
              <label>Role<select onChange={(event) => setForm({ ...form, role: event.target.value, barangayId: '', farmerId: '' })} value={form.role}>
                {options.roles.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
              </select></label>
              {form.role === 'barangay_personnel' && <label>Assigned barangay<select onChange={(event) => setForm({ ...form, barangayId: event.target.value })} required value={form.barangayId}><option value="">Select a barangay</option>{options.barangays.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
              {form.role === 'farmer' && <label>Existing farmer profile<select onChange={(event) => setForm({ ...form, farmerId: event.target.value })} required value={form.farmerId}><option value="">Select an unlinked farmer</option>{options.unlinkedFarmers.map((item) => <option key={item.id} value={item.id}>{[item.first_name, item.middle_name, item.last_name, item.suffix].filter(Boolean).join(' ')}{Number(item.is_sample) ? ' (sample)' : ''}</option>)}</select></label>}
            </div>
            <button className="records-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Create account'}</button>
          </form>
        )}
        <div className="records-toolbar accounts-toolbar">
          <form className="records-search" onSubmit={(event) => { event.preventDefault(); loadAccounts(); }}><Search size={16} /><input maxLength="100" onChange={(event) => setQuery(event.target.value)} placeholder="Search name, username, or email" value={query} /><button type="submit">Search</button></form>
          <select aria-label="Filter by role" onChange={(event) => setRole(event.target.value)} value={role}><option value="">All roles</option>{options.roles.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
          <select aria-label="Filter by account status" onChange={(event) => setStatus(event.target.value)} value={status}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <span>{pagination?.total ?? 0} accounts</span>
        </div>
        {error && <div className="records-error" role="alert">{error}<button onClick={() => loadAccounts()} type="button">Retry</button></div>}
        <div className="records-table-wrap">
          <table className="records-table">
            <thead><tr><th>Account</th><th>Role</th><th>Assignment</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td className="records-empty" colSpan="5">Loading accounts…</td></tr>
                : accounts.length === 0 ? <tr><td className="records-empty" colSpan="5"><UserCog size={20} />No accounts found.</td></tr>
                  : accounts.map((account) => (
                    <tr key={account.id}>
                      <td><strong>{account.full_name || account.username}</strong><small>{account.email} · @{account.username}</small></td>
                      <td>{roleNames[account.role] || account.role}</td>
                      <td>{account.role === 'farmer' ? `Farmer #${account.farmer_id || '—'}` : account.barangay_name || 'City-wide'}</td>
                      <td><span className={`record-status ${Number(account.is_active) ? 'active' : 'inactive'}`}>{Number(account.is_active) ? 'Active' : 'Inactive'}</span></td>
                      <td className="record-actions">
                        {account.role !== 'cao_admin' && <button className="records-text-button" onClick={() => setActive(account, !Number(account.is_active))} type="button">{Number(account.is_active) ? 'Deactivate' : 'Activate'}</button>}
                        {account.role !== 'cao_admin' && <button className="records-text-button" onClick={() => resetPassword(account)} type="button">Reset password</button>}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {pagination?.pages > 1 && <div className="records-pagination"><button disabled={pagination.page <= 1} onClick={() => loadAccounts(pagination.page - 1)} type="button">Previous</button><span>Page {pagination.page} of {pagination.pages}</span><button disabled={pagination.page >= pagination.pages} onClick={() => loadAccounts(pagination.page + 1)} type="button">Next</button></div>}
        <p className="records-note"><ShieldCheck size={14} /> Only the CAO Administrator API role can access this page. Password resets revoke existing sessions.</p>
      </section>
    </main>
  );
}
