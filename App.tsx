import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Storefront } from './pages/Storefront';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
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

const AppContent = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(storage.getSettings());

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('hs_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('hs_cart', JSON.stringify(cart));
  }, [cart]);

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
      {/* Customer Routes */}
      <Route path="/" element={<Layout cartCount={cart.reduce((a,b) => a + b.quantity, 0)}><Storefront settings={settings} /></Layout>} />
      <Route path="/product/:id" element={<Layout cartCount={cart.reduce((a,b) => a + b.quantity, 0)}><ProductDetails addToCart={addToCart} /></Layout>} />
      <Route path="/cart" element={<Layout cartCount={cart.reduce((a,b) => a + b.quantity, 0)}><Cart cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} settings={settings} /></Layout>} />
      
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