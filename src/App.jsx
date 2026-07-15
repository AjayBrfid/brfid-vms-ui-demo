import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastProvider';
import { ModalProvider } from './context/ModalProvider';
import Layout from './components/Layout';
import { Store } from './services/store';
import { Theme } from './utils/theme';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RfqsPage from './pages/RfqsPage';
import QuotationsPage from './pages/QuotationsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import CreateAsnPage from './pages/CreateAsnPage';
import DeliveriesPage from './pages/DeliveriesPage';
import ReturnsPage from './pages/ReturnsPage';
import InvoicesPage from './pages/InvoicesPage';
import PaymentsPage from './pages/PaymentsPage';
import GoodsPage from './pages/GoodsPage';
import CatalogPage from './pages/CatalogPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  useEffect(() => {
    Store.seed();
    Theme.init();
  }, []);

  return (
    <ToastProvider>
      <ModalProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/rfqs" element={<RfqsPage />} />
              <Route path="/quotations" element={<QuotationsPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/create-asn" element={<CreateAsnPage />} />
              <Route path="/deliveries" element={<DeliveriesPage />} />
              <Route path="/returns" element={<ReturnsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/goods" element={<GoodsPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </ToastProvider>
  );
}
