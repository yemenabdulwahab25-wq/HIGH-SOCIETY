import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Share2, ShieldCheck, Zap } from 'lucide-react';
import { storage } from '../services/storage';
import { Product } from '../types';
import { Button } from '../components/ui/Button';
import { getCategoryColor } from './Storefront';

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

  if (!product) return <div className="p-20 text-center text-gray-500 animate-pulse">Loading Luxury Experience...</div>;

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
    <div className="space-y-8 pb-20 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white transition-colors group">
            <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center mr-2 group-hover:bg-dark-700">
                <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Back</span>
        </button>
        <button className="text-gray-400 hover:text-gold-400 transition-colors">
            <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Image Section */}
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-cannabis-500/5 to-gold-500/5 rounded-3xl blur-2xl"></div>
            <div className="bg-dark-900/50 backdrop-blur-sm rounded-3xl border border-white/5 overflow-hidden aspect-square relative z-10 flex items-center justify-center p-8">
                <img src={product.imageUrl} alt={product.flavor} className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                
                {product.stock === 0 && (
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                         <span className="border-2 border-red-500 text-red-500 text-xl font-bold px-6 py-2 rounded-xl uppercase tracking-widest transform -rotate-12 bg-black/50">Sold Out</span>
                     </div>
                )}
            </div>
        </div>

        {/* Details Section */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
                 <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border ${getCategoryColor(product.category)}`}>
                    {product.category}
                 </span>
                 <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent"></div>
                 <h2 className="text-gold-500 font-bold text-sm tracking-widest uppercase">{product.brand}</h2>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{product.flavor}</h1>
            
            <div className="flex flex-wrap gap-3">
               <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${
                  product.strain === 'Indica' ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' :
                  product.strain === 'Sativa' ? 'bg-orange-900/30 text-orange-300 border-orange-500/30' :
                  'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
               }`}>
                  <Zap className="w-3 h-3" />
                  {product.strain}
               </span>
               <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-dark-800 text-cannabis-400 border border-cannabis-500/20 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  {product.thcPercentage}% THC
               </span>
            </div>
          </div>

          <div className="bg-dark-900/50 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Experience</h3>
              <p className="text-gray-300 leading-relaxed text-lg font-light">
                {product.description}
              </p>
          </div>

          {/* Weight Selection */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Tier</label>
            <div className="grid grid-cols-3 gap-3">
              {product.weights.map((w, idx) => {
                const stock = w.stock || 0;
                const isSelected = selectedWeightIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedWeightIdx(idx)}
                    disabled={stock === 0}
                    className={`relative border rounded-xl p-4 text-center transition-all duration-300 ${
                      isSelected
                      ? 'border-gold-500 bg-gold-500/10 text-white shadow-[0_0_15px_rgba(251,191,36,0.15)] scale-105 z-10'
                      : stock === 0 
                        ? 'border-gray-800 bg-dark-900/50 text-gray-600 cursor-not-allowed opacity-60'
                        : 'border-gray-700 bg-dark-800 text-gray-400 hover:border-gray-500 hover:bg-dark-700'
                    }`}
                  >
                    <div className={`font-bold text-lg ${isSelected ? 'text-gold-400' : ''}`}>{w.label}</div>
                    <div className="text-sm opacity-80">${w.price}</div>
                    
                    {isSelected && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_8px_#fbbf24]"></div>
                    )}

                    {stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-black px-1">Sold Out</span>
                        </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Area */}
          <div className="pt-6 border-t border-gray-800">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-6 bg-dark-900 rounded-xl p-2 border border-gray-800">
                 <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30"
                    disabled={isVariantOutOfStock}
                 >
                    <Minus className="w-4 h-4 text-gray-400" />
                 </button>
                 <span className="font-bold text-xl text-white w-6 text-center">{quantity}</span>
                 <button 
                    onClick={() => setQuantity(Math.min(quantity + 1, currentStock))} 
                    className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30"
                    disabled={isVariantOutOfStock || quantity >= currentStock}
                 >
                    <Plus className="w-4 h-4 text-gray-400" />
                 </button>
               </div>
               <div className="text-right">
                 <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Price</div>
                 <div className="text-3xl font-bold text-white tracking-tight">${currentPrice * quantity}</div>
               </div>
             </div>
            
             <Button 
                fullWidth 
                size="lg" 
                onClick={handleAdd} 
                disabled={isVariantOutOfStock}
                className={`py-4 text-lg font-bold tracking-wide shadow-lg transition-all hover:scale-[1.02] ${isVariantOutOfStock ? 'opacity-50' : 'hover:shadow-cannabis-500/20'}`}
             >
               {isVariantOutOfStock ? 'Currently Unavailable' : 'Add to Stash'}
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};