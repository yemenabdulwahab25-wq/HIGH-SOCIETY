import React from 'react';
import { StoreSettings } from '../../types';
import { storage } from '../../services/storage';

interface AdminSettingsProps {
  settings: StoreSettings;
  onUpdate: (newSettings: StoreSettings) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onUpdate }) => {
  
  const updateSetting = (section: keyof StoreSettings, key: string, value: any) => {
    const newSettings = {
        ...settings,
        [section]: {
            ...settings[section as keyof StoreSettings],
            [key]: value
        }
    };
    storage.saveSettings(newSettings);
    onUpdate(newSettings);
  };
  
  const updateRootSetting = (key: keyof StoreSettings, value: any) => {
      const newSettings = {
          ...settings,
          [key]: value
      };
      storage.saveSettings(newSettings);
      onUpdate(newSettings);
  };

  const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
      <div className="flex items-center justify-between py-3 border-b border-gray-800">
          <span className="text-gray-300 font-medium">{label}</span>
          <button 
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-cannabis-500' : 'bg-gray-700'}`}
          >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
      </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold text-white">Store Settings</h1>
      
      {/* General Settings */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 text-cannabis-400">General</h2>
          <div>
              <label className="text-sm text-gray-400 mb-1 block">Store Name</label>
              <input 
                type="text" 
                value={settings.storeName}
                onChange={(e) => updateRootSetting('storeName', e.target.value)}
                className="w-full bg-dark-900 border border-gray-700 rounded-lg p-3 text-white"
                placeholder="e.g. Billionaire Level"
              />
          </div>
      </section>

      {/* Payment Settings */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 text-cannabis-400">Payments</h2>
          <Toggle 
            label="Online Payments" 
            checked={settings.payments.online} 
            onChange={(v) => updateSetting('payments', 'online', v)} 
          />
          <Toggle 
            label="Cash in Store" 
            checked={settings.payments.cashInStore} 
            onChange={(v) => updateSetting('payments', 'cashInStore', v)} 
          />
          <Toggle 
            label="Card in Store" 
            checked={settings.payments.cardInStore} 
            onChange={(v) => updateSetting('payments', 'cardInStore', v)} 
          />
          <Toggle 
            label="Crypto" 
            checked={settings.payments.crypto} 
            onChange={(v) => updateSetting('payments', 'crypto', v)} 
          />
      </section>

      {/* Visibility */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 text-cannabis-400">Visibility & Location</h2>
          <Toggle 
            label="Local Traffic Mode (SEO)" 
            checked={settings.visibility.localTraffic} 
            onChange={(v) => updateSetting('visibility', 'localTraffic', v)} 
          />
          <Toggle 
            label="Show Map on Storefront" 
            checked={settings.visibility.showMap} 
            onChange={(v) => updateSetting('visibility', 'showMap', v)} 
          />
          <Toggle 
            label="Enable Delivery" 
            checked={settings.delivery.enabled} 
            onChange={(v) => updateSetting('delivery', 'enabled', v)} 
          />
      </section>

      {/* Loyalty */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 text-cannabis-400">Loyalty Program</h2>
          <Toggle 
            label="Enable Loyalty Points" 
            checked={settings.loyalty.enabled} 
            onChange={(v) => updateSetting('loyalty', 'enabled', v)} 
          />
           <div className="flex items-center justify-between py-3">
              <span className="text-gray-300 font-medium">Points per $1</span>
              <input 
                type="number" 
                value={settings.loyalty.pointsPerDollar}
                onChange={(e) => updateSetting('loyalty', 'pointsPerDollar', Number(e.target.value))}
                className="w-20 bg-dark-900 border border-gray-700 rounded px-2 py-1 text-center text-white"
              />
          </div>
      </section>

      {/* Customer Messages */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 text-cannabis-400">Messages</h2>
          <Toggle 
            label="Send 'Picked Up' Message" 
            checked={settings.messages.enabled} 
            onChange={(v) => updateSetting('messages', 'enabled', v)} 
          />
          <div className="mt-4">
              <label className="text-sm text-gray-400 mb-1 block">Thank You Template</label>
              <textarea 
                value={settings.messages.template}
                onChange={(e) => updateSetting('messages', 'template', e.target.value)}
                className="w-full bg-dark-900 border border-gray-700 rounded-lg p-3 text-white h-20"
              />
          </div>
      </section>

    </div>
  );
};