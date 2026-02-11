import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { storage } from '../services/storage';
import { Product, StoreSettings, Category } from '../types';

interface StorefrontProps {
  settings: StoreSettings;
}

export const Storefront: React.FC<StorefrontProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');

  useEffect(() => {
    // Poll for updates (in a real app, use websockets or react-query)
    const load = () => {
        const allProducts = storage.getProducts().filter(p => p.isPublished);
        setProducts(allProducts);
    }
    load();
    const interval = setInterval(load, 2000); // Poll for admin updates
    return () => clearInterval(interval);
  }, []);

  const categories = ['All', ...Object.values(Category)];
  const brands = ['All', ...Array.from(new Set(products.map(p => p.brand)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.flavor.toLowerCase().includes(search.toLowerCase()) || 
                          p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Hero / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cannabis-900 to-dark-900 p-8 border border-white/5">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to {settings.storeName}</h1>
        <p className="text-gray-300">Elevate your experience. Premium selection only.</p>
      </div>

      {/* Search & Filter */}
      <div className="sticky top-16 z-40 bg-dark-950 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search flavor, brand, or strain..."
            className="w-full bg-dark-800 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-cannabis-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* Categories Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                ? 'bg-white text-dark-950' 
                : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Brand Chips if category selected */}
        {selectedCategory !== 'All' && (
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {brands.map(brand => (
               <button
                 key={brand}
                 onClick={() => setSelectedBrand(brand)}
                 className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                   selectedBrand === brand 
                   ? 'border-cannabis-500 text-cannabis-500' 
                   : 'border-gray-700 text-gray-500 hover:border-gray-500'
                 }`}
               >
                 {brand}
               </button>
             ))}
           </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <Link to={`/product/${product.id}`} key={product.id} className="group block bg-dark-800 rounded-xl overflow-hidden border border-gray-800 hover:border-cannabis-500/50 transition-all">
            <div className="aspect-square relative bg-white">
              <img src={product.imageUrl} alt={product.flavor} className="w-full h-full object-cover" />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">OUT OF STOCK</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="text-xs text-cannabis-500 font-bold uppercase tracking-wider mb-1">{product.brand}</div>
              <h3 className="text-white font-medium text-sm truncate">{product.flavor}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span className={`px-1.5 py-0.5 rounded ${
                  product.strain === 'Indica' ? 'bg-purple-500/20 text-purple-400' :
                  product.strain === 'Sativa' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-green-500/20 text-green-400'
                }`}>{product.strain}</span>
                <span>{product.thcPercentage}% THC</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-white font-bold">${product.weights[0].price}</span>
                {product.stock > 0 && <span className="text-xs text-gray-500">In Stock</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-20 text-gray-500">
            <p>No products found matching your search.</p>
        </div>
      )}
    </div>
  );
};