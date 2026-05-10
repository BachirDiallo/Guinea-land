import { useEffect } from 'react';
import './i18n';
import '@/App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthCallback } from './components/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PWAStatus } from './components/PWAStatus';
import { WhatsAppHelpButton } from './components/WhatsApp';
import { AIAssistant } from './components/AIAssistant';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import MapView from './pages/MapView';
import Listings from './pages/Listings';
import LandDetail from './pages/LandDetail';
import Dashboard from './pages/Dashboard';
import AddLand from './pages/AddLand';
import Transactions from './pages/Transactions';
import NewTransaction from './pages/NewTransaction';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Feedback from './pages/Feedback';
import MarketTrends from './pages/MarketTrends';
import LandComparison from './pages/LandComparison';
import SavedSearches from './pages/SavedSearches';
import ZoneAlertsPage from './pages/ZoneAlerts';

// Register Service Worker - only in production, not in preview
const registerServiceWorker = async () => {
  // Skip service worker in preview/development environments
  const isPreview = window.location.hostname.includes('preview') || 
                    window.location.hostname.includes('localhost') ||
                    window.location.hostname.includes('emergentagent');
  
  if (isPreview) {
    console.log('Service Worker disabled in preview environment');
    // Unregister any existing service workers in preview
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Unregistered service worker for preview');
      }
    }
    return;
  }
  
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('New version available!');
          }
        });
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

const AppRouter = () => {
  const location = useLocation();

  // Check URL fragment for session_id (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  // Pages without navbar/footer
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Navbar />}
      <PWAStatus />
      <main className={!isAuthPage ? 'min-h-[calc(100vh-64px)]' : ''}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/lands/:landId" element={<LandDetail />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/market-trends" element={<MarketTrends />} />
          <Route path="/compare" element={<LandComparison />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/lands/new" element={
            <ProtectedRoute>
              <AddLand />
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          } />
          <Route path="/transactions/new" element={
            <ProtectedRoute>
              <NewTransaction />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/saved-searches" element={
            <ProtectedRoute>
              <SavedSearches />
            </ProtectedRoute>
          } />
          <Route path="/zone-alerts" element={
            <ProtectedRoute>
              <ZoneAlertsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <AIAssistant />}
      {!isAuthPage && <WhatsAppHelpButton supportPhone="621000000" />}
    </>
  );
};

function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
      <div className="grain-overlay"></div>
    </div>
  );
}

export default App;
