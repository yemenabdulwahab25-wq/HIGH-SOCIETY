
import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, CreditCard, Banknote, Bitcoin, MapPin, ShoppingBag, AlertCircle, Ticket, Copy, Loader2, Navigation, Check } from 'lucide-react';
import { CartItem, StoreSettings, OrderStatus, Order, DeliveryZone } from '../types';
import { Button } from '../components/ui/Button';
import { storage } from '../services/storage';

interface CartProps {
  cart: CartItem[];
  removeFromCart: (id: string, weightLabel: string) => void;
  clearCart: () => void;
  settings: StoreSettings;
}

export const Cart: React.FC<CartProps> = ({ cart, removeFromCart, clearCart, settings }) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [deliveryType, setDeliveryType] = useState<'Pickup' | 'Delivery'>('Pickup');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Online' | 'Crypto'>('Cash');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  
  // Delivery Zone State
  const [activeZone, setActiveZone] = useState<DeliveryZone | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  
  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    // Auto-fill if available
    const saved = localStorage.getItem('hs_customer_info');
    if (saved) {
        setCustomerInfo(JSON.parse(saved));
    }
  }, []);

  // Distance Utility
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 3958.8; // Radius of Earth in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
  };

  const checkDeliveryAvailability = () => {
      if (!settings.delivery.zones || settings.delivery.zones.length === 0) {
          setDeliveryError("Delivery is currently unavailable.");
          return;
      }

      setIsCheckingLocation(true);
      setDeliveryError('');
      setActiveZone(null);

      navigator.geolocation.getCurrentPosition(
          (position) => {
              const userLat = position.coords.latitude;
              const userLng = position.coords.longitude;
              
              let matchedZone: DeliveryZone | null = null;
              let minFee = Infinity;

              // Find active zone that covers user location
              for (const zone of settings.delivery.zones) {
                  if (zone.active) {
                      const dist = calculateDistance(userLat, userLng, zone.lat, zone.lng);
                      if (dist <= zone.radiusMiles) {
                          // If multiple zones match, prioritize cheapest fee
                          if (zone.fee < minFee) {
                              minFee = zone.fee;
                              matchedZone = zone;
                          }
                      }
                  }
              }

              if (matchedZone) {
                  if (subtotal < matchedZone.minOrder) {
                      setDeliveryError(`Minimum order for ${matchedZone.name} delivery is $${matchedZone.minOrder}.`);
                  } else {
                      setActiveZone(matchedZone);
                  }
              } else {
                  setDeliveryError("Sorry, we don't deliver to your current location.");
              }
              setIsCheckingLocation(false);
          },
          (error) => {
              console.error(error);
              setDeliveryError("Location access denied. Please enable GPS to check delivery.");
              setIsCheckingLocation(false);
          }
      );
  };

  // Financial Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.selectedWeight.price * item.quantity), 0);
  const discountAmount = appliedPromo ? (subtotal * (settings.referral.percentage / 100)) : 0;
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * (settings.financials.taxRate / 100);
  
  // Determine delivery fee based on active zone OR default if no zones configured but delivery enabled (legacy fallback)
  const deliveryFee = deliveryType === 'Delivery' 
    ? (activeZone ? activeZone.fee : (settings.delivery.zones.length === 0 ? settings.financials.deliveryFee : 0)) 
    : 0;
    
  const total = taxableAmount + tax + deliveryFee;
  
  const isMinOrderMet = subtotal >= settings.financials.minOrderAmount;

  const handleApplyPromo = () => {
      if (!settings.referral.enabled) return;
      if (!promoCode.trim()) return;

      setPromoError('');
      const code = promoCode.trim().toUpperCase();
      const orders = storage.getOrders();
      
      // 1. Find the order that generated this code
      const originOrder = orders.find(o => o.generatedReferralCode === code);
      
      if (!originOrder) {
          setPromoError('Invalid referral code.');
          return;
      }

      // 2. Self-Referral Check
      // We normalize phone numbers to basic digits to compare
      const normalize = (p: string) => p.replace(/\D/g, '');
      if (normalize(originOrder.customerPhone) === normalize(customerInfo.phone)) {
          setPromoError('You cannot use your own referral code.');
          return;
      }

      // 3. One-Time Use Check
      const isUsed = orders.some(o => o.appliedReferralCode === code && o.status !== OrderStatus.CANCELLED);
      if (isUsed) {
          setPromoError('This code has already been redeemed.');
          return;
      }

      setAppliedPromo(code);
      setPromoCode(''); // Clear input
  };

  const handleRemovePromo = () => {
      setAppliedPromo(null);
      setPromoError('');
  };

  const handlePlaceOrder = () => {
    if (!customerInfo.name || !customerInfo.phone) {
        alert("Please fill in your name and phone number.");
        return;
    }

    if (deliveryType === 'Delivery' && settings.delivery.zones.length > 0 && !activeZone) {
        alert("Please check delivery availability first.");
        return;
    }

    // Generate a unique referral code for this new order
    const newRefCode = `REF-${Math.random().toString(36).substr(2, 4).toUpperCase()}${Math.floor(Math.random() * 100)}`;
    setGeneratedCode(newRefCode);

    const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        items: cart,
        subtotal,
        discountAmount,
        tax,
        deliveryFee,
        total,
        status: OrderStatus.PLACED,
        timestamp: Date.now(),
        type: deliveryType,
        paymentMethod,
        generatedReferralCode: newRefCode,
        appliedReferralCode: appliedPromo || undefined,
        deliveryZoneName: activeZone?.name
    };

    storage.saveOrder(newOrder);
    // Save customer identity for Account page
    localStorage.setItem('hs_customer_info', JSON.stringify(customerInfo));
    
    clearCart();
    setStep('success');
  };

  if (step === 'success') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-white">Order Placed!</h2>
            <p className="text-gray-400 max-w-md">
                Thanks {customerInfo.name}. We've received your order. You'll get a notification when it's ready for {deliveryType.toLowerCase()}.
            </p>
            
            {/* Referral Code Display */}
            {settings.referral.enabled && (
                <div className="bg-gradient-to-r from-dark-800 to-dark-900 border border-gold-500/30 p-6 rounded-2xl max-w-sm w-full relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gold-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-2 text-gold-400 font-bold uppercase tracking-widest text-xs mb-2">
                            <Ticket className="w-4 h-4" /> Share & Earn
                        </div>
                        <p className="text-gray-300 text-sm mb-4">
                            Give a friend <strong>{settings.referral.percentage}% OFF</strong> their first order.
                        </p>
                        <div className="bg-black/40 border border-gray-700 rounded-xl p-3 flex items-center justify-between gap-3">
                            <span className="font-mono text-xl font-bold text-white tracking-widest">{generatedCode}</span>
                            <button 
                                onClick={() => {navigator.clipboard.writeText(generatedCode); alert("Code copied!");}}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 bg-dark-800 rounded-lg mt-4 w-full max-w-sm">
                <p className="text-sm text-gray-500">Loyalty Points Earned (Pending Pickup)</p>
                <p className="text-xl font-bold text-gold-400">+{Math.floor(subtotal * settings.loyalty.pointsPerDollar)} PTS</p>
            </div>
            <Button onClick={() => window.location.hash = '#'}>Back to Store</Button>
        </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-500 mb-4">Your stash is empty.</h2>
        <Button onClick={() => window.location.hash = '#'}>Go Shopping</Button>
      </div>
    );
  }

  if (step === 'checkout') {
      return (
          <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-300">
              <h2 className="text-2xl font-bold">Checkout</h2>
              
              {/* Delivery Method */}
              <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-400">Order Type</label>
                  <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => { setDeliveryType('Pickup'); setActiveZone(null); setDeliveryError(''); }}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${deliveryType === 'Pickup' ? 'border-cannabis-500 bg-cannabis-500/10 text-white' : 'border-gray-700 bg-dark-800 text-gray-400'}`}
                      >
                          <ShoppingBag className="w-6 h-6" />
                          <span className="font-bold">Pickup</span>
                      </button>
                      {settings.delivery.enabled && (
                        <button 
                            onClick={() => setDeliveryType('Delivery')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${deliveryType === 'Delivery' ? 'border-cannabis-500 bg-cannabis-500/10 text-white' : 'border-gray-700 bg-dark-800 text-gray-400'}`}
                        >
                            <MapPin className="w-6 h-6" />
                            <span className="font-bold">Delivery</span>
                        </button>
                      )}
                  </div>
              </div>
              
              {/* Delivery Check Logic */}
              {deliveryType === 'Delivery' && settings.delivery.zones.length > 0 && (
                  <div className="bg-dark-800 p-4 rounded-xl border border-gray-700 animate-in fade-in slide-in-from-top-2">
                       <h3 className="font-bold text-white text-sm mb-2">Check Availability</h3>
                       {!activeZone ? (
                           <>
                               <Button 
                                    fullWidth 
                                    variant="secondary"
                                    onClick={checkDeliveryAvailability} 
                                    disabled={isCheckingLocation}
                                    className="flex items-center justify-center gap-2"
                                >
                                   {isCheckingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                                   {isCheckingLocation ? 'Checking Location...' : 'Use Current Location'}
                               </Button>
                               {deliveryError && (
                                   <div className="mt-3 text-red-400 text-sm flex items-center gap-2">
                                       <AlertCircle className="w-4 h-4" /> {deliveryError}
                                   </div>
                               )}
                           </>
                       ) : (
                           <div className="flex items-center justify-between bg-green-900/20 border border-green-500/30 p-3 rounded-lg">
                               <div>
                                   <div className="flex items-center gap-2 text-green-400 font-bold">
                                       <CheckCircle className="w-4 h-4" /> Delivered from {activeZone.name}
                                   </div>
                                   <div className="text-xs text-gray-400 mt-1">Fee: ${activeZone.fee}</div>
                               </div>
                               <button onClick={() => setActiveZone(null)} className="text-gray-500 hover:text-white text-sm underline">Change</button>
                           </div>
                       )}
                  </div>
              )}

              {/* Customer Info */}
              <div className="space-y-4">
                  <h3 className="text-lg font-bold">Contact Info</h3>
                  <input 
                    type="text" 
                    placeholder="Name" 
                    className="w-full bg-dark-800 border-gray-700 rounded-lg p-3 text-white focus:border-cannabis-500 outline-none"
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    className="w-full bg-dark-800 border-gray-700 rounded-lg p-3 text-white focus:border-cannabis-500 outline-none"
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                  <input 
                    type="email" 
                    placeholder="Email (Optional)" 
                    className="w-full bg-dark-800 border-gray-700 rounded-lg p-3 text-white focus:border-cannabis-500 outline-none"
                    value={customerInfo.email}
                    onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                  />
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-400">Payment Method</label>
                  <div className="grid grid-cols-1 gap-2">
                      {settings.payments.cashInStore && (
                          <button onClick={() => setPaymentMethod('Cash')} className={`flex items-center gap-3 p-3 rounded-lg border ${paymentMethod === 'Cash' ? 'border-cannabis-500 bg-cannabis-500/10' : 'border-gray-700 bg-dark-800'}`}>
                              <Banknote className="w-5 h-5" /> Cash in Store
                          </button>
                      )}
                      {settings.payments.cardInStore && (
                          <button onClick={() => setPaymentMethod('Card')} className={`flex items-center gap-3 p-3 rounded-lg border ${paymentMethod === 'Card' ? 'border-cannabis-500 bg-cannabis-500/10' : 'border-gray-700 bg-dark-800'}`}>
                              <CreditCard className="w-5 h-5" /> Card in Store
                          </button>
                      )}
                      {settings.payments.crypto && (
                           <button onClick={() => setPaymentMethod('Crypto')} className={`flex items-center gap-3 p-3 rounded-lg border ${paymentMethod === 'Crypto' ? 'border-cannabis-500 bg-cannabis-500/10' : 'border-gray-700 bg-dark-800'}`}>
                              <Bitcoin className="w-5 h-5" /> Crypto
                          </button>
                      )}
                  </div>
              </div>

              {/* Promo Code Section */}
              {settings.referral.enabled && (
                  <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-400">Discount Code</label>
                      {!appliedPromo ? (
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Enter code" 
                                className="flex-1 bg-dark-800 border border-gray-700 rounded-lg p-3 text-white uppercase focus:border-cannabis-500 outline-none"
                                value={promoCode}
                                onChange={e => setPromoCode(e.target.value)}
                              />
                              <button 
                                onClick={handleApplyPromo}
                                disabled={!promoCode || !customerInfo.phone}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 rounded-lg font-bold disabled:opacity-50 transition-colors"
                              >
                                  Apply
                              </button>
                          </div>
                      ) : (
                          <div className="flex items-center justify-between bg-green-900/20 border border-green-500/30 p-3 rounded-lg text-green-400">
                              <div className="flex items-center gap-2">
                                  <Ticket className="w-4 h-4" />
                                  <span className="font-bold">{appliedPromo} applied ({settings.referral.percentage}% Off)</span>
                              </div>
                              <button onClick={handleRemovePromo} className="text-gray-500 hover:text-white">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      )}
                      {promoError && <p className="text-xs text-red-500">{promoError}</p>}
                      {!customerInfo.phone && !appliedPromo && <p className="text-xs text-gray-500">Enter phone number above to apply codes.</p>}
                  </div>
              )}
              
              <div className="pt-4 border-t border-gray-800 space-y-2">
                   <div className="flex justify-between text-gray-400 text-sm">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedPromo && (
                      <div className="flex justify-between text-green-400 text-sm font-bold">
                          <span>Discount</span>
                          <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                  )}
                  {settings.financials.taxRate > 0 && (
                      <div className="flex justify-between text-gray-400 text-sm">
                          <span>Tax ({settings.financials.taxRate}%)</span>
                          <span>${tax.toFixed(2)}</span>
                      </div>
                  )}
                  {deliveryType === 'Delivery' && deliveryFee > 0 && (
                      <div className="flex justify-between text-gray-400 text-sm">
                          <span>Delivery Fee</span>
                          <span>${deliveryFee.toFixed(2)}</span>
                      </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-800">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                  </div>
                  
                  <Button 
                    fullWidth 
                    size="lg" 
                    onClick={handlePlaceOrder} 
                    className="mt-4"
                    disabled={deliveryType === 'Delivery' && settings.delivery.zones.length > 0 && !activeZone}
                  >
                      Confirm Order
                  </Button>
                  <button onClick={() => setStep('cart')} className="w-full mt-4 text-gray-500 hover:text-white">Back to Cart</button>
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Stash</h1>
      
      {/* Min Order Alert */}
      {!isMinOrderMet && (
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 flex items-center gap-3 text-orange-400 text-sm mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>Minimum order amount is ${settings.financials.minOrderAmount}. Add ${(settings.financials.minOrderAmount - subtotal).toFixed(2)} more to checkout.</span>
          </div>
      )}

      <div className="space-y-4">
        {cart.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="flex items-center gap-4 bg-dark-800 p-4 rounded-xl border border-gray-800">
            <img src={item.imageUrl} alt={item.flavor} className="w-16 h-16 rounded-lg bg-white object-contain" />
            <div className="flex-1">
              <h3 className="font-bold text-white">{item.flavor}</h3>
              <p className="text-sm text-gray-400">{item.brand} • {item.selectedWeight.label}</p>
              <div className="text-cannabis-400 font-bold mt-1">${item.selectedWeight.price * item.quantity}</div>
            </div>
            <div className="flex items-center gap-3">
               <span className="font-bold">x{item.quantity}</span>
               <button onClick={() => removeFromCart(item.id, item.selectedWeight.label)} className="text-gray-500 hover:text-red-500">
                 <Trash2 className="w-5 h-5" />
               </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-6 bg-dark-900 rounded-xl border border-gray-800">
        <div className="flex justify-between text-lg font-bold mb-6">
           <span>Subtotal</span>
           <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="text-xs text-gray-500 mb-4 text-right">Tax & Fees calculated at checkout</div>
        <Button fullWidth size="lg" onClick={() => setStep('checkout')} disabled={!isMinOrderMet}>
            Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};
