import { useNavigate } from 'react-router-dom';
import { Store, Auth } from '../services/store';
import { SK } from '../services/storageKeys';
import Icon from './Icon';

export default function Topnav() {
  const navigate = useNavigate();
  const sess = Auth.session();
  const initials = sess ? sess.contact.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'V';
  const notifCount = (Store.get(SK.NOTIFS) || []).filter(n => n.unread).length;

  return (
    <div id="topnav">
      <div className="topnav-vm-label">Vendor Management System</div>
      <div className="topnav-spacer"></div>
      <div className="topnav-actions">
        <button className="icon-btn" onClick={() => navigate('/notifications')} title="Notifications">
          <Icon name="bell" />
          {notifCount > 0 ? <span className="notif-dot"></span> : null}
        </button>
        <div className="topnav-divider"></div>
        <button className="topnav-profile" onClick={() => navigate('/profile')}>
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <div className="profile-name">{sess ? sess.contact : 'Vendor'}</div>
            <div className="profile-role">Vendor</div>
          </div>
        </button>
      </div>
    </div>
  );
}
