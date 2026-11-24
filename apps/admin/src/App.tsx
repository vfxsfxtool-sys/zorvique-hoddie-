import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminDataProvider } from './context/AdminDataContext';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { ProductsPage } from './pages/ProductsPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { CustomersPage } from './pages/CustomersPage';
import { HeroHomepagePage } from './pages/HeroHomepagePage';
import { NavigationPage } from './pages/NavigationPage';
import { PagesAdminPage } from './pages/PagesAdminPage';
import { OrdersPage } from './pages/OrdersPage';
import { DiscountsPage } from './pages/DiscountsPage';
import { MediaLibraryPage } from './pages/MediaLibraryPage';
import { SubscribersPage } from './pages/SubscribersPage';
import { SettingsPage } from './pages/SettingsPage';

function AdminGate() {
  const { loading, isAuthorized } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#E4E2E1] flex items-center justify-center">
        <div className="text-sm text-[#E0C0AF]">Verifying administrator session...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <LoginPage />;
  }

  return (
    <AdminDataProvider>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/hero-homepage" element={<HeroHomepagePage />} />
          <Route path="/navigation" element={<NavigationPage />} />
          <Route path="/pages" element={<PagesAdminPage />} />
          <Route path="/discounts" element={<DiscountsPage />} />
          <Route path="/media" element={<MediaLibraryPage />} />
          <Route path="/subscribers" element={<SubscribersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AdminDataProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin">
        <AdminGate />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
