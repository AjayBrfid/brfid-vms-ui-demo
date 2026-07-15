import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth, Store } from '../services/store';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';
import logo from '../assets/brfid-logo.jpeg';
import '../styles/login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const modal = useModal();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Store.seed();
    if (Auth.session()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    // This portal is a UI-flow demo, not a real auth backend — credentials aren't checked,
    // so the short delay below is purely cosmetic to mirror the original sign-in experience.
    setTimeout(() => {
      const result = Auth.login(email, password);
      setSubmitting(false);
      if (result.ok) {
        navigate('/dashboard');
      } else {
        setError(result.msg);
      }
    }, 800);
  }

  function openForgotPassword() {
    modal.show({
      title: 'Reset Password',
      size: 'modal-sm',
      body: (
        <>
          <p style={{ color: 'var(--text-body)', fontSize: 13.5, marginBottom: 16 }}>
            Enter your registered email address. We will send password reset instructions.
          </p>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" placeholder="your@email.com" />
          </div>
        </>
      ),
      footer: (
        <>
          <button className="btn btn-secondary" onClick={modal.close}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { modal.close(); toast('Email Sent', 'Password reset link sent to your email.', 'success'); }}>Send Reset Link</button>
        </>
      ),
    });
  }

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <span></span><span></span><span></span>
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <img src={logo} alt="BRFID" />
          </div>
          <h1>Vendor Management System</h1>
          <p>Vendor Portal</p>
        </div>

        <div className={`alert alert-danger${error ? ' show' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              className="form-control" type="email" id="email" name="email"
              placeholder="your@email.com" autoComplete="email"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="pw-toggle">
              <input
                className="form-control" type={showPassword ? 'text' : 'password'} id="password" name="password"
                placeholder="Enter your password" autoComplete="current-password"
                value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              />
              <button type="button" className="pw-eye" onClick={() => setShowPassword(s => !s)} title="Show/hide password">
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <a className="login-forgot" onClick={openForgotPassword} style={{ cursor: 'pointer' }}>Forgot Password?</a>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-check">
              <input type="checkbox" />
              <span className="form-check-label">Remember me on this device</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ animation: 'spin 1s linear infinite' }}>
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            )}
            {' '}{submitting ? 'Signing in…' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="login-divider">or</div>

        <div className="login-footer">
          Don't have an account?&nbsp;
          <a href="/register">Register as Vendor</a>
        </div>
      </div>
    </div>
  );
}
