import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bell, CalendarDays, Check, Megaphone, MessageCircle, Plus, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Brand from '../components/Brand.jsx';

const localInputTime = () => {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return date.toISOString().slice(0, 16);
};

export default function OperationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', barangayId: '' });
  const [eventForm, setEventForm] = useState({ title: '', description: '', eventType: 'meeting', startsAt: localInputTime(), endsAt: '', barangayId: '' });
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [calendarFeedUrl, setCalendarFeedUrl] = useState('');
  const [savingFeed, setSavingFeed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canManage = ['cao_admin', 'cao_staff', 'barangay_personnel'].includes(user.role);
  const canSelectBarangay = ['cao_admin', 'cao_staff'].includes(user.role);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [notificationResponse, announcementResponse, messageResponse, eventResponse] = await Promise.all([
        api.get('/api/notifications'), api.get('/api/announcements'),
        api.get('/api/messages'), api.get('/api/calendar'),
      ]);
      setNotifications(notificationResponse.data.data);
      setAnnouncements(announcementResponse.data.data);
      setMessages(messageResponse.data.data);
      setEvents(eventResponse.data.data);
      if (canManage) {
        const response = await api.get('/api/barangays');
        setBarangays(response.data.data);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => { loadData(); }, [loadData]);

  async function sendMessage(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/messages', { body: messageBody.trim(), conversationKey: 'general' });
      setMessageBody('');
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function createAnnouncement(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/announcements', {
        ...announcementForm,
        barangayId: announcementForm.barangayId ? Number(announcementForm.barangayId) : null,
        status: 'published',
      });
      toast.success('Announcement published.');
      setAnnouncementForm({ title: '', content: '', barangayId: '' });
      setShowAnnouncement(false);
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function createEvent(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/calendar', {
        ...eventForm,
        barangayId: eventForm.barangayId ? Number(eventForm.barangayId) : null,
        endsAt: eventForm.endsAt || null,
      });
      toast.success('Calendar event created.');
      setEventForm({ title: '', description: '', eventType: 'meeting', startsAt: localInputTime(), endsAt: '', barangayId: '' });
      setShowEvent(false);
      await loadData();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function markRead(id) {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item));
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    }
  }

  async function createCalendarFeed() {
    setSavingFeed(true);
    try {
      const response = await api.post('/api/calendar/feed-token');
      const apiOrigin = new URL(api.defaults.baseURL || '/', window.location.href).origin;
      setCalendarFeedUrl(new URL(`/api/calendar/feed/${response.data.data.token}.ics`, apiOrigin).href);
      toast.success('Calendar feed link created. Copy it now; it is only shown once.');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSavingFeed(false);
    }
  }

  async function revokeCalendarFeed() {
    setSavingFeed(true);
    try {
      await api.delete('/api/calendar/feed-token');
      setCalendarFeedUrl('');
      toast.success('Calendar feed access revoked.');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setSavingFeed(false);
    }
  }

  async function copyCalendarFeed() {
    try {
      await navigator.clipboard.writeText(calendarFeedUrl);
      toast.success('Calendar feed link copied.');
    } catch {
      toast.error('Clipboard access is unavailable. Select and copy the link manually.');
    }
  }

  return (
    <main className="records-page">
      <header className="records-topbar"><Brand /><Link to={user.role === 'farmer' ? '/farmer/dashboard' : '/dashboard'} className="records-back"><ArrowLeft size={16} /> Dashboard</Link></header>
      <section className="records-content">
        <div className="records-heading"><div><span className="panel-kicker">WORKSPACE</span><h1>Calendar &amp; communications</h1><p>In-app updates, authorized announcements, events, and the general conversation.</p></div>
          <div className="livestock-heading-actions">
            {canManage && <button className="records-primary secondary" onClick={() => setShowEvent((open) => !open)} type="button">{showEvent ? <X size={15} /> : <Plus size={15} />} Event</button>}
            {canManage && <button className="records-primary" onClick={() => setShowAnnouncement((open) => !open)} type="button">{showAnnouncement ? <X size={15} /> : <Plus size={15} />} Announcement</button>}
          </div></div>
        {error && <div className="records-error" role="alert">{error}<button onClick={loadData} type="button">Retry</button></div>}

        {showAnnouncement && <form className="records-form" onSubmit={createAnnouncement}>
          <h2>Publish an announcement</h2>
          <div className="records-form-grid">
            <label>Title<input maxLength="200" onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })} required value={announcementForm.title} /></label>
            {canSelectBarangay && <label>Audience<select onChange={(event) => setAnnouncementForm({ ...announcementForm, barangayId: event.target.value })} value={announcementForm.barangayId}><option value="">All barangays</option>{barangays.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
            <label className="records-wide-field">Message<textarea maxLength="50000" onChange={(event) => setAnnouncementForm({ ...announcementForm, content: event.target.value })} required rows="4" value={announcementForm.content} /></label>
          </div>
          <button className="records-primary" disabled={saving} type="submit">{saving ? 'Publishing…' : 'Publish announcement'}</button>
        </form>}

        {showEvent && <form className="records-form" onSubmit={createEvent}>
          <h2>Add a calendar event</h2>
          <div className="records-form-grid">
            <label>Title<input maxLength="200" onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} required value={eventForm.title} /></label>
            <label>Event type<input maxLength="80" onChange={(event) => setEventForm({ ...eventForm, eventType: event.target.value })} required value={eventForm.eventType} /></label>
            {canSelectBarangay && <label>Audience<select onChange={(event) => setEventForm({ ...eventForm, barangayId: event.target.value })} value={eventForm.barangayId}><option value="">All barangays</option>{barangays.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
            <label>Starts<input onChange={(event) => setEventForm({ ...eventForm, startsAt: event.target.value })} required type="datetime-local" value={eventForm.startsAt} /></label>
            <label>Ends<input min={eventForm.startsAt} onChange={(event) => setEventForm({ ...eventForm, endsAt: event.target.value })} type="datetime-local" value={eventForm.endsAt} /></label>
            <label className="records-wide-field">Description<input maxLength="10000" onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })} value={eventForm.description} /></label>
          </div>
          <button className="records-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save event'}</button>
        </form>}

        <section className="records-form calendar-feed-card">
          <div><h2>Subscribe in Google Calendar</h2><p className="records-form-hint">Create a private iCal link for the calendar events visible to your account. Anyone with the link can view those events.</p></div>
          <div className="calendar-feed-actions">
            <button className="records-primary secondary" disabled={savingFeed} onClick={createCalendarFeed} type="button">{savingFeed ? 'Working…' : 'Create or rotate feed link'}</button>
            <button className="records-text-button" disabled={savingFeed} onClick={revokeCalendarFeed} type="button">Revoke feed</button>
          </div>
          {calendarFeedUrl && <div className="calendar-feed-link">
            <input aria-label="Private calendar feed URL" readOnly value={calendarFeedUrl} />
            <button className="records-primary" onClick={copyCalendarFeed} type="button">Copy link</button>
          </div>}
        </section>

        <div className="operations-grid">
          <section className="dashboard-panel operations-panel">
            <div className="panel-title-row"><div><span className="panel-kicker">PERSONAL</span><h2><Bell size={16} /> Notifications</h2></div><span className="activity-count">{notifications.filter((item) => !item.read_at).length}</span></div>
            <ul className="operations-list">{loading ? <li>Loading notifications…</li> : notifications.length === 0 ? <li>No notifications.</li> : notifications.map((item) => <li className={item.read_at ? '' : 'unread'} key={item.id}>
              <div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.created_at.replace(' ', 'T')).toLocaleString()}</small></div>
              {!item.read_at && <button aria-label="Mark notification read" onClick={() => markRead(item.id)} type="button"><Check size={15} /></button>}
            </li>)}</ul>
          </section>
          <section className="dashboard-panel operations-panel">
            <div className="panel-title-row"><div><span className="panel-kicker">OFFICE UPDATES</span><h2><Megaphone size={16} /> Announcements</h2></div><span className="activity-count">{announcements.length}</span></div>
            <ul className="operations-list">{loading ? <li>Loading announcements…</li> : announcements.length === 0 ? <li>No published announcements.</li> : announcements.map((item) => <li key={item.id}>
              <div><strong>{item.title}</strong><p>{item.content}</p><small>{item.barangay_name || 'All audiences'} · {item.author_name || 'Office'} · {item.published_at}</small></div>
            </li>)}</ul>
          </section>
          <section className="dashboard-panel operations-panel">
            <div className="panel-title-row"><div><span className="panel-kicker">SCHEDULE</span><h2><CalendarDays size={16} /> Calendar</h2></div><span className="activity-count">{events.length}</span></div>
            <ul className="operations-list">{loading ? <li>Loading calendar…</li> : events.length === 0 ? <li>No calendar events.</li> : events.map((item) => <li key={item.id}>
              <div><strong>{item.title}</strong><p>{item.description || item.event_type}</p><small>{new Date(item.starts_at.replace(' ', 'T')).toLocaleString()} · {item.barangay_name || 'All audiences'}</small></div>
            </li>)}</ul>
          </section>
          <section className="dashboard-panel operations-panel">
            <div className="panel-title-row"><div><span className="panel-kicker">GENERAL CHANNEL</span><h2><MessageCircle size={16} /> Messages</h2></div><span className="activity-count">{messages.length}</span></div>
            <ul className="operations-list messages-list">{loading ? <li>Loading messages…</li> : messages.length === 0 ? <li>No messages in this channel.</li> : messages.map((item) => <li key={item.id}>
              <div><strong>{item.sender_name || 'User'} <small>{item.sender_role}</small></strong><p>{item.body}</p><small>{item.barangay_name || 'City-wide'} · {new Date(item.created_at.replace(' ', 'T')).toLocaleString()}</small></div>
            </li>)}</ul>
            <form className="message-compose" onSubmit={sendMessage}><input maxLength="10000" onChange={(event) => setMessageBody(event.target.value)} placeholder="Write a message for your authorized channel…" required value={messageBody} /><button aria-label="Send message" disabled={saving || !messageBody.trim()} type="submit"><Send size={16} /></button></form>
          </section>
        </div>
        <p className="records-note"><Bell size={14} /> Notifications are private to your account. Announcements, messages, and calendar events are filtered by the backend to your authorized audience.</p>
      </section>
    </main>
  );
}
