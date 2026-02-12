
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Share2, Sparkles } from 'lucide-react';
import { storage } from '../services/storage';
import { Product, StoreSettings, Category } from '../types';
import { FeaturedCarousel } from '../components/FeaturedCarousel';

interface StorefrontProps {
  settings: StoreSettings;
}

// Helper for Luxury Category Styling
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Flower': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Pre-Roll': return 'bg-lime-500/10 text-lime-400 border-lime-500/20';
    case 'Edible': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'Disposable':
    case 'Cartridge': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'Concentrate': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'Accessory': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    default: return 'bg-gray-800 text-gray-400 border-gray-700';
  }
};

export const Storefront: React.FC<StorefrontProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');

  useEffect(() => {
    const load = () => {
        const allProducts = storage.getProducts().filter(p => p.isPublished);
        setProducts(allProducts);
        setCategories(['All', ...storage.getCategories()]);
        setBrands(['All', ...storage.getBrands()]);
    };

    load();
    window.addEventListener('hs_storage_update', load);
    window.addEventListener('storage', load);
    const interval = setInterval(load, 2000);
    return () => {
        window.removeEventListener('hs_storage_update', load);
        window.removeEventListener('storage', load);
        clearInterval(interval);
    };
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.flavor.toLowerCase().includes(search.toLowerCase()) || 
                          p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const featuredProducts = products.filter(p => p.isFeatured);

  const handleShare = () => {
    const shareData = {
      title: settings.storeName,
      text: `Check out ${settings.storeName} - Premium Cannabis Delivery`,
      url: window.location.origin + window.location.pathname
    };
    if (navigator.share) {
      navigator.share(shareData).catch((err) => console.log('Share dismissed', err));
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('Store link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Hero / Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-950 to-black p-8 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cannabis-900/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
                <div className="hidden md:block w-24 h-24 relative flex-shrink-0 group">
                    <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
                    <img src="/logo.png" alt={settings.storeName} className="w-full h-full object-contain drop-shadow-2xl relative z-10 transform transition-transform group-hover:scale-105" />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-yellow-200">{settings.storeName}</span>
                    </h1>
                    <p className="text-gray-400 font-light text-lg">Elevate your lifestyle. Premium selection only.</p>
                </div>
            </div>
            <button 
                onClick={handleShare}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gold-400 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10 transition-all hover:scale-105 hover:border-gold-500/30 hover:shadow-[0_0_15px_rgba(251,191,36,0.1)] whitespace-nowrap"
            >
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Share Store</span>
            </button>
        </div>
      </div>

      {/* Featured Carousel */}
      {featuredProducts.length > 0 && (
          <FeaturedCarousel products={featuredProducts} />
      )}

      {/* Sticky Search & Filter */}
      <div className="sticky top-16 z-40 bg-dark-950/95 backdrop-blur-xl py-4 space-y-4 -mx-4 px-4 border-b border-gray-800/50">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold-400 transition-colors w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search flavor, brand, or strain..."
            className="w-full bg-dark-900 border border-gray-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 focus:outline-none transition-all shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* Categories Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
                <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                    isSelected
                    ? 'bg-gradient-to-r from-gold-400 to-yellow-500 text-black border-gold-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-105' 
                    : `${cat === 'All' ? 'bg-dark-800 border-gray-700' : getCategoryColor(cat)} hover:brightness-125 opacity-80 hover:opacity-100 hover:scale-105`
                }`}
                >
                {cat}
                </button>
            );
          })}
        </div>
        
        {/* Brand Chips */}
        {brands.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {brands.map(brand => (
                <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
                    selectedBrand === brand 
                    ? 'border-cannabis-500 text-cannabis-400 bg-cannabis-500/10' 
                    : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                    }`}
                >
                    {brand}
                </button>
                ))}
            </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {filteredProducts.map(product => (
          <Link to={`/product/${product.id}`} key={product.id} className="group block bg-dark-900 rounded-2xl overflow-hidden border border-gray-800/50 hover:border-gold-500/30 hover:shadow-[0_0_20px_rgba(251,191,36,0.05)] transition-all duration-300 relative">
            
            {/* Image Area */}
            <div className="aspect-square relative bg-white/5 p-4 group-hover:bg-white/10 transition-colors">
              <img src={product.imageUrl} alt={product.flavor} className="w-full h-full object-contain drop-shadow-xl transform group-hover:scale-110 transition-transform duration-500" />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                 <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${getCategoryColor(product.category)}`}>
                    {product.category}
                 </span>
                 {product.isFeatured && (
                     <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gold-500/20 text-gold-400 border border-gold-500/30 backdrop-blur-md flex items-center gap-1">
                        <Sparkles className="w-2 h-2" /> Featured
                     </span>
                 )}
                 {product.stock > 0 && product.stock < 5 && (
                     <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 backdrop-blur-md">
                        Low Stock
                     </span>
                 )}
              </div>

              {product.stock === 0 && (
                <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <div className="border border-red-500/50 bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold uppercase tracking-widest transform -rotate-12">
                    Sold Out
                  </div>
                </div>
              )}
            </div>

            {/* Info Area */}
            <div className="p-4 relative">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex justify-between items-center">
                  <span className="text-gold-500/80">{product.brand}</span>
                  <div className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-cannabis-500" />
                      <span className="text-gray-400">{product.thcPercentage}%</span>
                  </div>
              </div>
              
              <h3 className="text-white font-bold text-base leading-tight mb-3 line-clamp-2 group-hover:text-gold-400 transition-colors">
                  {product.flavor}
              </h3>
              
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                  product.strain === 'Indica' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  product.strain === 'Sativa' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                    {product.strain}
                </span>
              </div>

              <div className="flex items-end justify-between border-t border-gray-800 pt-3">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase">Starting at</span>
                    <span className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">${product.weights[0].price}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-gray-400 group-hover:bg-gold-500 group-hover:text-black transition-all">
                    <span className="text-xl leading-none mb-0.5">+</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-24">
            <div className="w-20 h-20 bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
                <Search className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};
