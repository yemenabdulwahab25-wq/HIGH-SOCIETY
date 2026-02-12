
import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, CreditCard, Banknote, Bitcoin, MapPin, ShoppingBag, AlertCircle } from 'lucide-react';
import { CartItem, StoreSettings, OrderStatus, Order } from '../types';
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

  useEffect(() => {
    // Auto-fill if available
    const saved = localStorage.getItem('hs_customer_info');
    if (saved) {
        setCustomerInfo(JSON.parse(saved));
    }
  }, []);

  // Financial Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.selectedWeight.price * item.quantity), 0);
  const tax = subtotal * (settings.financials.taxRate / 100);
  const deliveryFee = deliveryType === 'Delivery' ? settings.financials.deliveryFee : 0;
  const total = subtotal + tax + deliveryFee;
  
  const isMinOrderMet = subtotal >= settings.financials.minOrderAmount;

  const handlePlaceOrder = () => {
    if (!customerInfo.name || !customerInfo.phone) {
        alert("Please fill in your name and phone number.");
        return;
    }

    const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        items: cart,
        subtotal,
        tax,
        deliveryFee,
        total,
        status: OrderStatus.PLACED,
        timestamp: Date.now(),
        type: deliveryType,
        paymentMethod
    };

    storage.saveOrder(newOrder);
    // Save customer identity for Account page
    localStorage.setItem('hs_customer_info', JSON.stringify(customerInfo));
    
    clearCart();
    setStep('success');
    
    // Simulate Owner Alert
    // new Audio('/alert.mp3').play().catch(() => {}); 
  };

  if (step === 'success') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-white">Order Placed!</h2>
            <p className="text-gray-400 max-w-md">
                Thanks {customerInfo.name}. We've received your order. You'll get a notification when it's ready for {deliveryType.toLowerCase()}.
            </p>
            <div className="p-4 bg-dark-800 rounded-lg">
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
          <div className="max-w-xl mx-auto space-y-8">
              <h2 className="text-2xl font-bold">Checkout</h2>
              
              {/* Delivery Method */}
              <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-400">Order Type</label>
                  <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setDeliveryType('Pickup')}
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

              {/* Customer Info */}
              <div className="space-y-4">
                  <h3 className="text-lg font-bold">Contact Info</h3>
                  <input 
                    type="text" 
                    placeholder="Name" 
                    className="w-full bg-dark-800 border-gray-700 rounded-lg p-3 text-white"
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    className="w-full bg-dark-800 border-gray-700 rounded-lg p-3 text-white"
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                  <input 
                    type="email" 
                    placeholder="Email (Optional)" 
                    className="w-full bg-dark-800 border-gray-700 rounded-lg p-3 text-white"
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
              
              <div className="pt-4 border-t border-gray-800 space-y-2">
                   <div className="flex justify-between text-gray-400 text-sm">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {settings.financials.taxRate > 0 && (
                      <div className="flex justify-between text-gray-400 text-sm">
                          <span>Tax ({settings.financials.taxRate}%)</span>
                          <span>${tax.toFixed(2)}</span>
                      </div>
                  )}
                  {deliveryType === 'Delivery' && settings.financials.deliveryFee > 0 && (
                      <div className="flex justify-between text-gray-400 text-sm">
                          <span>Delivery Fee</span>
                          <span>${deliveryFee.toFixed(2)}</span>
                      </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-800">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                  </div>
                  
                  <Button fullWidth size="lg" onClick={handlePlaceOrder} className="mt-4">
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
