import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Cloud,
  Eye,
  EyeOff,
  House,
  Leaf,
  LockKeyhole,
  LogOut,
  MapPin,
  Mail,
  Menu,
  MessageCircle,
  PawPrint,
  Settings,
  RefreshCw,
  ShieldCheck,
  Sprout,
  UserRound,
  Users,
  Wheat,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, getApiErrorMessage } from './api/client.js';
import { AuthProvider, useAuth } from './auth/AuthProvider.jsx';
import Brand from './components/Brand.jsx';
import GoogleSignInButton from './components/GoogleSignInButton.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AccountsPage from './pages/AccountsPage.jsx';
import FarmersPage from './pages/FarmersPage.jsx';
import FarmsPage from './pages/FarmsPage.jsx';
import RicePage from './pages/RicePage.jsx';
import CropsPage from './pages/CropsPage.jsx';
import LivestockPage from './pages/LivestockPage.jsx';
import ProductionPage from './pages/ProductionPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import OperationsPage from './pages/OperationsPage.jsx';
import AuditLogsPage from './pages/AuditLogsPage.jsx';
import MapPage from './pages/MapPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import DataTransferPage from './pages/DataTransferPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import PresentationDemoPage from './pages/PresentationDemoPage.jsx';
import './styles.css';

function homePath(user) {
  return user?.role === 'farmer' ? '/farmer/dashboard' : '/dashboard';
}

