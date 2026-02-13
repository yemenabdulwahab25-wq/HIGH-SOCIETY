
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, RotateCcw, User, Phone, LogOut, Ticket, Copy, AlertCircle, Lock, ShieldCheck, ChevronRight } from 'lucide-react';
import { storage } from '../services/storage';
import { Order, OrderStatus, Product, Customer } from '../types';
import { Button } from '../components/ui/Button';

interface AccountProps {
  addToCart: (product: Product, weightIdx: number, quantity: number) => void;
}

export const Account: React.FC<AccountProps> = ({ addToCart }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Login State
  const [view, setView] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Check for active session on mount
  useEffect(() => {
    // We now use sessionStorage for the active session, so closing the browser logs you out (Security feature)
    const session = sessionStorage.getItem('hs_active_session');
    if (session) {
      const user = JSON.parse(session);
      setCurrentUser(user);
      loadHistory(user.phone);
    }
  }, []);

  const loadHistory = (phone: string) => {
      const allOrders = storage.getOrders(); // Decrypted automatically
      const cleanPhone = phone.replace(/\D/g, '');
      const userOrders = allOrders.filter(o => o.customerPhone.replace(/\D/g, '') === cleanPhone);
      setOrders(userOrders.sort((a,b) => b.timestamp - a.timestamp));
  };

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      const customer = storage.getCustomer(phone);
      if (!customer) {
          // If no customer found, prompt to register
          setError("Account not found. Please register.");
          setView('register');
          return;
      }

      if (customer.pin === pin) {
          // Success
          sessionStorage.setItem('hs_active_session', JSON.stringify(customer));
          setCurrentUser(customer);
          loadHistory(phone);
          setPin('');
      } else {
          setError("Incorrect PIN.");
      }
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (pin.length < 4) {
          setError("PIN must be at least 4 digits.");
          return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
          setError("Please enter a valid phone number.");
          return;
      }

      const existing = storage.getCustomer(phone);
      if (existing) {
          setError("Account already exists. Please login.");
          setView('login');
          return;
      }

      const newCustomer: Customer = {
          id: cleanPhone,
          name,
          phone,
          email,
          pin,
          joinedDate: Date.now()
      };

      storage.saveCustomer(newCustomer);
      sessionStorage.setItem('hs_active_session', JSON.stringify(newCustomer));
      setCurrentUser(newCustomer);
      loadHistory(phone);
  };

  const handleLogout = () => {
      sessionStorage.removeItem('hs_active_session');
      setCurrentUser(null);
      setOrders([]);
      setPhone('');
      setPin('');
      setView('login');
  };

  const handleBuyAgain = (order: Order) => {
      const currentProducts = storage.getProducts();
      let addedCount = 0;
      let partialStockCount = 0;
      let missingCount = 0;

      order.items.forEach(item => {
          const currentProduct = currentProducts.find(p => p.id === item.id);
          if (currentProduct && currentProduct.isPublished) {
              const weightIndex = currentProduct.weights.findIndex(w => w.label === item.selectedWeight.label);
              if (weightIndex >= 0) {
                  const currentVariant = currentProduct.weights[weightIndex];
                  if (currentVariant.stock > 0) {
                      const qtyToAdd = Math.min(item.quantity, currentVariant.stock);
                      if (qtyToAdd < item.quantity) partialStockCount++;
                      addToCart(currentProduct, weightIndex, qtyToAdd);
                      addedCount++;
                  } else {
                      missingCount++;
                  }
              } else {
                  missingCount++;
              }
          } else {
              missingCount++;
          }
      });

      if (addedCount > 0) {
          if (partialStockCount > 0 || missingCount > 0) {
              alert(`Added available items. ${missingCount} unavailable, ${partialStockCount} limited stock.`);
          }
          navigate('/cart');
      } else {
          alert("Sorry, items are out of stock.");
      }
  };

  if (!currentUser) {
      return (
          <div className="max-w-md mx-auto py-12 px-4">
              <div className="bg-dark-800 p-8 rounded-3xl border border-gray-700 shadow-2xl relative overflow-hidden">
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cannabis-500/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  <div className="w-16 h-16 bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-700 shadow-inner">
                      <Lock className="w-8 h-8 text-cannabis-500" />
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white mb-2 text-center">
                      {view === 'login' ? 'Secure Login' : 'Create Account'}
                  </h1>
                  <p className="text-gray-400 mb-8 text-center text-sm">
                      {view === 'login' 
                        ? 'Access your order history and rewards.' 
                        : 'Join the Billionaire Level club.'}
                  </p>
                  
                  {view === 'login' ? (
                      <form onSubmit={handleLogin} className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Phone Number</label>
                              <input 
                                type="tel" 
                                placeholder="(555) 555-5555" 
                                className="w-full bg-dark-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-cannabis-500 focus:ring-1 focus:ring-cannabis-500 outline-none"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                autoFocus
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">4-Digit PIN</label>
                              <input 
                                type="password" 
                                placeholder="••••" 
                                maxLength={4}
                                inputMode="numeric"
                                className="w-full bg-dark-900 border border-gray-600 rounded-xl px-4 py-3 text-white tracking-widest text-center text-lg focus:border-cannabis-500 focus:ring-1 focus:ring-cannabis-500 outline-none"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                              />
                          </div>
                          
                          {error && <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</div>}
                          
                          <Button fullWidth size="lg" type="submit" className="shadow-lg shadow-cannabis-500/20">
                              Access Account
                          </Button>
                          
                          <div className="text-center pt-2">
                              <button type="button" onClick={() => { setView('register'); setError(''); }} className="text-sm text-gray-500 hover:text-white transition-colors">
                                  New here? <span className="text-cannabis-400 font-bold">Register</span>
                              </button>
                          </div>
                      </form>
                  ) : (
                      <form onSubmit={handleRegister} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Name</label>
                                  <input 
                                    type="text" 
                                    placeholder="John Doe" 
                                    className="w-full bg-dark-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-cannabis-500 outline-none text-sm"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Phone</label>
                                  <input 
                                    type="tel" 
                                    placeholder="555-0199" 
                                    className="w-full bg-dark-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-cannabis-500 outline-none text-sm"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    required
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Email (Optional)</label>
                              <input 
                                type="email" 
                                placeholder="vip@billionaire.com" 
                                className="w-full bg-dark-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-cannabis-500 outline-none text-sm"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Create PIN (4 Digits)</label>
                              <input 
                                type="password" 
                                placeholder="••••" 
                                maxLength={4}
                                inputMode="numeric"
                                className="w-full bg-dark-900 border border-gray-600 rounded-xl px-4 py-3 text-white tracking-widest text-center text-lg focus:border-cannabis-500 outline-none"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                required
                              />
                          </div>

                          {error && <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</div>}

                          <Button fullWidth size="lg" type="submit">
                              Create Profile
                          </Button>

                          <div className="text-center pt-2">
                              <button type="button" onClick={() => { setView('login'); setError(''); }} className="text-sm text-gray-500 hover:text-white transition-colors">
                                  Already a member? <span className="text-cannabis-400 font-bold">Login</span>
                              </button>
                          </div>
                      </form>
                  )}
              </div>
              
              <div className="text-center mt-8 text-gray-600 text-xs flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  Secured by Billionaire Vault™
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  {currentUser.name} <span className="text-xs bg-gold-500/20 text-gold-400 border border-gold-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Member</span>
              </h1>
              <div className="flex items-center gap-2 text-gray-400 mt-1 text-sm">
                  <Phone className="w-3 h-3" /> {currentUser.phone}
              </div>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors" title="Secure Logout">
              <LogOut className="w-5 h-5" />
          </button>
      </div>

      <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-cannabis-500" />
              Order History
          </h2>

          {orders.length === 0 && (
              <div className="text-center py-12 bg-dark-800 rounded-xl border border-gray-800">
                  <p className="text-gray-500">No orders found.</p>
                  <Button className="mt-4" onClick={() => navigate('/')}>Start Shopping</Button>
              </div>
          )}

          {orders.map(order => (
              <div key={order.id} className="bg-dark-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors relative overflow-hidden group">
                  
                  {/* Generated Code Badge */}
                  {order.generatedReferralCode && (
                      <div className="mb-4 bg-gradient-to-r from-dark-900 to-dark-950 p-3 rounded-lg border border-gold-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-wide">
                              <Ticket className="w-4 h-4" /> 
                              <span>Share Code</span>
                          </div>
                          <button 
                            onClick={() => {navigator.clipboard.writeText(order.generatedReferralCode!); alert("Code copied!");}}
                            className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded text-white font-mono text-sm hover:bg-black/60 transition-colors"
                          >
                              {order.generatedReferralCode} <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                      </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-gray-400">#{order.id}</span>
                              <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                                     order.status === OrderStatus.PICKED_UP ? 'bg-green-500/20 text-green-400' :
                                     order.status === OrderStatus.CANCELLED ? 'bg-red-500/20 text-red-400' :
                                     'bg-blue-500/20 text-blue-400'
                                 }`}>
                                     {order.status}
                              </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {new Date(order.timestamp).toLocaleDateString()}
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="text-xl font-bold text-white">${order.total.toFixed(2)}</div>
                      </div>
                  </div>

                  <div className="space-y-2 mb-5">
                      {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-dark-900/50 p-2 rounded-lg border border-transparent group-hover:border-gray-800 transition-colors">
                              <div className="w-8 h-8 rounded bg-white flex-shrink-0 overflow-hidden">
                                  <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.flavor} />
                              </div>
                              <div className="flex-1 text-sm text-gray-300">
                                  <span className="font-bold text-white">{item.quantity}x</span> {item.flavor} 
                                  <span className="text-gray-500 ml-1">({item.selectedWeight.label})</span>
                              </div>
                          </div>
                      ))}
                  </div>

                  <Button 
                    variant="secondary" 
                    fullWidth 
                    className="flex items-center justify-center gap-2 border-cannabis-500/30 hover:bg-cannabis-500/10 text-cannabis-400 hover:text-cannabis-300 transition-all active:scale-[0.98]"
                    onClick={() => handleBuyAgain(order)}
                  >
                      <RotateCcw className="w-4 h-4" /> Buy Again
                  </Button>
              </div>
          ))}
      </div>
    </div>
  );
};
