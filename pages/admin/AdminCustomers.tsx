import React, { useState, useEffect } from 'react';
import { storage } from '../../services/storage';
import { Users, Phone, Star, DollarSign, Calendar, Search, Award, ChevronRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Order, OrderStatus } from '../../types';

interface CustomerProfile {
  name: string;
  phone: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: number;
  averageOrderValue: number;
  id: string; // phone as ID
}

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    const orders = storage.getOrders();
    const profiles: Record<string, CustomerProfile> = {};

    // Aggregate Orders
    orders.forEach(order => {
        // Normalize phone to avoid duplicates if formatting varies slightly (basic strip)
        const phoneKey = order.customerPhone.replace(/\D/g, ''); 
        
        if (!profiles[phoneKey]) {
            profiles[phoneKey] = {
                name: order.customerName,
                phone: order.customerPhone, // Keep original format for display
                totalSpent: 0,
                orderCount: 0,
                lastOrderDate: 0,
                averageOrderValue: 0,
                id: phoneKey
            };
        }
        
        const p = profiles[phoneKey];
        p.totalSpent += order.total;
        p.orderCount += 1;
        if (order.timestamp > p.lastOrderDate) p.lastOrderDate = order.timestamp;
        // Update name to latest used name
        if (order.timestamp === p.lastOrderDate) p.name = order.customerName;
    });

    // Calculate Averages & Convert to Array
    const customerList = Object.values(profiles).map(p => ({
        ...p,
        averageOrderValue: p.totalSpent / p.orderCount
    })).sort((a, b) => b.totalSpent - a.totalSpent); // Sort by highest spender

    setCustomers(customerList);
  };

  const handleCustomerClick = (customer: CustomerProfile) => {
    const allOrders = storage.getOrders();
    // Filter orders for this specific customer phone number
    const history = allOrders.filter(o => o.customerPhone.replace(/\D/g, '') === customer.id);
    // Sort newest first
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    setCustomerOrders(history);
    setSelectedCustomer(customer);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  // --- DETAIL VIEW ---
  if (selectedCustomer) {
      return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
                onClick={() => setSelectedCustomer(null)}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5 mr-1" /> Back to Client List
            </button>

            {/* Header Profile */}
            <div className="bg-dark-800 border border-gray-700 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${selectedCustomer.totalSpent > 500 ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50' : 'bg-dark-700 text-gray-400'}`}>
                            {selectedCustomer.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                {selectedCustomer.name}
                                {selectedCustomer.totalSpent > 500 && <span className="text-sm bg-gold-500 text-black font-bold px-2 py-1 rounded-full">VIP WHALE</span>}
                            </h1>
                            <div className="flex items-center gap-4 text-gray-400 mt-2">
                                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {selectedCustomer.phone}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Member since {new Date(customerOrders[customerOrders.length - 1]?.timestamp || Date.now()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                         <div className="bg-dark-900 p-4 rounded-xl flex-1 md:flex-none text-center min-w-[120px]">
                             <div className="text-xs text-gray-500 uppercase font-bold">LTV</div>
                             <div className="text-xl font-bold text-cannabis-500">${selectedCustomer.totalSpent.toLocaleString()}</div>
                         </div>
                         <a href={`tel:${selectedCustomer.phone}`} className="bg-white text-dark-950 px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors flex-1 md:flex-none">
                             <Phone className="w-5 h-5" /> Call
                         </a>
                    </div>
                </div>
            </div>

            {/* Order History */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-gray-400" />
                    Order History
                </h2>
                
                {customerOrders.map(order => (
                    <div key={order.id} className="bg-dark-800 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between hover:border-gray-600 transition-all">
                         <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                                 <span className="font-mono text-gray-500">#{order.id}</span>
                                 <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                                     order.status === OrderStatus.PICKED_UP ? 'bg-green-500/20 text-green-400' :
                                     order.status === OrderStatus.CANCELLED ? 'bg-red-500/20 text-red-400' :
                                     'bg-blue-500/20 text-blue-400'
                                 }`}>
                                     {order.status}
                                 </span>
                                 <span className="text-gray-500 text-sm">{new Date(order.timestamp).toLocaleDateString()}</span>
                             </div>
                             <div className="text-gray-300 text-sm space-y-1">
                                 {order.items.map((item, idx) => (
                                     <div key={idx} className="flex gap-2">
                                         <span className="text-white font-bold">{item.quantity}x</span>
                                         <span>{item.flavor} ({item.selectedWeight.label})</span>
                                     </div>
                                 ))}
                             </div>
                         </div>
                         <div className="text-right flex flex-col justify-center">
                             <div className="text-xl font-bold text-white">${order.total}</div>
                             <div className="text-xs text-gray-500">{order.paymentMethod}</div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
      );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">Client List</h1>
            <p className="text-gray-400">Manage your high rollers and regulars.</p>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder="Search clients..." 
                className="bg-dark-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
              <div className="text-gray-400 text-xs uppercase font-bold mb-1">Total Clients</div>
              <div className="text-2xl font-bold text-white">{customers.length}</div>
          </div>
          <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
              <div className="text-gray-400 text-xs uppercase font-bold mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-cannabis-500">
                  ${customers.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString()}
              </div>
          </div>
          <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
              <div className="text-gray-400 text-xs uppercase font-bold mb-1">Avg. LTV</div>
              <div className="text-2xl font-bold text-blue-400">
                  ${customers.length ? Math.floor(customers.reduce((acc, c) => acc + c.totalSpent, 0) / customers.length) : 0}
              </div>
          </div>
          <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
              <div className="text-gray-400 text-xs uppercase font-bold mb-1">Whales (VIP)</div>
              <div className="text-2xl font-bold text-gold-400">
                  {customers.filter(c => c.totalSpent > 500).length}
              </div>
          </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
          {filteredCustomers.map((customer) => {
              const isWhale = customer.totalSpent > 500;
              const isRegular = customer.orderCount > 3;

              return (
                <div 
                    key={customer.id} 
                    onClick={() => handleCustomerClick(customer)}
                    className="bg-dark-800 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-cannabis-500/50 hover:bg-dark-700 transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isWhale ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50' : 'bg-dark-700 text-gray-400'}`}>
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-lg group-hover:text-cannabis-400 transition-colors">{customer.name}</h3>
                                {isWhale && <span className="bg-gold-500/20 text-gold-400 text-xs px-2 py-0.5 rounded flex items-center gap-1 border border-gold-500/30"><Award className="w-3 h-3" /> VIP</span>}
                                {!isWhale && isRegular && <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded">Regular</span>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(customer.lastOrderDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gray-700 pt-3 md:pt-0">
                        <div className="text-right">
                            <div className="text-gray-400 text-xs">Total Spent</div>
                            <div className={`font-bold text-lg ${isWhale ? 'text-gold-400' : 'text-white'}`}>${customer.totalSpent.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-gray-400 text-xs">Orders</div>
                             <div className="font-bold text-white">{customer.orderCount}</div>
                        </div>
                        <div className="p-2 text-gray-500 group-hover:text-white transition-colors">
                            <ChevronRight className="w-6 h-6" />
                        </div>
                    </div>
                </div>
              );
          })}

          {filteredCustomers.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No clients found.</p>
              </div>
          )}
      </div>
    </div>
  );
};