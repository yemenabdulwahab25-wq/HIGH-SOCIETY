
import React, { useState, useEffect } from 'react';
import { StoreSettings, HolidayTheme, SpecialEvent, DeliveryZone } from '../../types';
import { storage } from '../../services/storage';
import { getCoordinates, generateMarketingEmail } from '../../services/gemini';
import { Lock, Shield, Tag, X, FolderOpen, Calendar, Plus, Trash2, Megaphone, Clock, DollarSign, Settings as SettingsIcon, AlertTriangle, Power, Ticket, MapPin, Loader2, Mail, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface AdminSettingsProps {
  settings: StoreSettings;
  onUpdate: (newSettings: StoreSettings) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onUpdate }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  
  // Zone State
  const [newZone, setNewZone] = useState<Partial<DeliveryZone>>({
      name: '',
      centerAddress: '',
      radiusMiles: 5,
      fee: 10,
      minOrder: 0,
      active: true
  });
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // New Holiday Form State
  const [newHoliday, setNewHoliday] = useState<Partial<HolidayTheme>>({
      name: '',
      month: 1,
      day: 1,
      colors: { primary: '#10b981', accent: '#fbbf24' },
      icon: '🎉',
      enabled: true
  });

  // New Event Form State
  const [newEvent, setNewEvent] = useState<Partial<SpecialEvent>>({
    title: '',
    message: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    backgroundColor: '#fbbf24', // Gold
    textColor: '#000000',
    enabled: true
  });
  const [notifyCustomersEvent, setNotifyCustomersEvent] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{isOpen: boolean, subject: string, body: string} | null>(null);


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

  const handleAddZone = async () => {
      if (!newZone.name || !newZone.centerAddress) return;
      
      setIsGeocoding(true);
      // Use AI to get coordinates for the address
      const coords = await getCoordinates(newZone.centerAddress);
      setIsGeocoding(false);

      if (!coords) {
          alert("Could not find coordinates for this address. Please try a more specific address or city.");
          return;
      }

      const zone: DeliveryZone = {
          id: Math.random().toString(36).substr(2, 9),
          name: newZone.name,
          centerAddress: newZone.centerAddress,
          lat: coords.lat,
          lng: coords.lng,
          radiusMiles: Number(newZone.radiusMiles) || 5,
          fee: Number(newZone.fee) || 0,
          minOrder: Number(newZone.minOrder) || 0,
          active: true
      };

      const updatedZones = [...(settings.delivery.zones || []), zone];
      updateSetting('delivery', 'zones', updatedZones);
      setIsAddingZone(false);
      setNewZone({ name: '', centerAddress: '', radiusMiles: 5, fee: 10, minOrder: 0, active: true });
  };

  const handleDeleteZone = (id: string) => {
      if (window.confirm("Delete this delivery zone?")) {
          const updatedZones = settings.delivery.zones.filter(z => z.id !== id);
          updateSetting('delivery', 'zones', updatedZones);
      }
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

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.message) return;
    const event: SpecialEvent = {
        id: Math.random().toString(36).substr(2, 9),
        title: newEvent.title!,
        message: newEvent.message!,
        startDate: newEvent.startDate!,
        endDate: newEvent.endDate!,
        backgroundColor: newEvent.backgroundColor!,
        textColor: newEvent.textColor!,
        enabled: true
    };
    
    const updatedEvents = [...(settings.specialEvents || []), event];
    updateRootSetting('specialEvents', updatedEvents);
    
    // Trigger Email if requested
    if (notifyCustomersEvent) {
        const copy = await generateMarketingEmail('Special_Event', event);
        setEmailPreview({ isOpen: true, subject: copy.subject, body: copy.body });
    } else {
        setShowAddEvent(false);
        setNewEvent({ title: '', message: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], backgroundColor: '#fbbf24', textColor: '#000000', enabled: true });
    }
  };

  const handleSendEmailBlast = () => {
      if (!emailPreview) return;
      const emails = storage.getCustomerEmails();
      if (emails.length === 0) {
          alert("No customer emails found in order history to send to.");
          setEmailPreview(null);
          setShowAddEvent(false);
          setNotifyCustomersEvent(false);
          setNewEvent({ title: '', message: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], backgroundColor: '#fbbf24', textColor: '#000000', enabled: true });
          return;
      }
      alert(`Event Invitation Sent to ${emails.length} customers!\n\nSubject: ${emailPreview.subject}`);
      setEmailPreview(null);
      setShowAddEvent(false);
      setNotifyCustomersEvent(false);
      setNewEvent({ title: '', message: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], backgroundColor: '#fbbf24', textColor: '#000000', enabled: true });
  }

  const handleDeleteEvent = (id: string) => {
    if (window.confirm("Delete this special event?")) {
        const updatedEvents = settings.specialEvents.filter(e => e.id !== id);
        updateRootSetting('specialEvents', updatedEvents);
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

  // Helper for Days of Week
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const toggleDay = (dayIndex: number) => {
      const currentClosed = settings.hours.closedDays || [];
      if (currentClosed.includes(dayIndex)) {
          updateSetting('hours', 'closedDays', currentClosed.filter(d => d !== dayIndex));
      } else {
          updateSetting('hours', 'closedDays', [...currentClosed, dayIndex]);
      }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Store Command Center</h1>
          {settings.maintenanceMode && <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">MAINTENANCE MODE ON</span>}
      </div>
      
      {/* 1. General Settings */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
              <SettingsIcon className="w-5 h-5 text-cannabis-500" />
              <h2 className="text-xl font-bold text-white text-cannabis-400">General Info</h2>
          </div>
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

      {/* 2. Operations (Hours) */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-cannabis-500" />
              <h2 className="text-xl font-bold text-white text-cannabis-400">Store Operations</h2>
          </div>
          
          <Toggle 
            label="Enforce Store Hours (Show 'Closed' status)" 
            checked={settings.hours.enabled} 
            onChange={(v) => updateSetting('hours', 'enabled', v)} 
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                  <label className="text-sm text-gray-400 mb-1 block">Open Time</label>
                  <input type="time" className="w-full bg-dark-900 border border-gray-700 rounded-lg p-3 text-white" 
                     value={settings.hours.openTime} onChange={(e) => updateSetting('hours', 'openTime', e.target.value)} />
              </div>
               <div>
                  <label className="text-sm text-gray-400 mb-1 block">Close Time</label>
                  <input type="time" className="w-full bg-dark-900 border border-gray-700 rounded-lg p-3 text-white" 
                     value={settings.hours.closeTime} onChange={(e) => updateSetting('hours', 'closeTime', e.target.value)} />
              </div>
          </div>

          <div className="mt-4">
               <label className="text-sm text-gray-400 mb-2 block">Days Closed</label>
               <div className="flex gap-2 flex-wrap">
                   {daysOfWeek.map((day, idx) => {
                       const isClosed = settings.hours.closedDays?.includes(idx);
                       return (
                           <button 
                             key={day}
                             onClick={() => toggleDay(idx)}
                             className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${isClosed ? 'bg-red-900/50 border-red-500/50 text-red-400' : 'bg-dark-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                           >
                               {day}
                           </button>
                       )
                   })}
               </div>
          </div>
      </section>

      {/* 3. Delivery Configuration */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cannabis-500" />
                  <h2 className="text-xl font-bold text-white text-cannabis-400">Delivery Zones</h2>
              </div>
              <button 
                onClick={() => setIsAddingZone(!isAddingZone)}
                className="flex items-center gap-1 text-xs bg-dark-700 hover:bg-dark-600 px-3 py-1.5 rounded-lg text-white transition-colors"
              >
                  <Plus className="w-4 h-4" /> Add Zone
              </button>
          </div>

          <Toggle 
            label="Enable Delivery" 
            checked={settings.delivery.enabled} 
            onChange={(v) => updateSetting('delivery', 'enabled', v)} 
          />

          <p className="text-sm text-gray-400 mt-4 mb-4">
              Define delivery areas by radius. The app will verify if the customer is within these zones before allowing delivery.
          </p>

          {isAddingZone && (
              <div className="bg-dark-900 p-4 rounded-xl border border-gray-700 mb-4 animate-in fade-in slide-in-from-top-2">
                   <div className="grid md:grid-cols-2 gap-4 mb-3">
                       <div>
                           <label className="text-xs text-gray-500 block mb-1">Zone Name</label>
                           <input className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" value={newZone.name} onChange={e => setNewZone({...newZone, name: e.target.value})} placeholder="e.g. Queens" />
                       </div>
                       <div>
                           <label className="text-xs text-gray-500 block mb-1">Center Address</label>
                           <input className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" value={newZone.centerAddress} onChange={e => setNewZone({...newZone, centerAddress: e.target.value})} placeholder="e.g. Astoria, Queens, NY" />
                       </div>
                   </div>
                   <div className="grid grid-cols-3 gap-4 mb-4">
                       <div>
                           <label className="text-xs text-gray-500 block mb-1">Radius (Miles)</label>
                           <input type="number" className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" value={newZone.radiusMiles} onChange={e => setNewZone({...newZone, radiusMiles: Number(e.target.value)})} />
                       </div>
                       <div>
                           <label className="text-xs text-gray-500 block mb-1">Fee ($)</label>
                           <input type="number" className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" value={newZone.fee} onChange={e => setNewZone({...newZone, fee: Number(e.target.value)})} />
                       </div>
                       <div>
                           <label className="text-xs text-gray-500 block mb-1">Min Order ($)</label>
                           <input type="number" className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" value={newZone.minOrder} onChange={e => setNewZone({...newZone, minOrder: Number(e.target.value)})} />
                       </div>
                   </div>
                   <Button onClick={handleAddZone} fullWidth disabled={isGeocoding}>
                       {isGeocoding ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Locating...</> : 'Save Zone'}
                   </Button>
              </div>
          )}

          <div className="space-y-3">
               {settings.delivery.zones?.map(zone => (
                   <div key={zone.id} className="bg-dark-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                       <div>
                           <div className="font-bold text-white text-sm flex items-center gap-2">
                               {zone.name}
                               <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                                   {zone.radiusMiles}m Radius
                               </span>
                           </div>
                           <div className="text-xs text-gray-500 mt-1">{zone.centerAddress}</div>
                           <div className="text-xs text-gray-400 mt-1">Fee: ${zone.fee} • Min Order: ${zone.minOrder}</div>
                       </div>
                       <button onClick={() => handleDeleteZone(zone.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                           <Trash2 className="w-4 h-4" />
                       </button>
                   </div>
               ))}
               {(!settings.delivery.zones || settings.delivery.zones.length === 0) && (
                   <div className="text-center py-4 text-gray-500 text-sm">No delivery zones configured.</div>
               )}
          </div>
      </section>

      {/* 4. Financials */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-cannabis-500" />
              <h2 className="text-xl font-bold text-white text-cannabis-400">Financials</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               <div>
                   <label className="text-sm text-gray-400 mb-1 block">Sales Tax (%)</label>
                   <input type="number" className="w-full bg-dark-900 border border-gray-700 rounded-lg p-3 text-white" 
                      value={settings.financials.taxRate} onChange={(e) => updateSetting('financials', 'taxRate', Number(e.target.value))} />
               </div>
               <div>
                   <label className="text-sm text-gray-400 mb-1 block">Min Order ($)</label>
                   <input type="number" className="w-full bg-dark-900 border border-gray-700 rounded-lg p-3 text-white" 
                      value={settings.financials.minOrderAmount} onChange={(e) => updateSetting('financials', 'minOrderAmount', Number(e.target.value))} />
               </div>
          </div>
      </section>

      {/* 5. Referral Program */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-5 h-5 text-cannabis-500" />
              <h2 className="text-xl font-bold text-white text-cannabis-400">Referral Program</h2>
          </div>
          
          <Toggle 
            label="Enable Referral Codes" 
            checked={settings.referral.enabled} 
            onChange={(v) => updateSetting('referral', 'enabled', v)} 
          />

          {settings.referral.enabled && (
             <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between py-2">
                      <span className="text-gray-300 font-medium">Discount Percentage (%)</span>
                      <input 
                        type="number" 
                        value={settings.referral.percentage}
                        onChange={(e) => updateSetting('referral', 'percentage', Number(e.target.value))}
                        className="w-24 bg-dark-900 border border-gray-700 rounded-lg p-2 text-center text-white"
                        min="1"
                        max="100"
                      />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                      Customers will receive a unique code after purchase. Friends using the code get this % off (one-time use).
                  </p>
             </div>
          )}
      </section>

      {/* 6. Inventory Alerts */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-cannabis-500" />
              <h2 className="text-xl font-bold text-white text-cannabis-400">Inventory Alerts</h2>
          </div>
           <div className="flex items-center justify-between py-2">
              <span className="text-gray-300 font-medium">Low Stock Threshold (Units)</span>
              <input 
                type="number" 
                value={settings.inventory.lowStockThreshold}
                onChange={(e) => updateSetting('inventory', 'lowStockThreshold', Number(e.target.value))}
                className="w-24 bg-dark-900 border border-gray-700 rounded-lg p-2 text-center text-white"
              />
          </div>
      </section>

      {/* 7. System & Security */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700">
           <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-cannabis-500" />
              <h2 className="text-xl font-bold text-white text-cannabis-400">System & Security</h2>
          </div>

          <div className="mb-4">
              <label className="text-sm text-gray-400 mb-1 block">Admin PIN (Login)</label>
              <input 
                type="text" 
                value={settings.adminPin}
                onChange={(e) => updateRootSetting('adminPin', e.target.value)}
                className="w-full bg-dark-900 border border-gray-700 rounded-lg p-3 text-white font-mono tracking-widest"
              />
          </div>

          <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                  <div>
                      <h3 className="text-red-400 font-bold flex items-center gap-2"><Power className="w-4 h-4"/> Maintenance Mode</h3>
                      <p className="text-xs text-gray-500 mt-1">Closes the store to all customers immediately.</p>
                  </div>
                  <Toggle 
                    label="" 
                    checked={settings.maintenanceMode} 
                    onChange={(v) => updateRootSetting('maintenanceMode', v)} 
                  />
              </div>
          </div>
      </section>

      {/* Special Events (Banner) */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                 <Megaphone className="w-5 h-5 text-cannabis-500" />
                 <h2 className="text-xl font-bold text-white text-cannabis-400">Special Events</h2>
             </div>
             <button 
               onClick={() => setShowAddEvent(!showAddEvent)}
               className="flex items-center gap-1 text-xs bg-dark-700 hover:bg-dark-600 px-3 py-1.5 rounded-lg text-white transition-colors"
             >
                 <Plus className="w-4 h-4" /> Add Event
             </button>
         </div>
         
         <p className="text-sm text-gray-400 mb-4">Active events appear as a banner at the top of the store.</p>

         {showAddEvent && (
             <div className="bg-dark-900 p-4 rounded-xl border border-gray-700 mb-4 animate-in fade-in slide-in-from-top-2">
                 <div className="mb-3">
                     <label className="text-xs text-gray-500 block mb-1">Event Name (Internal)</label>
                     <input className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="e.g. Billionaire Day" />
                 </div>
                 <div className="mb-3">
                     <label className="text-xs text-gray-500 block mb-1">Banner Message (Public)</label>
                     <input className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" value={newEvent.message} onChange={e => setNewEvent({...newEvent, message: e.target.value})} placeholder="e.g. 50% Off Edibles Today Only!" />
                 </div>
                 <div className="flex gap-4 mb-3">
                     <div className="flex-1">
                         <label className="text-xs text-gray-500 block mb-1">Start Date</label>
                         <input type="date" className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" value={newEvent.startDate} onChange={e => setNewEvent({...newEvent, startDate: e.target.value})} />
                     </div>
                     <div className="flex-1">
                         <label className="text-xs text-gray-500 block mb-1">End Date</label>
                         <input type="date" className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white text-sm" value={newEvent.endDate} onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} />
                     </div>
                 </div>
                 <div className="flex gap-4 mb-4">
                     <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Banner Background</label>
                          <div className="flex gap-2">
                              <input type="color" className="h-9 bg-transparent rounded cursor-pointer" value={newEvent.backgroundColor} onChange={e => setNewEvent({...newEvent, backgroundColor: e.target.value})} />
                              <span className="text-xs text-gray-400 self-center">{newEvent.backgroundColor}</span>
                          </div>
                     </div>
                     <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Text Color</label>
                          <div className="flex gap-2">
                              <input type="color" className="h-9 bg-transparent rounded cursor-pointer" value={newEvent.textColor} onChange={e => setNewEvent({...newEvent, textColor: e.target.value})} />
                              <span className="text-xs text-gray-400 self-center">{newEvent.textColor}</span>
                          </div>
                     </div>
                 </div>

                 {/* NOTIFY CUSTOMERS TOGGLE */}
                 <div className="bg-gradient-to-r from-cannabis-500/10 to-transparent p-4 rounded-xl border border-cannabis-500/20 flex items-center justify-between mb-4">
                     <div>
                         <h3 className="text-sm font-bold text-white flex items-center gap-2">
                             <Mail className="w-4 h-4 text-cannabis-400" /> Notify Customers
                         </h3>
                         <p className="text-xs text-gray-400">Send an AI-crafted email invitation for this event.</p>
                     </div>
                     <button 
                         onClick={() => setNotifyCustomersEvent(!notifyCustomersEvent)}
                         className={`w-12 h-6 rounded-full transition-colors relative ${notifyCustomersEvent ? 'bg-cannabis-500' : 'bg-gray-700'}`}
                     >
                         <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifyCustomersEvent ? 'translate-x-6' : 'translate-x-0'}`} />
                     </button>
                 </div>

                 <button onClick={handleAddEvent} className="w-full bg-cannabis-600 hover:bg-cannabis-500 text-white font-bold py-2 rounded-lg">Save Event</button>
             </div>
         )}

         <div className="space-y-2">
             {settings.specialEvents?.map(e => (
                 <div key={e.id} className="flex items-center justify-between p-3 bg-dark-900 border border-gray-800 rounded-xl">
                     <div>
                         <div className="font-bold text-white text-sm">{e.title}</div>
                         <div className="text-xs text-gray-500">"{e.message}"</div>
                         <div className="text-[10px] text-gray-600 mt-1">{e.startDate} to {e.endDate}</div>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="w-4 h-4 rounded-full border border-white/10" style={{backgroundColor: e.backgroundColor}} title="Preview Color"></div>
                         <button onClick={() => handleDeleteEvent(e.id)} className="text-gray-500 hover:text-red-500">
                             <Trash2 className="w-4 h-4" />
                         </button>
                     </div>
                 </div>
             ))}
             {(!settings.specialEvents || settings.specialEvents.length === 0) && (
                 <div className="text-center py-4 text-gray-500 text-sm">No special events scheduled.</div>
             )}
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
                  <Plus className="w-4 h-4" /> Add Theme
              </button>
          </div>

          <p className="text-sm text-gray-400 mb-4">Changes app colors on specific dates.</p>

          {showAddHoliday && (
              <div className="bg-dark-900 p-4 rounded-xl border border-gray-700 mb-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                      <input 
                        placeholder="Theme Name (e.g. 4/20)" 
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
                  <button onClick={handleAddHoliday} className="w-full bg-cannabis-600 hover:bg-cannabis-500 text-white font-bold py-2 rounded-lg">Save Theme</button>
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
                  <div className="text-center py-4 text-gray-500 text-sm">No themes configured.</div>
              )}
          </div>
      </section>

      {/* Store Access / Security */}
      <section className="bg-dark-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-cannabis-500" />
              <h2 className="text-xl font-bold text-white text-cannabis-400">Store Access</h2>
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
                    <label className="text-sm text-gray-400 mb-1 block">Customer Access Code</label>
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
            label="Enable Customer SMS Notifications" 
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

      {/* EMAIL PREVIEW MODAL */}
      {emailPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-dark-800 w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-dark-900/50">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <Mail className="w-5 h-5 text-cannabis-500" /> Review Event Invitation
                      </h3>
                      <button onClick={() => { setEmailPreview(null); setNotifyCustomersEvent(false); setShowAddEvent(false); setNewEvent({ title: '', message: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], backgroundColor: '#fbbf24', textColor: '#000000', enabled: true }); }} className="text-gray-500 hover:text-white">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-sm text-gray-400">
                          Event Saved! Review the automated email below before sending to {storage.getCustomerEmails().length} subscribers.
                      </p>
                      
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                          <div className="bg-dark-900 border border-gray-700 rounded-lg p-3 text-white text-sm font-medium">
                              {emailPreview.subject}
                          </div>
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Message Body</label>
                          <div className="bg-dark-900 border border-gray-700 rounded-lg p-3 text-gray-300 text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                              {emailPreview.body}
                          </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                          <Button 
                            variant="secondary" 
                            fullWidth 
                            onClick={() => { setEmailPreview(null); setNotifyCustomersEvent(false); setShowAddEvent(false); setNewEvent({ title: '', message: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], backgroundColor: '#fbbf24', textColor: '#000000', enabled: true }); }}
                          >
                              Skip
                          </Button>
                          <Button fullWidth onClick={handleSendEmailBlast}>
                              <Send className="w-4 h-4 mr-2" /> Send to All
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
