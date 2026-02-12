import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import { storage } from '../services/storage';
import { Product } from '../types';
import { Button } from '../components/ui/Button';

interface ProductDetailsProps {
  addToCart: (product: Product, weightIdx: number, quantity: number) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedWeightIdx, setSelectedWeightIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const products = storage.getProducts();
    const found = products.find(p => p.id === id);
    if (found) setProduct(found);
  }, [id]);

  if (!product) return <div className="p-10 text-center">Loading...</div>;

  const currentVariant = product.weights[selectedWeightIdx];
  const currentPrice = currentVariant.price;
  const currentStock = currentVariant.stock || 0;
  const isVariantOutOfStock = currentStock === 0;

  const handleAdd = () => {
    if (isVariantOutOfStock) return;
    addToCart(product, selectedWeightIdx, quantity);
    navigate('/cart');
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white">
        <ArrowLeft className="w-5 h-5 mr-1" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl overflow-hidden aspect-square">
          <img src={product.imageUrl} alt={product.flavor} className="w-full h-full object-contain" />
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
                 <h2 className="text-cannabis-500 font-bold text-lg tracking-wide uppercase">{product.brand}</h2>
                 {product.stock === 0 && <span className="bg-red-500/20 text-red-500 text-xs font-bold px-2 py-1 rounded">SOLD OUT</span>}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{product.flavor}</h1>
            <div className="flex gap-3">
               <span className="px-2 py-1 bg-dark-800 rounded text-sm text-gray-300">{product.category}</span>
               <span className="px-2 py-1 bg-dark-800 rounded text-sm text-gray-300">{product.strain}</span>
               <span className="px-2 py-1 bg-dark-800 rounded text-sm text-cannabis-400 font-bold">{product.thcPercentage}% THC</span>
            </div>
          </div>

          <p className="text-gray-400 leading-relaxed text-lg">
            {product.description}
          </p>

          {/* Weight Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">Select Variation</label>
            <div className="grid grid-cols-3 gap-3">
              {product.weights.map((w, idx) => {
                const stock = w.stock || 0;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedWeightIdx(idx)}
                    disabled={stock === 0}
                    className={`border rounded-lg p-3 text-center transition-all relative ${
                      selectedWeightIdx === idx
                      ? 'border-cannabis-500 bg-cannabis-500/10 text-white ring-1 ring-cannabis-500'
                      : stock === 0 
                        ? 'border-gray-800 bg-dark-900 text-gray-600 cursor-not-allowed opacity-50'
                        : 'border-gray-700 bg-dark-800 text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    <div className="font-bold">{w.label}</div>
                    <div className="text-sm opacity-80">${w.price}</div>
                    {stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/80 text-red-500 text-[10px] font-bold px-1 rounded transform -rotate-12 border border-red-500/50">SOLD OUT</div>
                        </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Add */}
          <div className="pt-6 border-t border-gray-800">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-4 bg-dark-800 rounded-lg p-1">
                 <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="p-2 hover:bg-white/10 rounded disabled:opacity-30"
                    disabled={isVariantOutOfStock}
                 >
                    <Minus className="w-4 h-4" />
                 </button>
                 <span className="font-bold w-4 text-center">{quantity}</span>
                 <button 
                    onClick={() => setQuantity(Math.min(quantity + 1, currentStock))} 
                    className="p-2 hover:bg-white/10 rounded disabled:opacity-30"
                    disabled={isVariantOutOfStock || quantity >= currentStock}
                 >
                    <Plus className="w-4 h-4" />
                 </button>
               </div>
               <div className="text-2xl font-bold text-white">
                 ${currentPrice * quantity}
               </div>
             </div>
            
             {quantity >= currentStock && !isVariantOutOfStock && (
                 <p className="text-right text-xs text-orange-400 mb-2">Max available stock reached</p>
             )}

             <Button fullWidth size="lg" onClick={handleAdd} disabled={isVariantOutOfStock}>
               {isVariantOutOfStock ? 'Variant Out of Stock' : 'Add to Cart'}
             </Button>
          </div>
        </div>
      </div>
      
      {/* Related (Mock) */}
      <div className="pt-12">
        <h3 className="text-xl font-bold mb-4">You may also like</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50">
            {/* Placeholders for related items */}
            <div className="bg-dark-800 h-40 rounded-xl border border-gray-800"></div>
            <div className="bg-dark-800 h-40 rounded-xl border border-gray-800"></div>
        </div>
      </div>
    </div>
  );
};