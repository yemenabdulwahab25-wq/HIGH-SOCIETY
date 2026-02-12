
import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Menu, Users, Megaphone } from 'lucide-react';
import { CustomerServiceChat } from './CustomerServiceChat';
import { StoreSettings } from '../types';
import { Logo } from './Logo';

interface LayoutProps {
  children?: React.ReactNode;
  isAdmin?: boolean;
  cartCount?: number;
  settings?: StoreSettings;
}

export const Layout = ({ children, isAdmin, cartCount = 0, settings }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check for active Special Event
  const today = new Date().toISOString().split('T')[0];
  const activeEvent = !isAdmin && settings?.specialEvents?.find(e => 
    e.enabled && e.startDate <= today && e.endDate >= today
  );

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100 flex flex-col font-sans">
      
      {/* Special Event Banner */}
      {activeEvent && (
        <div style={{ backgroundColor: activeEvent.backgroundColor, color: activeEvent.textColor }} className="w-full py-2 px-4 text-center relative z-[60] shadow-xl animate-in fade-in slide-in-from-top-5">
           <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
              <Megaphone className="w-4 h-4 animate-bounce" />
              <span className="font-bold uppercase tracking-widest text-xs md:text-sm opacity-80">{activeEvent.title}:</span>
              <span className="font-bold text-sm md:text-base">{activeEvent.message}</span>
           </div>
        </div>
      )}

      {!isAdmin && (
        <header className="sticky top-0 z-50 bg-dark-950/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
               <Logo className="w-10 h-10 drop-shadow-lg" />
               <span className="font-bold text-lg tracking-tight text-white hidden sm:block">BILLIONAIRE LEVEL</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link to="/cart" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
                <ShoppingBag className="w-6 h-6 text-gray-300" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-cannabis-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link to="/account" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <User className="w-6 h-6 text-gray-300" />
              </Link>
            </div>
          </div>
        </header>
      )}

      {isAdmin && (
        <header className="sticky top-0 z-50 bg-dark-900 border-b border-gray-800">
           <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Logo className="w-8 h-8" />
               <span className="text-cannabis-500 font-bold text-xl">ADMIN</span>
               <span className="text-gray-500 text-sm hidden md:inline">| Rambo Mode</span>
             </div>
             <nav className="hidden md:flex items-center gap-6">
               <Link to="/admin/dashboard" className={`text-sm font-medium ${location.pathname.includes('dashboard') ? 'text-cannabis-500' : 'text-gray-400'}`}>Dashboard</Link>
               <Link to="/admin/customers" className={`text-sm font-medium ${location.pathname.includes('customers') ? 'text-cannabis-500' : 'text-gray-400'}`}>Clients</Link>
               <Link to="/admin/inventory" className={`text-sm font-medium ${location.pathname.includes('inventory') ? 'text-cannabis-500' : 'text-gray-400'}`}>Add Product</Link>
               <Link to="/admin/settings" className={`text-sm font-medium ${location.pathname.includes('settings') ? 'text-cannabis-500' : 'text-gray-400'}`}>Settings</Link>
             </nav>
             <button onClick={() => { localStorage.removeItem('hs_admin_auth'); navigate('/admin'); }} className="text-gray-400 hover:text-white">
                <LogOut className="w-5 h-5" />
             </button>
           </div>
        </header>
      )}

      <main className={`flex-1 ${isAdmin ? 'bg-dark-900' : 'bg-dark-950'}`}>
        <div className={`mx-auto ${isAdmin ? 'max-w-7xl p-6' : 'max-w-4xl p-4'}`}>
          {children}
        </div>
      </main>

      {/* Inject Chat Widget for Customers ONLY */}
      {!isAdmin && <CustomerServiceChat />}

      {/* Mobile Admin Nav */}
      {isAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-gray-700 flex justify-around p-3 z-50 safe-area-bottom">
           <Link to="/admin/dashboard" className="flex flex-col items-center gap-1">
             <div className={`w-1 h-1 rounded-full ${location.pathname.includes('dashboard') ? 'bg-cannabis-500' : 'bg-transparent'}`} />
             <span className={`text-xs ${location.pathname.includes('dashboard') ? 'text-white' : 'text-gray-500'}`}>Orders</span>
           </Link>
           <Link to="/admin/customers" className="flex flex-col items-center gap-1">
             <div className={`w-1 h-1 rounded-full ${location.pathname.includes('customers') ? 'bg-cannabis-500' : 'bg-transparent'}`} />
             <span className={`text-xs ${location.pathname.includes('customers') ? 'text-white' : 'text-gray-500'}`}>Clients</span>
           </Link>
           <Link to="/admin/inventory" className="flex flex-col items-center gap-1">
             <div className={`w-1 h-1 rounded-full ${location.pathname.includes('inventory') ? 'bg-cannabis-500' : 'bg-transparent'}`} />
             <span className={`text-xs ${location.pathname.includes('inventory') ? 'text-white' : 'text-gray-500'}`}>Add</span>
           </Link>
           <Link to="/admin/settings" className="flex flex-col items-center gap-1">
             <div className={`w-1 h-1 rounded-full ${location.pathname.includes('settings') ? 'bg-cannabis-500' : 'bg-transparent'}`} />
             <span className={`text-xs ${location.pathname.includes('settings') ? 'text-white' : 'text-gray-500'}`}>Settings</span>
           </Link>
        </div>
      )}
    </div>
  );
};
