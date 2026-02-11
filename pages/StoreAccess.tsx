import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { StoreSettings } from '../types';

interface StoreAccessProps {
  settings: StoreSettings;
}

export const StoreAccess: React.FC<StoreAccessProps> = ({ settings }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === settings.access.code) {
      localStorage.setItem('hs_customer_entered_code', code);
      navigate('/', { replace: true });
    } else {
      setError(true);
      setCode('');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cannabis-900/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-sm bg-dark-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-dark-800 to-dark-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner relative group">
            <Lock className="w-8 h-8 text-cannabis-500 relative z-10" />
            <div className="absolute inset-0 bg-cannabis-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">{settings.storeName}</h1>
        <div className="flex items-center justify-center gap-2 mb-8">
            <ShieldCheck className="w-4 h-4 text-gold-400" />
            <p className="text-gold-400 text-sm font-medium tracking-wide">VIP ACCESS ONLY</p>
        </div>
        
        <form onSubmit={handleEnter} className="space-y-4">
          <div className="relative">
            <input 
                type="password" 
                inputMode="numeric"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(false); }}
                placeholder="Enter Access Code"
                className="w-full bg-dark-800 border border-gray-700 rounded-xl px-4 py-4 text-center text-xl tracking-widest text-white focus:border-cannabis-500 focus:ring-1 focus:ring-cannabis-500 outline-none transition-all placeholder:text-gray-600 placeholder:tracking-normal placeholder:text-sm"
                autoFocus
            />
          </div>
          
          {error && <div className="text-red-500 text-center text-sm font-medium animate-pulse">Incorrect code. Please try again.</div>}
          
          <button 
            type="submit"
            className="w-full bg-white hover:bg-gray-200 text-dark-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            Unlock Store
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-xs leading-relaxed">
            Please enter the PIN provided via your direct link or QR code invitation.
        </p>
      </div>
      
      <div className="mt-8 text-gray-600 text-xs z-10">
        &copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.
      </div>
    </div>
  );
};