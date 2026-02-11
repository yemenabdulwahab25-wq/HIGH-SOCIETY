import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect
    if (localStorage.getItem('hs_admin_auth') === 'true') {
        navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded PIN for demo: 4200
    if (pin === '4200') {
      localStorage.setItem('hs_admin_auth', 'true');
      navigate('/admin/dashboard');
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-dark-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center border border-gray-700">
            <Lock className="w-6 h-6 text-cannabis-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">Restricted Access</h1>
        <p className="text-gray-500 text-center mb-8">Enter Rambo PIN to continue.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="password" 
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="Enter PIN"
            className="w-full bg-dark-950 border border-gray-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest text-white focus:border-cannabis-500 focus:ring-1 focus:ring-cannabis-500 outline-none transition-all"
            maxLength={4}
            autoFocus
          />
          {error && <p className="text-red-500 text-center text-sm">Incorrect PIN. Try again.</p>}
          <button 
            type="submit"
            className="w-full bg-cannabis-600 hover:bg-cannabis-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Access Dashboard
          </button>
        </form>
        <div className="mt-6 text-center">
            <a href="#" onClick={() => navigate('/')} className="text-sm text-gray-600 hover:text-gray-400">Back to Store</a>
        </div>
      </div>
    </div>
  );
};