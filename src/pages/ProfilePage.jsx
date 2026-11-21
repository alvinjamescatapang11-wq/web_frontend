import { useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, Save, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';

export default function ProfilePage() {
  const { user, updateUser, expireSession } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ fullName: user.name || '', email: user.email || '' });
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmailPreference, setSavingEmailPreference] = useState(false);
  const [announcementsEnabled, setAnnouncementsEnabled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/api/auth/email-preferences')
      .then((response) => {
        if (active) setAnnouncementsEnabled(response.data.data.announcementsEnabled);
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError));
      });
    return () => { active = false; };
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    try {
      const changesEmail = profile.email.trim().toLowerCase() !== (user.email || '').toLowerCase();
      const response = await api.patch('/api/auth/profile', {
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        ...(changesEmail ? { currentPassword: profileCurrentPassword } : {}),
      });
      updateUser({ name: response.data.data.name, email: response.data.data.email });
      setProfileCurrentPassword('');
      toast.success('Profile updated.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setSavingPassword(true);
    setError('');
    if (password !== confirmPassword) {
      setError('The new passwords do not match.');
      setSavingPassword(false);
      return;
    }
    try {
      await api.patch('/api/auth/profile', {
        currentPassword: passwordCurrentPassword,
        password,
      });
      toast.success('Password changed. Sign in again with your new password.');
      expireSession();
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSavingPassword(false);
    }
  }

  async function changeAnnouncementPreference(event) {
    const enabled = event.target.checked;
    setSavingEmailPreference(true);
    setError('');
    try {
      const response = await api.patch('/api/auth/email-preferences', { announcementsEnabled: enabled });
      setAnnouncementsEnabled(response.data.data.announcementsEnabled);
      toast.success(enabled ? 'Announcement emails enabled.' : 'Announcement emails disabled.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSavingEmailPreference(false);
    }
  }

  return (
    <main className="records-page">
      <header className="records-topbar">
        <Brand />
        <Link to={user.role === 'farmer' ? '/farmer/dashboard' : '/dashboard'} className="records-back"><ArrowLeft size={16} /> Dashboard</Link>
      </header>
      <section className="records-content">
        <div className="records-heading">
          <div><span className="panel-kicker">ACCOUNT SETTINGS</span><h1>Profile &amp; security</h1><p>Update your account details and password.</p></div>
        </div>
        {error && <div className="records-error" role="alert">{error}</div>}
        <div className="profile-settings-grid">
          <section className="records-form">
            <h2>Email notifications</h2>
            <label className="email-preference-toggle">
              <input checked={announcementsEnabled} disabled={savingEmailPreference} onChange={changeAnnouncementPreference} type="checkbox" />
              Email me published announcements for audiences I’m allowed to view.
            </label>
            <p className="records-form-hint">Account and password-reset emails are separate. You can turn announcement emails off at any time.</p>
          </section>
          <form className="records-form" onSubmit={saveProfile}>
            <h2><UserRound size={18} /> Profile details</h2>
            <div className="records-form-grid">
              <label>Full name<input autoComplete="name" maxLength="150" onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} required value={profile.fullName} /></label>
              <label>Email address<input autoComplete="email" maxLength="255" onChange={(event) => setProfile({ ...profile, email: event.target.value })} required type="email" value={profile.email} /></label>
              <label>Username<input disabled value={user.username || ''} /></label>
              <label>Role<input disabled value={user.roleName || user.role} /></label>
              {profile.email.trim().toLowerCase() !== (user.email || '').toLowerCase() && (
                <label className="records-wide-field">Current password (required to change email)
                  <input autoComplete="current-password" onChange={(event) => setProfileCurrentPassword(event.target.value)} required type="password" value={profileCurrentPassword} />
                </label>
              )}
            </div>
            <button className="records-primary" disabled={savingProfile} type="submit"><Save size={15} />{savingProfile ? 'Saving…' : 'Save profile'}</button>
          </form>

          <form className="records-form" onSubmit={changePassword}>
            <h2><KeyRound size={18} /> Change password</h2>
            <div className="records-form-grid">
              <label className="records-wide-field">Current password<input autoComplete="current-password" onChange={(event) => setPasswordCurrentPassword(event.target.value)} required type="password" value={passwordCurrentPassword} /></label>
              <label>New password<input autoComplete="new-password" minLength="12" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
              <label>Confirm new password<input autoComplete="new-password" minLength="12" onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} /></label>
            </div>
            <button className="records-primary" disabled={savingPassword} type="submit"><KeyRound size={15} />{savingPassword ? 'Updating…' : 'Change password'}</button>
          </form>
        </div>
        <p className="records-note"><ShieldCheck size={14} /> Changing your password revokes all active sessions and requires you to sign in again.</p>
        <p className="records-note">Farmer registry details are maintained by authorized agriculture personnel; ask your barangay agriculture office to correct those records.</p>
      </section>
    </main>
  );
}
