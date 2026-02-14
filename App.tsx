
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { Layout } from './components/Layout';
import { Storefront } from './pages/Storefront';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Account } from './pages/Account';
import { StoreAccess } from './pages/StoreAccess';
import { Guide } from './pages/Guide';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminMarketing } from './pages/admin/AdminMarketing';
import { FirebaseLogin } from './pages/FirebaseLogin';
import { storage } from './services/storage';
import { CartItem, Product, StoreSettings } from './types';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

// Wrapper for Admin Routes to ensure auth (Internal Pin)
const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAuth = localStorage.getItem('hs_admin_auth') === 'true';
  if (!isAuth) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

// Wrapper for Customer Routes to ensure Access Code if enabled (Internal Code)
const CustomerRoute = ({ children, settings }: { children?: React.ReactNode, settings: StoreSettings }) => {
  if (settings.access?.enabled) {
     const enteredCode = localStorage.getItem('hs_customer_entered_code');
     // If the code has changed or user hasn't entered it, redirect
     if (enteredCode !== settings.access.code) {
       return <Navigate to="/access" replace />;
     }
  }
  return <>{children}</>;
};

// Theme Controller Hook
const useHolidayTheme = (settings: StoreSettings) => {
  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 0-indexed
    const currentDay = today.getDate();

    const activeHoliday = settings.holidays?.find(
        h => h.enabled && h.month === currentMonth && h.day === currentDay
    );

    const root = document.documentElement;

    if (activeHoliday) {
        root.style.setProperty('--theme-primary', activeHoliday.colors.primary);
        root.style.setProperty('--theme-primary-hover', activeHoliday.colors.primary); // Simplify for now
        root.style.setProperty('--theme-accent', activeHoliday.colors.accent);
        root.style.setProperty('--theme-accent-hover', activeHoliday.colors.accent);
        console.log(`🎉 Holiday Theme Activated: ${activeHoliday.name}`);
    } else {
        // Reset to Defaults
        root.style.setProperty('--theme-primary', '#10b981');
        root.style.setProperty('--theme-primary-hover', '#059669');
        root.style.setProperty('--theme-accent', '#fbbf24');
        root.style.setProperty('--theme-accent-hover', '#f59e0b');
    }

  }, [settings.holidays]);
};

const AppContent = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(storage.getSettings());
  
  // Firebase Auth State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Developer Setup Alert
  const [firestoreError, setFirestoreError] = useState(false);

  // Activate Holiday Themes
  useHolidayTheme(settings);

  // Initialize Real-time Listeners & Auth
  useEffect(() => {
    // 1. Load Local Cart
    const savedCart = localStorage.getItem('hs_cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    // 2. Connect to Firebase for Live Updates
    storage.initRealtimeListeners();

    // 3. Listen for Auth Changes
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    // 4. Listen for Firestore Setup Errors
    const handleFirestoreError = () => setFirestoreError(true);
    window.addEventListener('hs_firestore_error', handleFirestoreError);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('hs_firestore_error', handleFirestoreError);
    };
  }, []);

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('hs_cart', JSON.stringify(cart));
  }, [cart]);

  // Poll for settings updates
  useEffect(() => {
    const interval = setInterval(() => {
        const latest = storage.getSettings();
        setSettings(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(latest)) {
                return latest;
            }
            return prev;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (product: Product, weightIdx: number, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedWeight.label === product.weights[weightIdx].label);
      if (existing) {
        return prev.map(item => 
          item.id === product.id && item.selectedWeight.label === product.weights[weightIdx].label
          ? { ...item, quantity: item.quantity + quantity }
          : item
        );
      }
      return [...prev, { ...product, selectedWeight: product.weights[weightIdx], quantity }];
    });
  };

  const removeFromCart = (id: string, weightLabel: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedWeight.label === weightLabel)));
  };

  const clearCart = () => setCart([]);

  // AUTH LOADING SCREEN
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cannabis-500 animate-spin" />
      </div>
    );
  }

  // AUTH GUARD: Show Login if not authenticated
  if (!user) {
    return <FirebaseLogin />;
  }

  // MAIN APP
  return (
    <>
      <Routes>
        {/* Access Gate (Internal Layer) */}
        <Route path="/access" element={<StoreAccess settings={settings} />} />

        {/* Public Guide */}
        <Route path="/guide" element={<Guide />} />

        {/* Customer Routes (Protected if enabled) */}
        <Route path="/" element={
          <CustomerRoute settings={settings}>
            <Layout cartCount={cart.reduce((a,b) => a + b.quantity, 0)} settings={settings}>
              <Storefront settings={settings} />
            </Layout>
          </CustomerRoute>
        } />
        <Route path="/product/:id" element={
          <CustomerRoute settings={settings}>
            <Layout cartCount={cart.reduce((a,b) => a + b.quantity, 0)} settings={settings}>
              <ProductDetails addToCart={addToCart} />
            </Layout>
          </CustomerRoute>
        } />
        <Route path="/cart" element={
          <CustomerRoute settings={settings}>
            <Layout cartCount={cart.reduce((a,b) => a + b.quantity, 0)} settings={settings}>
              <Cart cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} settings={settings} />
            </Layout>
          </CustomerRoute>
        } />
        <Route path="/account" element={
          <CustomerRoute settings={settings}>
            <Layout cartCount={cart.reduce((a,b) => a + b.quantity, 0)} settings={settings}>
              <Account addToCart={addToCart} />
            </Layout>
          </CustomerRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminRoute><Layout isAdmin><AdminDashboard /></Layout></AdminRoute>} />
        <Route path="/admin/customers" element={<AdminRoute><Layout isAdmin><AdminCustomers /></Layout></AdminRoute>} />
        <Route path="/admin/inventory" element={<AdminRoute><Layout isAdmin><AdminInventory /></Layout></AdminRoute>} />
        <Route path="/admin/marketing" element={<AdminRoute><Layout isAdmin><AdminMarketing /></Layout></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Layout isAdmin><AdminSettings settings={settings} onUpdate={setSettings} /></Layout></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Developer Config Alert */}
      {firestoreError && (
          <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 z-[100] shadow-2xl animate-in slide-in-from-bottom">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 flex-shrink-0 animate-bounce" />
                      <div>
                          <h3 className="font-bold text-lg">⚠️ Action Required: Create Firestore Database</h3>
                          <p className="text-sm text-red-100">
                              Your app is connecting to Firebase but the <strong>Database</strong> has not been created yet.
                          </p>
                      </div>
                  </div>
                  <a 
                      href="https://console.firebase.google.com/project/_/firestore" 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors whitespace-nowrap"
                  >
                      Open Firebase Console <ExternalLink className="w-4 h-4" />
                  </a>
              </div>
          </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
