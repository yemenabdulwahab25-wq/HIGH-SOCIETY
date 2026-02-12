
import React, { useState, useEffect } from 'react';
import { StoreSettings, HolidayTheme } from '../../types';
import { storage } from '../../services/storage';
import { Lock, Shield, Tag, X, FolderOpen, Calendar, Plus, Trash2 } from 'lucide-react';

interface AdminSettingsProps {
  settings: StoreSettings;
  onUpdate: (newSettings: StoreSettings) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onUpdate }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  
  // New Holiday Form State
  const [newHoliday, setNewHoliday] = useState<Partial<HolidayTheme>>({
      name: '',
      month: 1,
      day: 1,
      colors: { primary: '#10b981', accent: '#fbbf24' },
      icon: '🎉',
      enabled: true
  });

  useEffect(() => {
    const load = () => {
        setCategories(storage.getCategories());
        setBrands(storage.getBrands());
    };
    load();
    
    window.addEventListener('hs_storage_update', load);
    window.addEventListener('storage', load);
    
    return () => {
        window.removeEventListener('hs_storage_update', load);
        window.removeEventListener('storage', load);
    };
  }, []);

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

  const handleAddHoliday = () => {
      if (!newHoliday.name) return;
      const holiday: HolidayTheme = {
          id: Math.random().toString(36).substr(2, 9),
          name: newHoliday.name!,
          month: newHoliday.month!,
          day: newHoliday.day!,
          colors: newHoliday.colors!,
          icon: newHoliday.icon || '🎉',
          enabled: true
      };
      
      const updatedHolidays = [...(settings.holidays || []), holiday];
      updateRootSetting('holidays', updatedHolidays);
      setShowAddHoliday(false);
      setNewHoliday({ name: '', month: 1, day: 1, colors: { primary: '#10b981', accent: '#fbbf24' }, icon: '🎉', enabled: true });
  };

  const handleDeleteHoliday = (id: string) => {
      if (window.confirm("Delete this holiday theme?")) {
          const updatedHolidays = settings.holidays.filter(h => h.id !== id);
          updateRootSetting('holidays', updatedHolidays);
      }
  };

  const handleDeleteCategory = (cat: string) => {
    if (window.confirm(`Delete category "${cat}"?`)) {
        storage.deleteCategory(cat);
    }
  };

  const handleDeleteBrand = (brand: string) => {
    if (window.confirm(`Delete brand "${brand}"?`)) {
        storage.deleteBrand(brand);
    }
  };

  const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
      <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
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

      {/* Holiday Themes */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cannabis-500" />
                  <h2 className="text-xl font-bold text-white text-cannabis-400">Holiday Themes</h2>
              </div>
              <button 
                onClick={() => setShowAddHoliday(!showAddHoliday)}
                className="flex items-center gap-1 text-xs bg-dark-700 hover:bg-dark-600 px-3 py-1.5 rounded-lg text-white transition-colors"
              >
                  <Plus className="w-4 h-4" /> Add Event
              </button>
          </div>

          <p className="text-sm text-gray-400 mb-4">Themes automatically apply on these dates.</p>

          {showAddHoliday && (
              <div className="bg-dark-900 p-4 rounded-xl border border-gray-700 mb-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                      <input 
                        placeholder="Event Name (e.g. 4/20)" 
                        className="bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm"
                        value={newHoliday.name}
                        onChange={e => setNewHoliday({...newHoliday, name: e.target.value})}
                      />
                      <input 
                        placeholder="Icon (e.g. 🌿)" 
                        className="bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm"
                        value={newHoliday.icon}
                        onChange={e => setNewHoliday({...newHoliday, icon: e.target.value})}
                      />
                  </div>
                  <div className="flex gap-4 mb-3">
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Month</label>
                          <input type="number" min="1" max="12" className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" 
                            value={newHoliday.month} onChange={e => setNewHoliday({...newHoliday, month: Number(e.target.value)})} />
                      </div>
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Day</label>
                          <input type="number" min="1" max="31" className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" 
                             value={newHoliday.day} onChange={e => setNewHoliday({...newHoliday, day: Number(e.target.value)})} />
                      </div>
                  </div>
                  <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Primary Color</label>
                          <div className="flex gap-2">
                              <input type="color" className="h-9 bg-transparent rounded cursor-pointer" 
                                value={newHoliday.colors?.primary} 
                                onChange={e => setNewHoliday({...newHoliday, colors: { ...newHoliday.colors!, primary: e.target.value }})} 
                              />
                              <span className="text-xs text-gray-400 self-center">{newHoliday.colors?.primary}</span>
                          </div>
                      </div>
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Accent Color</label>
                          <div className="flex gap-2">
                              <input type="color" className="h-9 bg-transparent rounded cursor-pointer" 
                                value={newHoliday.colors?.accent} 
                                onChange={e => setNewHoliday({...newHoliday, colors: { ...newHoliday.colors!, accent: e.target.value }})} 
                              />
                              <span className="text-xs text-gray-400 self-center">{newHoliday.colors?.accent}</span>
                          </div>
                      </div>
                  </div>
                  <button onClick={handleAddHoliday} className="w-full bg-cannabis-600 hover:bg-cannabis-500 text-white font-bold py-2 rounded-lg">Save Holiday</button>
              </div>
          )}

          <div className="space-y-2">
              {settings.holidays?.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-dark-900 border border-gray-800 rounded-xl">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-dark-800 border border-gray-700">
                              {h.icon}
                          </div>
                          <div>
                              <div className="font-bold text-white text-sm">{h.name}</div>
                              <div className="text-xs text-gray-500">Date: {h.month}/{h.day}</div>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                              <div className="w-4 h-4 rounded-full border border-white/10" style={{backgroundColor: h.colors.primary}} title="Primary"></div>
                              <div className="w-4 h-4 rounded-full border border-white/10" style={{backgroundColor: h.colors.accent}} title="Accent"></div>
                          </div>
                          <button onClick={() => handleDeleteHoliday(h.id)} className="text-gray-500 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              ))}
              {(!settings.holidays || settings.holidays.length === 0) && (
                  <div className="text-center py-4 text-gray-500 text-sm">No holidays configured.</div>
              )}
          </div>
      </section>

      {/* Store Access / Security */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-cannabis-500" />
              <h2 className="text-xl font-bold text-white text-cannabis-400">Store Security</h2>
          </div>
          <div className="bg-dark-900/50 p-4 rounded-lg border border-gray-700 mb-4">
               <p className="text-sm text-gray-400 mb-2">When enabled, visitors must enter a code to view your products.</p>
               <Toggle 
                    label="Restrict Store Access" 
                    checked={settings.access.enabled} 
                    onChange={(v) => updateSetting('access', 'enabled', v)} 
               />
          </div>
          
          {settings.access.enabled && (
               <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm text-gray-400 mb-1 block">Access Code (PIN)</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                            type="text" 
                            value={settings.access.code}
                            onChange={(e) => updateSetting('access', 'code', e.target.value)}
                            className="w-full bg-dark-900 border border-gray-700 rounded-lg pl-10 pr-3 py-3 text-white font-mono tracking-wider"
                            placeholder="e.g. 4200"
                        />
                    </div>
               </div>
          )}
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

      {/* Inventory Lists Management */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-5 h-5 text-cannabis-500" />
              <h2 className="text-xl font-bold text-white text-cannabis-400">Inventory Lists</h2>
          </div>
          
          <div className="space-y-6">
              {/* Brands */}
              <div>
                  <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Brand List</h3>
                  <div className="flex flex-wrap gap-2">
                      {brands.map(brand => (
                          <div key={brand} className="flex items-center gap-2 bg-dark-900 border border-gray-700 rounded-full px-3 py-1 text-sm text-gray-300">
                              <span>{brand}</span>
                              <button 
                                onClick={() => handleDeleteBrand(brand)}
                                className="text-gray-500 hover:text-red-500 transition-colors"
                              >
                                  <X className="w-3 h-3" />
                              </button>
                          </div>
                      ))}
                      {brands.length === 0 && <span className="text-gray-600 italic text-sm">No custom brands added.</span>}
                  </div>
              </div>

              {/* Categories */}
              <div>
                  <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Category List</h3>
                  <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                          <div key={cat} className="flex items-center gap-2 bg-dark-900 border border-gray-700 rounded-full px-3 py-1 text-sm text-gray-300">
                              <Tag className="w-3 h-3 text-gray-500" />
                              <span>{cat}</span>
                              <button 
                                onClick={() => handleDeleteCategory(cat)}
                                className="text-gray-500 hover:text-red-500 transition-colors"
                              >
                                  <X className="w-3 h-3" />
                              </button>
                          </div>
                      ))}
                      {categories.length === 0 && <span className="text-gray-600 italic text-sm">No custom categories added.</span>}
                  </div>
              </div>
          </div>
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
