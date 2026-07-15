import { NavLink, useNavigate } from 'react-router-dom';
import { navItems } from '../utils/navItems';
import { Store, Auth } from '../services/store';
import { SK } from '../services/storageKeys';
import Icon from './Icon';
import logo from '../assets/brfid-logo.jpeg';

export default function Sidebar() {
  const navigate = useNavigate();
  const notifs = (Store.get(SK.NOTIFS) || []).filter(n => n.unread).length;
  const openRfqs = (Store.get(SK.RFQS) || []).filter(r => r.status === 'Open' || r.status === 'Closing Soon').length;

  let lastSection = '';

  function handleLogout() {
    Auth.logout();
    navigate('/login');
  }

  return (
    <div id="sidebar">
      <div className="sb-header">
        <div className="sb-logo">
          <img src={logo} alt="BRFID" />
        </div>
        <div className="sb-brand">
          <div className="sb-brand-name">VMS Portal</div>
        </div>
      </div>
      <nav className="sb-nav">
        {navItems.map(item => {
          const showSection = item.section && item.section !== lastSection;
          if (showSection) lastSection = item.section;
          const badgeCount = item.badge === 'notif' ? notifs : item.badge === 'rfq' ? openRfqs : 0;
          return (
            <div key={item.href}>
              {showSection ? <div className="sb-section-label">{item.section}</div> : null}
              <NavLink to={item.href} className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}>
                <span className="sb-item-icon"><Icon name={item.icon} /></span>
                <span className="sb-item-label">{item.label}</span>
                {badgeCount > 0 ? <span className="sb-badge">{badgeCount}</span> : null}
              </NavLink>
            </div>
          );
        })}
      </nav>
      <div className="sb-footer">
        <button className="sb-logout-btn" onClick={handleLogout}>
          <Icon name="logout" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
