
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, RotateCcw, User, Phone, LogOut, Ticket, Copy, AlertCircle } from 'lucide-react';
import { storage } from '../services/storage';
import { Order, OrderStatus, Product } from '../types';
import { Button } from '../components/ui/Button';

interface AccountProps {
  addToCart: (product: Product, weightIdx: number, quantity: number) => void;
}

export const Account: React.FC<AccountProps> = ({ addToCart }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<{name: string, phone: string} | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loginPhone, setLoginPhone] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('hs_customer_info');
    if (saved) {
      const user = JSON.parse(saved);
      setUserInfo(user);
      loadHistory(user.phone);
    }
  }, []);

  const loadHistory = (phone: string) => {
      const allOrders = storage.getOrders();
      // Simple normalization to match varying phone formats
      const cleanPhone = phone.replace(/\D/g, '');
      const userOrders = allOrders.filter(o => o.customerPhone.replace(/\D/g, '') === cleanPhone);
      // Sort newest first
      setOrders(userOrders.sort((a,b) => b.timestamp - a.timestamp));
  };

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if(loginPhone.length > 3) {
          const user = { name: 'Valued Customer', phone: loginPhone };
          localStorage.setItem('hs_customer_info', JSON.stringify(user));
          setUserInfo(user);
          loadHistory(loginPhone);
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('hs_customer_info');
      setUserInfo(null);
      setOrders([]);
      setLoginPhone('');
  };

  const handleBuyAgain = (order: Order) => {
      const currentProducts = storage.getProducts();
      let addedCount = 0;
      let partialStockCount = 0;
      let missingCount = 0;

      order.items.forEach(item => {
          // Find if product still exists in catalog
          const currentProduct = currentProducts.find(p => p.id === item.id);
          
          if (currentProduct && currentProduct.isPublished) {
              // Find matching weight index
              const weightIndex = currentProduct.weights.findIndex(w => w.label === item.selectedWeight.label);
              
              if (weightIndex >= 0) {
                  const currentVariant = currentProduct.weights[weightIndex];
                  
                  // Check available stock
                  if (currentVariant.stock > 0) {
                      // Don't add more than available
                      const qtyToAdd = Math.min(item.quantity, currentVariant.stock);
                      
                      if (qtyToAdd < item.quantity) {
                          partialStockCount++;
                      }

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
              alert(`Added available items to cart. ${missingCount} items were unavailable and ${partialStockCount} had limited stock.`);
          }
          navigate('/cart');
      } else {
          alert("Sorry, the items from this order are currently out of stock or no longer available.");
      }
  };

  if (!userInfo) {
      return (
          <div className="max-w-md mx-auto py-12 px-4">
              <div className="bg-dark-800 p-8 rounded-2xl border border-gray-700 text-center">
                  <div className="w-16 h-16 bg-cannabis-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-cannabis-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Track Your Orders</h1>
                  <p className="text-gray-400 mb-6">Enter your phone number to view your order history and re-order favorites.</p>
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                      <input 
                        type="tel" 
                        placeholder="Phone Number" 
                        className="w-full bg-dark-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg focus:border-cannabis-500 outline-none"
                        value={loginPhone}
                        onChange={e => setLoginPhone(e.target.value)}
                        autoFocus
                      />
                      <Button fullWidth size="lg" type="submit">View History</Button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold text-white">My Account</h1>
              <div className="flex items-center gap-2 text-gray-400 mt-1">
                  <User className="w-4 h-4" /> {userInfo.name}
                  <span className="mx-1">•</span>
                  <Phone className="w-4 h-4" /> {userInfo.phone}
              </div>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
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
                  <p className="text-gray-500">No orders found for this number.</p>
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
                              {new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="text-xl font-bold text-white">${order.total.toFixed(2)}</div>
                          {order.discountAmount ? <div className="text-xs text-green-400">Saved ${order.discountAmount.toFixed(2)}</div> : null}
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
