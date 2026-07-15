import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Auth } from '../services/store';
import Sidebar from './Sidebar';
import Topnav from './Topnav';

// Client-side navigation doesn't reload the document, so the browser keeps whatever scroll
// position the previous page was at — without this, switching sidebar tabs while scrolled down
// on one page lands you scrolled down on the next page too, instead of at the top like a real
// page navigation would.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function Layout() {
  if (!Auth.session()) return <Navigate to="/login" replace />;

  return (
    <div id="app">
      <Sidebar />
      <div id="main-wrapper">
        <Topnav />
        <main id="content">
          <ScrollToTop />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
