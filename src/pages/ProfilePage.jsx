import { useRef, useState } from 'react';
import { Auth, Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { Theme } from '../utils/theme';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';

export default function ProfilePage() {
  const modal = useModal();
  const toast = useToast();
  const [theme, setTheme] = useState(() => Theme.get());

  function toggleTheme() {
    setTheme(Theme.toggle());
  }

  function savePassword(oldEl, newEl) {
    const oldP = oldEl.current?.value;
    const newP = newEl.current?.value;
    const vendors = Store.get(SK.VENDORS) || [];
    const sess = Auth.session();
    const i = vendors.findIndex(x => x.id === sess?.id);
    if (i > -1 && vendors[i].password !== oldP) {
      toast('Error', 'Current password is incorrect.', 'danger');
      return;
    }
    if (i > -1) {
      vendors[i].password = newP;
      Store.set(SK.VENDORS, vendors);
    }
    modal.close();
    toast('Password Updated', 'Your password has been changed.', 'success');
  }

  function changePassword() {
    const oldEl = { current: null };
    const newEl = { current: null };

    modal.show({
      title: 'Change Password',
      size: 'modal-sm',
      icon: 'primary',
      body: (
        <>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-control" type="password" ref={el => { oldEl.current = el; }} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-control" type="password" ref={el => { newEl.current = el; }} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-control" type="password" />
          </div>
        </>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button className="btn btn-primary" onClick={() => savePassword(oldEl, newEl)}>Update Password</button>
        </>
      ),
    });
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-sep">›</span><span>Profile</span></div>
          <h1>Account Settings</h1>
          <p>Manage your account security and appearance preferences.</p>
        </div>
      </div>

      <div className="profile-settings-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Security</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="kpi-icon" style={{ '--kpi-color': 'var(--primary)', '--kpi-bg': 'var(--primary-light)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: 14 }}>Password</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Change your account password to keep your account secure.</div>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={changePassword}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Appearance</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="kpi-icon" style={{ '--kpi-color': 'var(--gray)', '--kpi-bg': 'var(--gray-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: 14 }}>Theme</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Switch between light and dark appearance.</div>
                </div>
              </div>
              <button
                className={`theme-switch${theme === 'dark' ? ' is-dark' : ''}`}
                id="theme-switch-btn"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
              >
                <span className="theme-switch-icon theme-icon-sun">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                </span>
                <span className="theme-switch-icon theme-icon-moon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                </span>
                <span className="theme-switch-thumb" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
