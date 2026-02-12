
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { storage } from './services/storage';
import { CartItem, Product, StoreSettings } from './types';

// Wrapper for Admin Routes to ensure auth
const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAuth = localStorage.getItem('hs_admin_auth') === 'true';
  if (!isAuth) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

// Wrapper for Customer Routes to ensure Access Code if enabled
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

  // Activate Holiday Themes
  useHolidayTheme(settings);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('hs_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('hs_cart', JSON.stringify(cart));
  }, [cart]);

  // Poll for settings updates (e.g. if Admin changes Access Code in another tab)
  useEffect(() => {
    const interval = setInterval(() => {
        const latest = storage.getSettings();
        setSettings(prev => {
            // Only update if changed to avoid unnecessary re-renders
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

  return (
    <Routes>
      {/* Access Gate */}
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
      <Route path="/admin/settings" element={<AdminRoute><Layout isAdmin><AdminSettings settings={settings} onUpdate={setSettings} /></Layout></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
