import { useState } from 'react';
import { User, Database, Trash2, Shield, Bell, Palette } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../ToastContext';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [showClear, setShowClear] = useState(false);

  function handleClearData() {
    localStorage.removeItem('afterflow-storage');
    showToast('All data cleared. Refreshing…', 'success');
    setTimeout(() => window.location.reload(), 1200);
  }

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your AfterFlow preferences and data</p>
      </div>

      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Profile */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><User size={13} className="card-title-icon" />Profile</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--emerald), var(--mint))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#04140F',
              border: '2px solid rgba(0,217,149,0.3)',
            }}>
              S
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Shivam</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>AfterFlow User · CODE VARIANT BUILD 01</div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
            Profile customization coming in a future release.
          </div>
        </div>

        {/* Data */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Database size={13} className="card-title-icon" />Data & Storage</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>Local Storage</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>All data is stored in your browser's local storage.</div>
              </div>
              <span style={{ fontSize: 11, background: 'rgba(0,217,149,0.08)', color: 'var(--emerald)', padding: '3px 8px', borderRadius: 10, border: '1px solid rgba(0,217,149,0.15)', fontWeight: 500 }}>
                Active
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>Clear All Data</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Permanently delete all events, notes, actions, and connections.</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => setShowClear(true)} id="clear-data-btn" style={{ minHeight: 36 }}>
                <Trash2 size={12} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Palette size={13} className="card-title-icon" />Appearance</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            AfterFlow uses a dark emerald theme. Theme customization will be available in a future release.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {['#04140F', '#071D16', '#09251C', '#00D995'].map((c) => (
              <div key={c} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: '1px solid var(--border)' }} />
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Bell size={13} className="card-title-icon" />Notifications</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Browser notifications for overdue follow-ups and actions — coming soon.
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Shield size={13} className="card-title-icon" />About AfterFlow</span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <img
              src="/logo-mark.png"
              alt="AfterFlow Logo"
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.45))',
                flexShrink: 0,
              }}
            />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, flex: 1 }}>
              <p><strong style={{ color: 'var(--text-primary)' }}>AfterFlow</strong> is a post-event productivity tool built for the CODE VARIANT BUILD 01 Hackathon (PS 04 — After the Event).</p>
              <p style={{ marginTop: 8 }}>It helps you capture learnings, connect with people, take action on ideas, and measure your follow-through after every event.</p>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', gap: 14 }}>
            <span>v1.0.0</span>
            <span>React + TypeScript + Vite</span>
            <span>Tailwind CSS v4</span>
          </div>
        </div>
      </div>

      {showClear && (
        <ConfirmDialog
          title="Clear All Data"
          message="This will permanently delete ALL your events, notes, actions, and connections. This cannot be undone."
          confirmLabel="Clear Everything"
          onConfirm={handleClearData}
          onCancel={() => setShowClear(false)}
        />
      )}
    </AppLayout>
  );
}
