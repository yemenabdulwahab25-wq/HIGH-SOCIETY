
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../../services/storage';
import { Order, OrderStatus } from '../../types';
import { Clock, CheckCircle, Package, Truck, DollarSign, Calendar, TrendingUp, AlertTriangle, MessageSquare, Copy, X, Send, Bell, Ticket, Search, Filter, RotateCcw } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });

  const [stats, setStats] = useState({
      daily: 0,
      weekly: 0,
      monthly: 0,
      totalRevenue: 0,
      lowStockCount: 0,
      totalItems: 0
  });

  // Notification State
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const previousOrderCount = useRef<number>(0);

  // Message Modal State
  const [msgModal, setMsgModal] = useState<{isOpen: boolean, order: Order | null, text: string}>({
      isOpen: false, 
      order: null, 
      text: ''
  });

  // Simple Beep Sound using Web Audio API (No external file needed)
  const playNotificationSound = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  };

  const loadData = () => {
      const allOrders = storage.getOrders();
      setOrders(allOrders);
      
      // Check for new orders
      const currentCount = allOrders.length;
      if (previousOrderCount.current > 0 && currentCount > previousOrderCount.current) {
          setNewOrderAlert(true);
          playNotificationSound();
          // Auto-hide alert after 5 seconds
          setTimeout(() => setNewOrderAlert(false), 5000);
      }
      previousOrderCount.current = currentCount;

      const allProducts = storage.getProducts();
      
      // Calculate Stats
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      let daily = 0;
      let weekly = 0;
      let monthly = 0;
      let totalRev = 0;

      allOrders.forEach(o => {
          if (o.status !== OrderStatus.CANCELLED) {
              totalRev += o.total;
              if (o.timestamp >= startOfDay) daily += o.total;
              if (o.timestamp >= oneWeekAgo) weekly += o.total;
              if (o.timestamp >= startOfMonth) monthly += o.total;
          }
      });

      const lowStock = allProducts.filter(p => p.stock < 10).length;
      const totalItems = allProducts.reduce((acc, p) => acc + p.stock, 0);

      setStats({
          daily,
          weekly,
          monthly,
          totalRevenue: totalRev,
          lowStockCount: lowStock,
          totalItems
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (orderId: string, status: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        storage.saveOrder(order);
        loadData();
        
        // Trigger Message Modal based on status
        const settings = storage.getSettings();
        if (settings.messages.enabled) {
            let message = '';
            
            if (status === OrderStatus.READY) {
                // READY Notification
                message = `Hi ${order.customerName}, your order #${order.id} is READY for pickup at ${settings.storeName}! 🛍️\n\nTotal due: $${order.total.toFixed(2)}.\n\nSee you soon!`;
                setMsgModal({ isOpen: true, order: order, text: message });
            
            } else if (status === OrderStatus.PICKED_UP) {
                // PICKED UP Notification
                const guideLink = `${window.location.origin}/#/guide`;
                message = `Hi ${order.customerName}, thanks for picking up from ${settings.storeName}! ${settings.messages.template}\n\nEnjoy responsibly. Check out our Connoisseur Guide here: ${guideLink}`;
                setMsgModal({ isOpen: true, order: order, text: message });
            }
        }
    }
  };

  // Manual Notification Trigger
  const handleManualNotify = (order: Order) => {
      const settings = storage.getSettings();
      let message = '';
      if (order.status === OrderStatus.READY) {
          message = `Hi ${order.customerName}, your order #${order.id} is READY for pickup at ${settings.storeName}! 🛍️\n\nTotal due: $${order.total.toFixed(2)}.\n\nSee you soon!`;
      } else if (order.status === OrderStatus.PICKED_UP) {
          const guideLink = `${window.location.origin}/#/guide`;
          message = `Hi ${order.customerName}, thanks for picking up from ${settings.storeName}! ${settings.messages.template}\n\nEnjoy responsibly. Guide: ${guideLink}`;
      } else {
          message = `Hi ${order.customerName}, regarding your order #${order.id} at ${settings.storeName}. Current Status: ${order.status}.`;
      }
      setMsgModal({ isOpen: true, order: order, text: message });
  };

  const handleSendSMS = () => {
      if (msgModal.order) {
          window.location.href = `sms:${msgModal.order.customerPhone}?body=${encodeURIComponent(msgModal.text)}`;
          // setMsgModal({ ...msgModal, isOpen: false }); // Optional: keep open to confirm
      }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(msgModal.text);
      alert("Message copied to clipboard!");
  };

  const clearFilters = () => {
      setSearchTerm('');
      setStatusFilter('All');
      setDateRange({ start: '', end: '' });
  };

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const colors = {
        [OrderStatus.PLACED]: 'bg-blue-500/20 text-blue-400',
        [OrderStatus.ACCEPTED]: 'bg-yellow-500/20 text-yellow-400',
        [OrderStatus.READY]: 'bg-cannabis-500/20 text-cannabis-400',
        [OrderStatus.PICKED_UP]: 'bg-gray-700 text-gray-400',
        [OrderStatus.CANCELLED]: 'bg-red-500/20 text-red-400',
    };
    return <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors[status]}`}>{status}</span>;
  };

  // Filter Orders Logic
  const filteredOrders = orders.filter(order => {
    // 1. Text Search
    const matchesSearch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm);

    // 2. Status Filter
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

    // 3. Date Range Filter
    let matchesDate = true;
    if (dateRange.start) {
        // Create start date at 00:00:00 local time
        const startDate = new Date(dateRange.start);
        startDate.setHours(0,0,0,0);
        matchesDate = matchesDate && order.timestamp >= startDate.getTime();
    }
    if (dateRange.end) {
        // Create end date at 23:59:59 local time
        const endDate = new Date(dateRange.end);
        endDate.setHours(23,59,59,999);
        matchesDate = matchesDate && order.timestamp <= endDate.getTime();
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-8 pb-20 relative">
      
      {/* New Order Notification Toast */}
      {newOrderAlert && (
        <div className="fixed top-20 right-4 z-50 bg-cannabis-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-right">
            <div className="bg-white/20 p-2 rounded-full animate-bounce">
                <Bell className="w-6 h-6" />
            </div>
            <div>
                <h4 className="font-bold text-lg">New Order Received!</h4>
                <p className="text-cannabis-100 text-sm">Check the list below.</p>
            </div>
            <button onClick={() => setNewOrderAlert(false)} className="ml-2 hover:text-gray-200">
                <X className="w-5 h-5" />
            </button>
        </div>
      )}

      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <span className="text-sm text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Updates
          </span>
      </div>
      
      {/* Sales Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-800 p-5 rounded-2xl border border-gray-700 relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] bg-cannabis-500/10 w-24 h-24 rounded-full group-hover:bg-cannabis-500/20 transition-colors"></div>
              <div className="relative z-10">
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                      <DollarSign className="w-3 h-3" /> Today's Sales
                  </div>
                  <div className="text-2xl font-bold text-white">${stats.daily.toLocaleString()}</div>
                  <div className="text-xs text-cannabis-400 mt-1">Since midnight</div>
              </div>
          </div>

          <div className="bg-dark-800 p-5 rounded-2xl border border-gray-700 relative overflow-hidden group">
               <div className="absolute right-[-10px] top-[-10px] bg-blue-500/10 w-24 h-24 rounded-full group-hover:bg-blue-500/20 transition-colors"></div>
               <div className="relative z-10">
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> This Week
                  </div>
                  <div className="text-2xl font-bold text-white">${stats.weekly.toLocaleString()}</div>
                  <div className="text-xs text-blue-400 mt-1">Last 7 Days</div>
              </div>
          </div>

          <div className="bg-dark-800 p-5 rounded-2xl border border-gray-700 relative overflow-hidden group">
               <div className="absolute right-[-10px] top-[-10px] bg-purple-500/10 w-24 h-24 rounded-full group-hover:bg-purple-500/20 transition-colors"></div>
               <div className="relative z-10">
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> This Month
                  </div>
                  <div className="text-2xl font-bold text-white">${stats.monthly.toLocaleString()}</div>
                  <div className="text-xs text-purple-400 mt-1">Current Month</div>
              </div>
          </div>

          <div className="bg-dark-800 p-5 rounded-2xl border border-gray-700 relative overflow-hidden group">
               <div className="absolute right-[-10px] top-[-10px] bg-orange-500/10 w-24 h-24 rounded-full group-hover:bg-orange-500/20 transition-colors"></div>
               <div className="relative z-10">
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Package className="w-3 h-3" /> Inventory
                  </div>
                  <div className="flex items-end gap-2">
                      <div className="text-2xl font-bold text-white">{stats.totalItems}</div>
                      <span className="text-xs text-gray-500 mb-1">items total</span>
                  </div>
                  {stats.lowStockCount > 0 ? (
                       <div className="text-xs text-red-400 mt-1 flex items-center gap-1 font-bold">
                           <AlertTriangle className="w-3 h-3" /> {stats.lowStockCount} items low stock
                       </div>
                  ) : (
                      <div className="text-xs text-green-400 mt-1">Stock levels healthy</div>
                  )}
              </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
        <h2 className="text-xl font-bold text-white">Orders</h2>
      </div>

      {/* Filter Bar */}
      <div className="bg-dark-900 border border-gray-700 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search ID, Name..." 
                    className="w-full bg-dark-800 border border-gray-600 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-cannabis-500 focus:outline-none placeholder:text-gray-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="h-6 w-px bg-gray-700 hidden md:block"></div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
                 <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'All')}
                    className="w-full bg-dark-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-cannabis-500 outline-none"
                 >
                     <option value="All">All Statuses</option>
                     {Object.values(OrderStatus).map(status => (
                         <option key={status} value={status}>{status}</option>
                     ))}
                 </select>
            </div>

            <div className="h-6 w-px bg-gray-700 hidden md:block"></div>

            {/* Date Range */}
            <div className="flex gap-2 w-full md:w-auto items-center">
                <input 
                    type="date" 
                    className="bg-dark-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cannabis-500"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    placeholder="Start"
                />
                <span className="text-gray-500">-</span>
                <input 
                    type="date" 
                    className="bg-dark-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cannabis-500"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    placeholder="End"
                />
            </div>

            {/* Clear Button */}
            {(searchTerm || statusFilter !== 'All' || dateRange.start || dateRange.end) && (
                <button 
                    onClick={clearFilters}
                    className="text-gray-400 hover:text-white text-sm flex items-center gap-1 px-3 py-2 rounded hover:bg-dark-800 transition-colors ml-auto"
                >
                    <RotateCcw className="w-3 h-3" /> Clear
                </button>
            )}
      </div>

      {/* Kanban-ish List for Mobile/Desktop */}
      <div className="space-y-4">
        {filteredOrders.map(order => (
            <div key={order.id} className="bg-dark-800 border border-gray-700 rounded-xl p-4 shadow-sm hover:border-gray-600 transition-colors relative overflow-hidden">
                {order.appliedReferralCode && (
                    <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-xl border-l border-b border-green-500/30 flex items-center gap-1">
                        <Ticket className="w-3 h-3" /> Used Code: {order.appliedReferralCode}
                    </div>
                )}

                <div className="flex justify-between items-start mb-3 mt-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">#{order.id}</span>
                            <StatusBadge status={order.status} />
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{order.customerName} • {order.customerPhone}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-white">${order.total.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleTimeString()}</div>
                        <div className="text-[10px] text-gray-600">{new Date(order.timestamp).toLocaleDateString()}</div>
                    </div>
                </div>

                <div className="border-t border-gray-700 my-3 pt-3 space-y-2">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-300">
                            <span>{item.quantity}x {item.flavor} ({item.selectedWeight.label})</span>
                        </div>
                    ))}
                </div>

                {order.discountAmount ? (
                     <div className="flex justify-end text-sm text-green-400 mb-2">
                         <span>Discount Applied: -${order.discountAmount.toFixed(2)}</span>
                     </div>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    {/* Status Actions */}
                    <div className="flex-1 flex gap-2">
                        {order.status === OrderStatus.PLACED && (
                            <button onClick={() => updateStatus(order.id, OrderStatus.ACCEPTED)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium text-sm transition-colors">
                                Accept Order
                            </button>
                        )}
                        {order.status === OrderStatus.ACCEPTED && (
                            <button onClick={() => updateStatus(order.id, OrderStatus.READY)} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg font-medium text-sm transition-colors">
                                Mark Ready
                            </button>
                        )}
                        {order.status === OrderStatus.READY && (
                            <button onClick={() => updateStatus(order.id, OrderStatus.PICKED_UP)} className="flex-1 bg-cannabis-600 hover:bg-cannabis-500 text-white py-2 rounded-lg font-medium text-sm transition-colors">
                                Complete (Picked Up)
                            </button>
                        )}
                    </div>

                    {/* Manual Notify Button */}
                    <button 
                        onClick={() => handleManualNotify(order)} 
                        className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        title="Resend Notification"
                    >
                        <MessageSquare className="w-4 h-4" /> <span className="sm:hidden">Notify</span>
                    </button>

                    {/* Cancel Button */}
                    {order.status !== OrderStatus.PICKED_UP && order.status !== OrderStatus.CANCELLED && (
                         <button onClick={() => updateStatus(order.id, OrderStatus.CANCELLED)} className="px-3 py-2 bg-dark-700 text-red-400 rounded-lg hover:bg-dark-600 text-sm transition-colors">X</button>
                    )}
                </div>
            </div>
        ))}

        {filteredOrders.length === 0 && (
            <div className="text-center py-20 text-gray-500 bg-dark-800 rounded-xl border border-gray-700 border-dashed">
                <Filter className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No orders match your filters.</p>
                <button onClick={clearFilters} className="text-cannabis-400 text-sm mt-2 hover:underline">Clear all filters</button>
            </div>
        )}
      </div>

      {/* Message Modal */}
      {msgModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-dark-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95">
                  <button 
                    onClick={() => setMsgModal({ ...msgModal, isOpen: false })}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                  >
                      <X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-cannabis-500/20 text-cannabis-400 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Send SMS Notification</h2>
                  </div>

                  <p className="text-sm text-gray-400 mb-2">Generated message for {msgModal.order?.customerName}:</p>
                  <div className="bg-dark-900 p-4 rounded-xl border border-gray-700 text-sm text-white font-mono whitespace-pre-wrap leading-relaxed mb-6">
                      {msgModal.text}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-white font-bold transition-colors"
                      >
                          <Copy className="w-4 h-4" /> Copy
                      </button>
                      <button 
                        onClick={handleSendSMS}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cannabis-600 hover:bg-cannabis-500 text-white font-bold transition-colors"
                      >
                          <Send className="w-4 h-4" /> Send SMS
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
