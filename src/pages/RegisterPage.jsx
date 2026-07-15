import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth, Store } from '../services/store';
import { SK } from '../services/storageKeys';
import { fmt } from '../utils/helpers';
import { useModal } from '../context/ModalProvider';
import { useToast } from '../context/ToastProvider';
import GoodsManager from '../components/GoodsManager';
import logo from '../assets/brfid-logo.jpeg';

const STEPS = ['Company Info', 'Contact & Address', 'Goods', 'Bank & Compliance'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const modal = useModal();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const f = useRef({});

  function reg(name) {
    return { ref: (el) => { f.current[name] = el; } };
  }

  function submitRegistration() {
    const val = (name) => f.current[name]?.value || '';
    const email = val('reg-email').trim();
    const password = val('reg-pass');
    setSubmitting(true);

    setTimeout(() => {
      const result = Auth.register({
        email, password,
        company: {
          name: val('comp-name'),
          legalName: val('legal-name'),
          gst: val('gst'),
          pan: val('pan'),
          website: val('website'),
        },
        contact: {
          person: val('person'),
          designation: val('desig'),
          email,
          mobile: val('mobile'),
          office: val('office-ph'),
        },
        address: {
          country: val('country') || 'India',
          state: val('state'),
          city: val('city'),
          address: val('addr'),
          postal: val('postal'),
        },
        bank: {
          name: val('bank-name'),
          holder: val('acc-holder'),
          account: val('acc-no'),
          ifsc: val('ifsc'),
          branch: val('branch'),
        },
        compliance: { gstCert: true, pan: true, businessLicense: false, msme: false, iso: false },
      });

      if (!result.ok) {
        toast('Error', result.msg, 'danger');
        setSubmitting(false);
        return;
      }

      // Fold the goods added during registration into the real goods store, giving each a fresh
      // id so it can't collide with anything already there, then drop the draft.
      const draftGoods = Store.get(SK.REG_GOODS_DRAFT) || [];
      if (draftGoods.length) {
        const goods = Store.get(SK.GOODS) || [];
        const base = goods.length;
        draftGoods.forEach((g, i) => {
          goods.unshift({ ...g, id: 'GD-' + String(base + i + 1).padStart(3, '0') });
        });
        Store.set(SK.GOODS, goods);
      }
      localStorage.removeItem(SK.REG_GOODS_DRAFT);

      modal.show({
        title: 'Registration Submitted!',
        size: 'modal-sm',
        icon: 'success',
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
        body: (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 12 }}>
              Your vendor registration has been submitted successfully.
            </p>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your registration has been sent to the <strong>Central Warehouse Procurement Team</strong> for approval.<br />
              You will receive access once approved.
            </p>
          </div>
        ),
        footer: <button className="btn btn-primary btn-block" onClick={() => navigate('/login')}>Back to Login</button>,
      });
    }, 1200);
  }

  return (
    <div className="register-page">
      <div className="register-container">

        <div className="register-header">
          <div className="register-header-logo">
            <div className="reg-logo-icon">
              <img src={logo} alt="BRFID" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, color: 'var(--text-dark)' }}>VMS Vendor Portal</h1>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Central Warehouse Procurement System</div>
            </div>
          </div>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>New Vendor Registration</h2>
          <p>Fill in the details below. Our procurement team will review and approve your registration.</p>
        </div>

        <div className="reg-steps">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const cls = n === step ? 'active' : n < step ? 'done' : '';
            return (
              <div key={label} style={{ display: 'contents' }}>
                <div className={`reg-step ${cls}`}>
                  <div className="reg-step-num">{n < step ? '✓' : n}</div>
                  <div className="reg-step-label">{label}</div>
                </div>
                {n < STEPS.length ? <div className="reg-step-sep"></div> : null}
              </div>
            );
          })}
        </div>

        <div className="reg-form-card">

          {step === 1 && (
            <div className="reg-step-content">
              <div className="reg-form-body">
                <div className="form-section">
                  <div className="form-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
                    Company Information
                  </div>
                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input className="form-control" type="text" {...reg('comp-name')} placeholder="e.g. Apex Industrial Supplies Pvt Ltd" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Legal Name</label>
                      <input className="form-control" type="text" {...reg('legal-name')} placeholder="Full legal registered name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">GST Number</label>
                      <input className="form-control" type="text" {...reg('gst')} placeholder="e.g. 27AABCA1234A1Z5" maxLength={15} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN Number</label>
                      <input className="form-control" type="text" {...reg('pan')} placeholder="e.g. AABCA1234A" maxLength={10} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Website</label>
                      <input className="form-control" type="url" {...reg('website')} placeholder="https://www.yourcompany.com" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="reg-footer">
                <a href="/login" className="btn btn-secondary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="15 18 9 12 15 6" /></svg>
                  Back to Login
                </a>
                <button className="btn btn-primary" onClick={() => setStep(2)}>
                  Next
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="reg-step-content">
              <div className="reg-form-body">
                <div className="form-section">
                  <div className="form-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Primary Contact
                  </div>
                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <label className="form-label">Contact Person</label>
                      <input className="form-control" type="text" {...reg('person')} placeholder="Full name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Designation</label>
                      <input className="form-control" type="text" {...reg('desig')} placeholder="e.g. Managing Director" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input className="form-control" type="email" {...reg('reg-email')} placeholder="contact@company.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input className="form-control" type="password" {...reg('reg-pass')} placeholder="Min. 6 characters" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile Number</label>
                      <input className="form-control" type="tel" {...reg('mobile')} placeholder="+91 98765 43210" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Office Phone</label>
                      <input className="form-control" type="tel" {...reg('office-ph')} placeholder="+91 22 1234 5678" />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    Registered Address
                  </div>
                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <select className="form-control" {...reg('country')} defaultValue="India">
                        <option>India</option><option>UAE</option><option>Singapore</option><option>USA</option><option>UK</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <select className="form-control" {...reg('state')} defaultValue="">
                        <option value="">Select State</option>
                        <option>Maharashtra</option><option>Delhi</option><option>Karnataka</option><option>Tamil Nadu</option>
                        <option>Gujarat</option><option>Uttar Pradesh</option><option>Rajasthan</option><option>Telangana</option>
                        <option>West Bengal</option><option>Haryana</option><option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input className="form-control" type="text" {...reg('city')} placeholder="e.g. Mumbai" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Postal Code</label>
                      <input className="form-control" type="text" {...reg('postal')} placeholder="6 digit PIN" maxLength={6} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Street Address</label>
                    <textarea className="form-control" {...reg('addr')} rows={2} placeholder="Plot No., Street, Area, Landmark…"></textarea>
                  </div>
                </div>
              </div>
              <div className="reg-footer">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="15 18 9 12 15 6" /></svg>
                  Previous
                </button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>
                  Next
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="reg-step-content">
              <div className="reg-form-body">
                <div className="form-section" style={{ marginBottom: 0 }}>
                  <div className="form-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                    Goods You Supply
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Add the goods you supply, along with available quantity and pricing. You can add, edit, or remove these anytime later from the My Goods tab.
                  </p>
                  <GoodsManager compact />
                </div>
              </div>
              <div className="reg-footer">
                <button className="btn btn-secondary" onClick={() => setStep(2)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="15 18 9 12 15 6" /></svg>
                  Previous
                </button>
                <button className="btn btn-primary" onClick={() => setStep(4)}>
                  Next
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="reg-step-content">
              <div className="reg-form-body">
                <div className="form-section">
                  <div className="form-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                    Bank Details
                  </div>
                  <div className="form-row form-row-2">
                    <div className="form-group">
                      <label className="form-label">Bank Name</label>
                      <select className="form-control" {...reg('bank-name')} defaultValue="">
                        <option value="">Select Bank</option>
                        <option>HDFC Bank</option><option>ICICI Bank</option><option>State Bank of India</option>
                        <option>Axis Bank</option><option>Kotak Mahindra Bank</option><option>Punjab National Bank</option>
                        <option>Bank of Baroda</option><option>Canara Bank</option><option>Union Bank of India</option><option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Account Holder Name</label>
                      <input className="form-control" type="text" {...reg('acc-holder')} placeholder="As per bank records" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Account Number</label>
                      <input className="form-control" type="text" {...reg('acc-no')} placeholder="Account number" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">IFSC Code</label>
                      <input className="form-control" type="text" {...reg('ifsc')} placeholder="e.g. HDFC0001234" maxLength={11} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Branch Name</label>
                      <input className="form-control" type="text" {...reg('branch')} placeholder="Branch city and name" />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="17 13 13 17 9 13" /><line x1="13" y1="17" x2="13" y2="7" /></svg>
                    Compliance Documents
                  </div>
                  <div className="form-row form-row-2">
                    {[
                      ['GST Certificate', '📋'],
                      ['PAN Card', '🪪'],
                      ['Business License', '📄'],
                      ['MSME Certificate', '📄'],
                      ['ISO Certificate', '🏅'],
                    ].map(([label, emoji]) => (
                      <div className="form-group" key={label}>
                        <label className="form-label">{label}</label>
                        <div className="file-upload" onClick={(e) => e.currentTarget.nextSibling.click()}>
                          <div className="file-upload-icon">{emoji}</div>
                          <div className="file-upload-text">Upload {label}</div>
                          <div className="file-upload-hint">PDF, JPG, PNG (Max 5MB)</div>
                        </div>
                        <input type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-section" style={{ marginBottom: 0 }}>
                  <div className="info-box" style={{ marginBottom: 20 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                    <span className="info-box-text">Your registration will be reviewed by the Central Warehouse Procurement Team. You will receive access after approval, typically within 1 to 3 business days.</span>
                  </div>
                  <label className="form-check">
                    <input type="checkbox" />
                    <span className="form-check-label">I declare that all information provided is true and accurate. I authorize the Central Warehouse team to verify the submitted documents and details.</span>
                  </label>
                </div>
              </div>
              <div className="reg-footer">
                <button className="btn btn-secondary" onClick={() => setStep(3)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="15 18 9 12 15 6" /></svg>
                  Previous
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <a href="/login" className="btn btn-ghost">Cancel</a>
                  <button className="btn btn-primary" disabled={submitting} onClick={submitRegistration}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="20 6 9 17 4 12" /></svg>
                    {submitting ? 'Submitting…' : 'Submit Registration'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