function LoginPage() {
  const { signIn, signInWithGoogle, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetNotice, setResetNotice] = useState('');

  if (status === 'authenticated') return <Navigate to={homePath(user)} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const signedInUser = await signIn({ email: email.trim(), password });
      toast.success('Welcome to AGRI-TRACK');
      const requestedPath = location.state?.from?.pathname;
      const destination = signedInUser.role === 'farmer'
        ? (requestedPath === '/farmer/dashboard' ? requestedPath : '/farmer/dashboard')
        : (requestedPath === '/dashboard' ? requestedPath : '/dashboard');
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential) {
    setFormError('');
    setSubmitting(true);
    try {
      const signedInUser = await signInWithGoogle(credential);
      toast.success('Welcome to AGRI-TRACK');
      navigate(signedInUser.role === 'farmer' ? '/farmer/dashboard' : '/dashboard', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function requestPasswordReset(event) {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const response = await api.post('/api/auth/password-reset/request', { email: email.trim() });
      setResetNotice(response.data.data.message);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="story-noise" />
        <div className="story-content">
          <Brand inverse />
          <div className="story-copy">
            <span className="story-kicker"><span /> CALAPAN CITY · AGRICULTURE OFFICE</span>
            <h1>Growing a<br />stronger <em>future.</em></h1>
            <p>A shared view of the people, places, and harvests that keep our community thriving.</p>
            <div className="story-stats">
              <span className="story-stat-icon"><Sprout size={19} /></span>
              <div><strong>Better records. Better decisions.</strong><span>One connected agricultural workspace.</span></div>
            </div>
          </div>
          <div className="story-bottom"><span>AGRICULTURE MANAGEMENT PLATFORM</span><span>ORIENTAL MINDORO · PH</span></div>
        </div>
        <div className="field-art" aria-hidden="true">
          <span className="field-sun" />
          <span className="field-hill hill-back" />
          <span className="field-hill hill-mid" />
          <span className="field-hill hill-front" />
          <span className="field-lines field-lines-one" />
          <span className="field-lines field-lines-two" />
          <span className="field-stalk stalk-one">⌁</span>
          <span className="field-stalk stalk-two">⌁</span>
          <span className="field-stalk stalk-three">⌁</span>
        </div>
      </section>

      <section className="login-main">
        <div className="login-card">
          <div className="mobile-brand"><Brand /></div>
          <div className="login-heading">
            <span className="login-eyebrow">SECURE WORKSPACE</span>
            <h2>Welcome back</h2>
            <p>Sign in with your CAO, barangay, or farmer account.</p>
          </div>

          <form className="login-form" onSubmit={forgotPassword ? requestPasswordReset : handleSubmit}>
            <label htmlFor="email">Work email</label>
            <div className="input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                autoComplete="username"
                autoFocus
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@organization.gov.ph"
                required
                type="email"
                value={email}
              />
            </div>

            {!forgotPassword && <>
              <div className="password-label">
                <label htmlFor="password">Password</label>
                <button className="login-link-button" onClick={() => { setForgotPassword(true); setFormError(''); setResetNotice(''); }} type="button">Forgot password?</button>
              </div>
              <div className="input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  autoComplete="current-password"
                  id="password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </>}

            {formError && <div className="form-error" role="alert">{formError}</div>}
            {resetNotice && <div className="form-success" role="status">{resetNotice}</div>}

            <button className="sign-in-button" disabled={submitting} type="submit">
              {submitting ? <><span className="button-spinner" /> Please wait…</> : forgotPassword ? <>Send reset link <ArrowUpRight size={17} /></> : <>Sign in <ArrowUpRight size={17} /></>}
            </button>
            {forgotPassword && <button className="login-link-button" onClick={() => { setForgotPassword(false); setFormError(''); setResetNotice(''); }} type="button">Back to sign in</button>}
          </form>

          {!forgotPassword && <div className="login-google-divider"><span>OR</span></div>}
          {!forgotPassword && <GoogleSignInButton onCredential={handleGoogleCredential} />}
          <div className="login-security"><ShieldCheck size={15} /><span>Your account is protected by secure authentication.</span></div>
          <div className="login-help"><CircleHelp size={15} /><span>Need access? Contact your system administrator.</span></div>
        </div>
        <footer className="login-footer"><span>© {new Date().getFullYear()} AGRI-TRACK</span><span>For authorized personnel only</span></footer>
      </section>
    </main>
  );
}

function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.hash.slice(1)).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/auth/password-reset/complete', { token, password });
      setComplete(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="reset-password-page">
      <Brand />
      <section className="reset-password-card">
        <h1>Choose a new password</h1>
        {complete ? <>
          <p>Your password has been updated. Sign in with your new password.</p>
          <button className="records-primary" onClick={() => navigate('/login', { replace: true })} type="button">Go to sign in</button>
        </> : !/^[a-f0-9]{64}$/i.test(token) ? <>
          <p role="alert">This reset link is invalid or missing. Request a new link from the sign-in page.</p>
          <Link to="/login" className="records-primary">Back to sign in</Link>
        </> : <form className="records-form" onSubmit={submit}>
          <label>New password<input autoComplete="new-password" minLength="12" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
          <label>Confirm new password<input autoComplete="new-password" minLength="12" onChange={(event) => setConfirmation(event.target.value)} required type="password" value={confirmation} /></label>
          {error && <div className="records-error" role="alert">{error}</div>}
          <button className="records-primary" disabled={saving} type="submit">{saving ? 'Updating…' : 'Update password'}</button>
        </form>}
      </section>
    </main>
  );
}

function MetricCard({ title, value, note, icon: Icon, tone }) {
  return (
    <article className="stat-card">
      <div className="stat-card-head">
        <span className={`stat-icon ${tone}`}><Icon size={19} strokeWidth={1.8} /></span>
        <span className="stat-period">ALL TIME</span>
      </div>
      <p className="stat-title">{title}</p>
      <div className="stat-value">{value === null ? '—' : value.toLocaleString()}</div>
      <div className="stat-note"><span className="stat-note-dot" />{note}</div>
    </article>
  );
}

function ProductionChart({ rows, loading }) {
  const monthLabels = new Intl.DateTimeFormat('en', { month: 'short' });
  const { chartData, units } = rows.reduce((result, row) => {
    const [year, month] = row.period.split('-').map(Number);
    const entry = result.chartData.find((item) => item.period === row.period);
    const label = monthLabels.format(new Date(year, month - 1, 1));
    const unit = String(row.unit || 'unspecified');
    const key = `unit:${unit}`;
    if (!result.units.includes(unit)) result.units.push(unit);
    if (entry) {
      entry[key] = Number(row.quantity);
    } else {
      result.chartData.push({ period: row.period, month: label, [key]: Number(row.quantity) });
    }
    return result;
  }, { chartData: [], units: [] });
  const colors = ['#6f9942', '#548b9c', '#d2a654', '#9c78b4', '#d27d66', '#6384b8'];

  return (
    <section className="dashboard-panel chart-panel">
      <div className="panel-title-row">
        <div><span className="panel-kicker">RECORDED HARVESTS</span><h2>Production overview</h2></div>
        <span className="actual-badge"><span /> Actual data</span>
      </div>
      <p className="panel-description">Harvest quantities recorded during the last six months.</p>
      {loading ? (
        <div className="chart-empty">
          <span><Wheat size={23} /></span>
          <strong>Loading production data…</strong>
        </div>
      ) : chartData.length ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="harvestFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#79a947" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#79a947" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eef0eb" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#969b96', fontSize: 11 }} dy={9} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#969b96', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ border: '1px solid #e8ebe4', borderRadius: 10, boxShadow: '0 6px 20px #20282010', fontSize: 12 }}
                formatter={(value, unit) => [`${Number(value).toLocaleString()} ${unit}`, 'Harvest']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.period || ''}
              />
              {units.map((unit, index) => (
                <Area
                  key={unit}
                  type="monotone"
                  dataKey={`unit:${unit}`}
                  name={unit}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2.5}
                  fill={index === 0 ? 'url(#harvestFill)' : 'none'}
                  connectNulls
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">
          <span><Wheat size={23} /></span>
          <strong>No harvest records yet</strong>
          <p>Recorded harvest data will appear here once available.</p>
        </div>
      )}
      {chartData.length > 0 && (
        <>
          <div className="chart-legend">
            {units.map((unit, index) => <span key={unit}><i style={{ backgroundColor: colors[index % colors.length] }} />{unit}</span>)}
          </div>
          <p className="chart-caveat">Actual recorded quantities only. Different units are shown separately.</p>
        </>
      )}
    </section>
  );
}

function DashboardPage() {
  const { user, signOut } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isCao = ['cao_admin', 'cao_staff'].includes(user.role);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    setError('');
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/api/dashboard');
      setDashboard(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success('You have signed out.');
    } catch (signOutError) {
      toast.error(getApiErrorMessage(signOutError));
    }
  }

  const metrics = dashboard?.metrics;
  const cards = [
    { title: 'Registered farmers', value: metrics ? metrics.farmers : null, note: 'Active farmer records', icon: Users, tone: 'sage' },
    ...(isCao ? [{ title: 'Barangays covered', value: metrics ? metrics.barangays : null, note: 'Active barangays', icon: Sprout, tone: 'mint' }] : []),
    { title: 'Registered farms', value: metrics ? metrics.farms : null, note: 'Farm records', icon: Leaf, tone: 'blue' },
    { title: 'Rice plantings', value: metrics ? metrics.ricePlantings : null, note: 'Planting activities', icon: Wheat, tone: 'gold' },
    { title: 'Crop plantings', value: metrics ? metrics.cropPlantings : null, note: 'High-value crops', icon: Sprout, tone: 'mint' },
    { title: 'Livestock heads', value: metrics ? metrics.livestockHeads : null, note: 'Recorded animal quantity', icon: Activity, tone: 'blue' },
    { title: 'Pending verification', value: metrics ? metrics.pendingVerifications : null, note: 'Rice monitoring submissions', icon: ShieldCheck, tone: 'rose' },
  ];

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar${menuOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand-row"><Brand /><button aria-label="Close navigation" className="mobile-menu-close" onClick={() => setMenuOpen(false)}><X size={18} /></button></div>
        <div className="workspace-switcher">
          <span className="workspace-avatar"><Sprout size={16} /></span>
          <span><strong>City Agriculture Office</strong><small>Calapan City workspace</small></span>
          <span className="switcher-dot" />
        </div>
        <span className="nav-section-label">WORKSPACE</span>
        <nav className="dashboard-nav" aria-label="Workspace navigation">
          <a className="dashboard-nav-link selected" href="/dashboard" onClick={() => setMenuOpen(false)}><Activity size={18} /><span>Dashboard</span><span className="nav-current" /></a>
          <a className="dashboard-nav-link" href="/farmers" onClick={() => setMenuOpen(false)}><Users size={18} /><span>Farmer records</span></a>
          <a className="dashboard-nav-link" href="/farms" onClick={() => setMenuOpen(false)}><House size={18} /><span>Farm records</span></a>
          <a className="dashboard-nav-link" href="/rice" onClick={() => setMenuOpen(false)}><Wheat size={18} /><span>Rice monitoring</span></a>
          <a className="dashboard-nav-link" href="/crops" onClick={() => setMenuOpen(false)}><Sprout size={18} /><span>Crop plantings</span></a>
          <a className="dashboard-nav-link" href="/livestock" onClick={() => setMenuOpen(false)}><PawPrint size={18} /><span>Livestock &amp; health</span></a>
          <a className="dashboard-nav-link" href="/production" onClick={() => setMenuOpen(false)}><Wheat size={18} /><span>Production &amp; harvest</span></a>
          <a className="dashboard-nav-link" href="/reports" onClick={() => setMenuOpen(false)}><ClipboardList size={18} /><span>Reports &amp; exports</span></a>
          <a className="dashboard-nav-link" href="/analytics" onClick={() => setMenuOpen(false)}><BarChart3 size={18} /><span>Harvest analytics</span></a>
          <a className="dashboard-nav-link" href="/communications" onClick={() => setMenuOpen(false)}><MessageCircle size={18} /><span>Communications</span></a>
          <a className="dashboard-nav-link" href="/calendar" onClick={() => setMenuOpen(false)}><CalendarDays size={18} /><span>Calendar &amp; updates</span></a>
          <a className="dashboard-nav-link" href="/map" onClick={() => setMenuOpen(false)}><MapPin size={18} /><span>Farm coordinate map</span></a>
          <a className="dashboard-nav-link" href="/presentation-demo" onClick={() => setMenuOpen(false)}><ClipboardList size={18} /><span>Presentation demo</span></a>
          <a className="dashboard-nav-link" href="/settings" onClick={() => setMenuOpen(false)}><Settings size={18} /><span>Profile &amp; security</span></a>
          {user.role !== 'farmer' && <a className="dashboard-nav-link" href="/imports" onClick={() => setMenuOpen(false)}><ArrowDownRight size={18} /><span>Data import &amp; export</span></a>}
          {user.role === 'cao_admin' && <a className="dashboard-nav-link" href="/admin/accounts" onClick={() => setMenuOpen(false)}><ShieldCheck size={18} /><span>Account management</span></a>}
          {user.role === 'cao_admin' && <a className="dashboard-nav-link" href="/admin/audit-logs" onClick={() => setMenuOpen(false)}><ShieldCheck size={18} /><span>Audit log</span></a>}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-phase"><span><CheckCircle2 size={16} /></span><div><strong>AGRI-TRACK workspace</strong><small>Role-scoped agricultural records</small></div></div>
          <div className="sidebar-user">
            <span className="user-avatar">{(user.name || user.username || 'U').charAt(0).toUpperCase()}</span>
            <div className="sidebar-user-copy"><strong>{user.name || user.username}</strong><small>{user.role === 'cao_admin' ? 'CAO Administrator' : isCao ? 'CAO Staff' : 'Barangay Personnel'}</small></div>
            <button aria-label="Sign out" className="logout-icon" onClick={handleSignOut}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      {menuOpen && <button aria-label="Close navigation overlay" className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button aria-label="Open navigation" className="mobile-menu-button" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
          <div className="dashboard-breadcrumb"><span>AGRI-TRACK</span><span>/</span><strong>Dashboard</strong></div>
          <div className="topbar-right">
            <div className="secure-indicator"><span /><ShieldCheck size={14} /> Secure connection</div>
            <span className="topbar-separator" />
            <span className="topbar-date"><CalendarDays size={15} />{new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date())}</span>
            <button className="topbar-user" onClick={handleSignOut} title="Sign out"><span>{(user.name || user.username || 'U').charAt(0).toUpperCase()}</span></button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow"><span /> AGRICULTURE MANAGEMENT</div>
              <h1>Good day, <span>{(user.name || user.username || 'there').split(' ')[0]}.</span></h1>
              <p>{isCao ? 'Here is the latest overview across Calapan City.' : `Here is the latest overview for ${user.barangayName || dashboard?.scope?.barangayName || 'your assigned barangay'}.`}</p>
              {!isCao && (user.barangayName || dashboard?.scope?.barangayName) && <span className="barangay-chip"><Sprout size={13} /> {user.barangayName || dashboard?.scope?.barangayName}</span>}
            </div>
            <button className="refresh-dashboard" disabled={refreshing} onClick={() => loadDashboard(true)}><RefreshCw className={refreshing ? 'spinning' : ''} size={15} /> Refresh data</button>
          </section>

          {error && (
            <div className="dashboard-error" role="alert">
              <span><Cloud size={17} /></span>
              <div><strong>Dashboard data is unavailable</strong><p>{error}</p></div>
              <button onClick={() => loadDashboard(true)}>Retry</button>
            </div>
          )}

          <div className="stats-heading"><div><h2>At a glance</h2><p>Current records in your authorized data scope</p></div><span className="data-live" role="status" aria-live="polite"><span />{loading && !dashboard ? ' Loading live data' : ' Live data'}</span></div>
          <section className={`stats-grid${isCao ? ' cao-stats' : ''}`} aria-label="Agriculture statistics">
            {cards.map((card) => <MetricCard key={card.title} {...card} />)}
          </section>

          <section className="dashboard-lower-grid">
            <ProductionChart rows={dashboard?.productionTrend || []} loading={loading && !dashboard} />
            <section className="dashboard-panel activities-panel">
              <div className="panel-title-row">
                <div><span className="panel-kicker">NEXT 30 DAYS</span><h2>Upcoming activities</h2></div>
                <span className="activity-count">{dashboard?.upcomingActivities?.length || 0}</span>
              </div>
              <p className="panel-description">Expected maturity and harvest dates from registered plantings.</p>
              {loading && !dashboard ? (
                <div className="activity-empty">
                  <span><CalendarDays size={20} /></span>
                  <strong>Loading upcoming activities…</strong>
                </div>
              ) : dashboard?.upcomingActivities?.length ? (
                <ul className="activity-list">
                  {dashboard.upcomingActivities.map((activity) => (
                    <li key={`${activity.type}-${activity.id}`}>
                      <span className={`activity-type-icon ${activity.type}`}><CalendarDays size={16} /></span>
                      <div><strong>{activity.title}</strong><span>{activity.farmer_name || 'Farmer not specified'}</span></div>
                      <time dateTime={activity.activity_date}>{new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(new Date(`${activity.activity_date}T00:00:00`))}</time>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="activity-empty">
                  <span><CalendarDays size={20} /></span>
                  <strong>No upcoming activities</strong>
                  <p>Upcoming planting dates will appear here when available.</p>
                </div>
              )}
              <div className="activities-footnote"><ArrowDownRight size={14} /> Activities are calculated from backend planting records.</div>
            </section>
          </section>

          <footer className="dashboard-footer"><span>AGRI-TRACK <i /> CITY AGRICULTURE OFFICE · CALAPAN CITY</span><span>{dashboard?.generatedAt ? `Updated ${new Intl.DateTimeFormat('en-PH', { hour: '2-digit', minute: '2-digit' }).format(new Date(dashboard.generatedAt))}` : 'Awaiting backend data'}</span></footer>
        </div>
      </main>
    </div>
  );
}

function FarmerDashboardPage() {
  const { user, signOut } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    setError('');
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/api/farmer/dashboard');
      setDashboard(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success('You have signed out.');
    } catch (signOutError) {
      toast.error(getApiErrorMessage(signOutError));
    }
  }

  const profile = dashboard?.profile;
  const metrics = dashboard?.metrics;
  const farmerName = [profile?.first_name, profile?.middle_name, profile?.last_name, profile?.suffix]
    .filter(Boolean)
    .join(' ') || user.name || user.username;
  const metricCards = [
    { title: 'My farms', value: metrics?.farms ?? null, note: 'Registered farm records', icon: House, tone: 'sage' },
    { title: 'Rice plantings', value: metrics?.ricePlantings ?? null, note: 'My rice activities', icon: Wheat, tone: 'gold' },
    { title: 'Crop plantings', value: metrics?.cropPlantings ?? null, note: 'My crop activities', icon: Sprout, tone: 'mint' },
    { title: 'Livestock heads', value: metrics?.livestockHeads ?? null, note: 'My recorded livestock', icon: PawPrint, tone: 'blue' },
    { title: 'Harvest records', value: metrics?.harvestRecords ?? null, note: 'My recorded harvests', icon: ClipboardList, tone: 'rose' },
  ];

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar${menuOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand-row"><Brand to="/farmer/dashboard" /><button aria-label="Close navigation" className="mobile-menu-close" onClick={() => setMenuOpen(false)}><X size={18} /></button></div>
        <div className="workspace-switcher">
          <span className="workspace-avatar"><Sprout size={16} /></span>
          <span><strong>Farmer workspace</strong><small>Personal farm records</small></span>
          <span className="switcher-dot" />
        </div>
        <span className="nav-section-label">MY RECORDS</span>
        <nav className="dashboard-nav" aria-label="Farmer navigation">
          <a className="dashboard-nav-link selected" href="/farmer/dashboard" onClick={() => setMenuOpen(false)}><Activity size={18} /><span>My dashboard</span><span className="nav-current" /></a>
          <a className="dashboard-nav-link" href="/farms" onClick={() => setMenuOpen(false)}><House size={18} /><span>My farms</span></a>
          <a className="dashboard-nav-link" href="/rice" onClick={() => setMenuOpen(false)}><Wheat size={18} /><span>Rice monitoring</span></a>
          <a className="dashboard-nav-link" href="/crops" onClick={() => setMenuOpen(false)}><Sprout size={18} /><span>Crop plantings</span></a>
          <a className="dashboard-nav-link" href="/livestock" onClick={() => setMenuOpen(false)}><PawPrint size={18} /><span>Livestock</span></a>
          <a className="dashboard-nav-link" href="/production" onClick={() => setMenuOpen(false)}><ClipboardList size={18} /><span>Production &amp; harvest</span></a>
          <a className="dashboard-nav-link" href="/reports" onClick={() => setMenuOpen(false)}><BarChart3 size={18} /><span>Harvest reports</span></a>
          <a className="dashboard-nav-link" href="/analytics" onClick={() => setMenuOpen(false)}><BarChart3 size={18} /><span>Harvest trends</span></a>
          <a className="dashboard-nav-link" href="/communications" onClick={() => setMenuOpen(false)}><MessageCircle size={18} /><span>Communications</span></a>
          <a className="dashboard-nav-link" href="/map" onClick={() => setMenuOpen(false)}><MapPin size={18} /><span>Farm coordinate map</span></a>
          <a className="dashboard-nav-link" href="/presentation-demo" onClick={() => setMenuOpen(false)}><ClipboardList size={18} /><span>Presentation demo</span></a>
          <a className="dashboard-nav-link" href="/settings" onClick={() => setMenuOpen(false)}><Settings size={18} /><span>Profile &amp; security</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-phase"><span><ShieldCheck size={16} /></span><div><strong>Private farmer view</strong><small>Only your linked records</small></div></div>
          <div className="sidebar-user">
            <span className="user-avatar">{farmerName.charAt(0).toUpperCase()}</span>
            <div className="sidebar-user-copy"><strong>{farmerName}</strong><small>Farmer</small></div>
            <button aria-label="Sign out" className="logout-icon" onClick={handleSignOut}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      {menuOpen && <button aria-label="Close navigation overlay" className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button aria-label="Open navigation" className="mobile-menu-button" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
          <div className="dashboard-breadcrumb"><span>AGRI-TRACK</span><span>/</span><strong>Farmer dashboard</strong></div>
          <div className="topbar-right">
            <div className="secure-indicator"><span /><ShieldCheck size={14} /> Private records</div>
            <span className="topbar-separator" />
            <span className="topbar-date"><CalendarDays size={15} />{new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date())}</span>
            <button className="topbar-user" onClick={handleSignOut} title="Sign out"><span>{farmerName.charAt(0).toUpperCase()}</span></button>
          </div>
        </header>

        <div className="dashboard-content farmer-content">
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow"><span /> MY FARMER WORKSPACE</div>
              <h1>Welcome, <span>{farmerName.split(' ')[0]}.</span></h1>
              <p>Your profile and agricultural records linked to this account.</p>
              {profile?.barangay_name && <span className="barangay-chip"><MapPin size={13} /> {profile.barangay_name}</span>}
            </div>
            <button className="refresh-dashboard" disabled={refreshing} onClick={() => loadDashboard(true)}><RefreshCw className={refreshing ? 'spinning' : ''} size={15} /> Refresh data</button>
          </section>

          {profile?.is_sample === 1 && (
            <div className="sample-profile-notice"><ShieldCheck size={16} /><span>This is a sample farmer profile for testing. It is not official CAO data.</span></div>
          )}

          {error && (
            <div className="dashboard-error" role="alert">
              <span><Cloud size={17} /></span>
              <div><strong>Your records are unavailable</strong><p>{error}</p></div>
              <button onClick={() => loadDashboard(true)}>Retry</button>
            </div>
          )}

          <div className="stats-heading"><div><h2>My agricultural records</h2><p>Only records linked to your farmer profile are shown</p></div><span className="data-live" role="status" aria-live="polite"><span />{loading && !dashboard ? ' Loading records' : ' Private view'}</span></div>
          <section className="stats-grid farmer-stats" aria-label="My agricultural records">
            {metricCards.map((card) => <MetricCard key={card.title} {...card} />)}
          </section>

          <section className="dashboard-lower-grid farmer-lower-grid">
            <section className="dashboard-panel farmer-profile-panel">
              <div className="panel-title-row"><div><span className="panel-kicker">MY ACCOUNT</span><h2>Farmer profile</h2></div><span className="farmer-profile-icon"><UserRound size={17} /></span></div>
              <div className="farmer-profile-name">{farmerName}</div>
              <dl className="farmer-profile-details">
                <div><dt>Barangay</dt><dd>{profile?.barangay_name || 'Not specified'}</dd></div>
                <div><dt>Registry number</dt><dd>{profile?.registry_number || 'Not assigned'}</dd></div>
                <div><dt>Primary livelihood</dt><dd>{profile?.primary_livelihood || 'Not specified'}</dd></div>
                <div><dt>Contact</dt><dd>{profile?.phone || profile?.email || 'Not provided'}</dd></div>
                <div><dt>Address</dt><dd>{profile?.address || 'Not specified'}</dd></div>
              </dl>
              <p className="farmer-profile-note">For corrections to your profile, contact your barangay agriculture personnel.</p>
            </section>

            <section className="dashboard-panel farmer-activity-panel">
              <div className="panel-title-row"><div><span className="panel-kicker">NEXT 30 DAYS</span><h2>My upcoming activities</h2></div><span className="activity-count">{dashboard?.upcomingActivities?.length || 0}</span></div>
              <p className="panel-description">Planting maturity and harvest dates from your records.</p>
              {loading && !dashboard ? (
                <div className="activity-empty">
                  <span><CalendarDays size={20} /></span>
                  <strong>Loading upcoming activities…</strong>
                </div>
              ) : dashboard?.upcomingActivities?.length ? (
                <ul className="activity-list">
                  {dashboard.upcomingActivities.map((activity) => (
                    <li key={`${activity.type}-${activity.id}`}>
                      <span className={`activity-type-icon ${activity.type}`}><CalendarDays size={16} /></span>
                      <div><strong>{activity.title}</strong><span>From your planting records</span></div>
                      <time dateTime={activity.activity_date}>{new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(new Date(`${activity.activity_date}T00:00:00`))}</time>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="activity-empty">
                  <span><CalendarDays size={20} /></span>
                  <strong>No upcoming activities</strong>
                  <p>Your expected maturity or harvest dates will appear here.</p>
                </div>
              )}
            </section>

            <section className="dashboard-panel farmer-farms-panel">
              <div className="panel-title-row"><div><span className="panel-kicker">REGISTERED LAND</span><h2>My farms</h2></div><span className="activity-count">{dashboard?.farms?.length || 0}</span></div>
              {loading && !dashboard ? (
                <div className="farmer-list-empty">Loading farm records…</div>
              ) : dashboard?.farms?.length ? (
                <ul className="farmer-record-list">
                  {dashboard.farms.map((farm, index) => (
                    <li key={`${farm.farm_name || farm.location_description || 'farm'}-${index}`}>
                      <span className="farmer-record-icon"><House size={16} /></span>
                      <div><strong>{farm.farm_name || 'Farm record'}</strong><span>{farm.location_description || farm.ownership_type || 'Location not specified'}</span></div>
                      <span className="farmer-record-area">{farm.area_hectares ? `${Number(farm.area_hectares).toLocaleString()} ha` : 'Area n/a'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="farmer-list-empty">No farm records are linked to your profile yet.</div>
              )}
            </section>

            <section className="dashboard-panel farmer-harvest-panel">
              <div className="panel-title-row"><div><span className="panel-kicker">LATEST RECORDS</span><h2>My recent harvests</h2></div><span className="activity-count">{dashboard?.recentHarvests?.length || 0}</span></div>
              {loading && !dashboard ? (
                <div className="farmer-list-empty">Loading harvest records…</div>
              ) : dashboard?.recentHarvests?.length ? (
                <ul className="farmer-record-list">
                  {dashboard.recentHarvests.map((harvest, index) => (
                    <li key={`${harvest.harvested_on}-${harvest.crop_name}-${index}`}>
                      <span className="farmer-record-icon harvest"><Wheat size={16} /></span>
                      <div><strong>{harvest.crop_name}</strong><span>{new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(`${harvest.harvested_on}T00:00:00`))}</span></div>
                      <span className="farmer-record-area">{Number(harvest.quantity).toLocaleString()} {harvest.unit}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="farmer-list-empty">No harvest records are linked to your profile yet.</div>
              )}
            </section>
          </section>

          <footer className="dashboard-footer"><span>AGRI-TRACK <i /> FARMER WORKSPACE</span><span>{dashboard?.generatedAt ? `Updated ${new Intl.DateTimeFormat('en-PH', { hour: '2-digit', minute: '2-digit' }).format(new Date(dashboard.generatedAt))}` : 'Awaiting backend data'}</span></footer>
        </div>
      </main>
    </div>
  );
}

function ForbiddenPage() {
  return (
    <main className="forbidden-page">
      <ShieldCheck size={38} />
      <h1>Access not permitted</h1>
      <p>Your account does not have permission to open this page.</p>
      <a href="/dashboard">Return to dashboard <ArrowUpRight size={15} /></a>
    </main>
  );
}

function AppRoutes() {
  const { status, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={status === 'authenticated' ? <Navigate to={homePath(user)} replace /> : <LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute allowedRoles={['cao_admin', 'cao_staff', 'barangay_personnel']} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/farmers" element={<FarmersPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['cao_admin', 'cao_staff', 'barangay_personnel', 'farmer']} />}>
        <Route path="/farms" element={<FarmsPage />} />
        <Route path="/crops" element={<CropsPage />} />
        <Route path="/livestock" element={<LivestockPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['cao_admin', 'cao_staff', 'barangay_personnel', 'farmer']} />}>
        <Route path="/production" element={<ProductionPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/communications" element={<OperationsPage />} />
        <Route path="/calendar" element={<OperationsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/presentation-demo" element={<PresentationDemoPage />} />
        <Route path="/settings" element={<ProfilePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['cao_admin', 'cao_staff', 'barangay_personnel']} />}>
        <Route path="/imports" element={<DataTransferPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['cao_admin', 'cao_staff', 'barangay_personnel', 'farmer']} />}>
        <Route path="/rice" element={<RicePage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['cao_admin']} />}>
        <Route path="/admin/accounts" element={<AccountsPage />} />
        <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['farmer']} />}>
        <Route path="/farmer/dashboard" element={<FarmerDashboardPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['cao_admin', 'cao_staff', 'barangay_personnel', 'farmer']} />}>
        <Route path="/" element={<Navigate to={homePath(user)} replace />} />
      </Route>
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<Navigate to={status === 'authenticated' ? homePath(user) : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
