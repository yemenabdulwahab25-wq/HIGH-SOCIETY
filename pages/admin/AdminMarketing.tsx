
import React, { useState, useEffect } from 'react';
import { storage } from '../../services/storage';
import { Product } from '../../types';
import { generateProductSEO, generateAdCopy } from '../../services/gemini';
import { Search, BarChart3, Wand2, Globe, Facebook, Instagram, Mail, Megaphone, Copy, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AdminMarketing: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // SEO State
  const [seoGenerating, setSeoGenerating] = useState<string | null>(null); // ID of product being processed
  
  // Ad Generator State
  const [adPlatform, setAdPlatform] = useState<'Google' | 'Facebook' | 'Instagram' | 'Email'>('Google');
  const [adCopy, setAdCopy] = useState('');
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);

  useEffect(() => {
    loadProducts();
    window.addEventListener('hs_storage_update', loadProducts);
    return () => window.removeEventListener('hs_storage_update', loadProducts);
  }, []);

  const loadProducts = () => {
    setProducts(storage.getProducts());
  };

  const handleOptimizeSEO = async (product: Product) => {
    setSeoGenerating(product.id);
    const seoData = await generateProductSEO(product);
    
    if (seoData) {
        const updatedProduct: Product = {
            ...product,
            seo: seoData
        };
        storage.saveProduct(updatedProduct);
    }
    setSeoGenerating(null);
  };

  const handleGenerateAd = async () => {
    if (!selectedProduct) return;
    setIsGeneratingAd(true);
    const copy = await generateAdCopy(selectedProduct, adPlatform);
    setAdCopy(copy);
    setIsGeneratingAd(false);
  };

  // SEO Health Check Logic
  const needsSEO = products.filter(p => !p.seo).length;
  const goodSEO = products.filter(p => p.seo).length;
  const healthScore = Math.round((goodSEO / products.length) * 100) || 0;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white">Marketing Suite</h1>
            <p className="text-gray-400">AI-powered traffic optimization and ad creation.</p>
        </div>
        <div className="bg-dark-800 px-4 py-2 rounded-xl border border-gray-700 flex items-center gap-3">
             <div className="text-right">
                 <div className="text-xs text-gray-500 uppercase font-bold">SEO Health</div>
                 <div className={`text-xl font-bold ${healthScore > 80 ? 'text-green-400' : healthScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                     {healthScore}%
                 </div>
             </div>
             <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center">
                 <BarChart3 className="w-5 h-5 text-cannabis-500" />
             </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* LEFT: SEO OPTIMIZATION */}
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" /> Search Engine Optimization
            </h2>
            
            <div className="bg-dark-800 rounded-2xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 bg-dark-900/50 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-300">Inventory Status</span>
                    {needsSEO > 0 && (
                        <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {needsSEO} products need optimization
                        </span>
                    )}
                </div>
                
                <div className="max-h-[600px] overflow-y-auto">
                    {products.map(product => (
                        <div key={product.id} className="p-4 border-b border-gray-800 hover:bg-dark-700/50 transition-colors flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <img src={product.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-dark-900" />
                                <div className="min-w-0">
                                    <div className="font-bold text-white truncate text-sm">{product.flavor}</div>
                                    <div className="text-xs text-gray-500 truncate">{product.brand}</div>
                                </div>
                            </div>

                            {product.seo ? (
                                <div className="flex items-center gap-2">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-[10px] text-green-400 font-bold uppercase">Optimized</div>
                                        <div className="text-[10px] text-gray-500 max-w-[150px] truncate">{product.seo.keywords.join(', ')}</div>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                            ) : (
                                <Button 
                                    size="sm" 
                                    onClick={() => handleOptimizeSEO(product)}
                                    disabled={seoGenerating === product.id}
                                    className="bg-blue-600 hover:bg-blue-500 text-xs"
                                >
                                    {seoGenerating === product.id ? (
                                        <Wand2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Wand2 className="w-3 h-3 mr-1" /> Optimize
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT: AD GENERATOR */}
        <div className="space-y-6">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-cannabis-500" /> Ad Campaign Generator
            </h2>

            <div className="bg-dark-800 rounded-2xl border border-gray-700 p-6 space-y-6">
                <div>
                    <label className="text-sm font-bold text-gray-400 mb-2 block">1. Select Product</label>
                    <select 
                        className="w-full bg-dark-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-cannabis-500"
                        onChange={(e) => setSelectedProduct(products.find(p => p.id === e.target.value) || null)}
                        value={selectedProduct?.id || ''}
                    >
                        <option value="">-- Choose a Product to Promote --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.brand} - {p.flavor}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-bold text-gray-400 mb-2 block">2. Select Platform</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button 
                            onClick={() => setAdPlatform('Google')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${adPlatform === 'Google' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-dark-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                        >
                            <Globe className="w-5 h-5" /> <span className="text-xs font-bold">Google</span>
                        </button>
                        <button 
                            onClick={() => setAdPlatform('Facebook')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${adPlatform === 'Facebook' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-dark-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                        >
                            <Facebook className="w-5 h-5" /> <span className="text-xs font-bold">Facebook</span>
                        </button>
                        <button 
                            onClick={() => setAdPlatform('Instagram')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${adPlatform === 'Instagram' ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-dark-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                        >
                            <Instagram className="w-5 h-5" /> <span className="text-xs font-bold">Insta</span>
                        </button>
                        <button 
                            onClick={() => setAdPlatform('Email')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${adPlatform === 'Email' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-dark-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                        >
                            <Mail className="w-5 h-5" /> <span className="text-xs font-bold">Email</span>
                        </button>
                    </div>
                </div>

                <Button 
                    fullWidth 
                    size="lg" 
                    disabled={!selectedProduct || isGeneratingAd}
                    onClick={handleGenerateAd}
                >
                    {isGeneratingAd ? (
                        <>Generating Creative...</>
                    ) : (
                        <>
                            Generate Ad Copy <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>

                {adCopy && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 pt-4 border-t border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-gray-300">Generated Creative</span>
                            <button 
                                onClick={() => { navigator.clipboard.writeText(adCopy); alert('Copied!'); }}
                                className="text-xs flex items-center gap-1 text-cannabis-400 hover:text-cannabis-300"
                            >
                                <Copy className="w-3 h-3" /> Copy
                            </button>
                        </div>
                        <div className="bg-dark-950 p-4 rounded-xl border border-gray-800 font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {adCopy}
                        </div>
                    </div>
                )}
            </div>

            {selectedProduct && selectedProduct.seo && (
                 <div className="bg-dark-800 rounded-2xl border border-gray-700 p-6">
                     <h3 className="font-bold text-white mb-3">Audience Insights (Derived from SEO)</h3>
                     <div className="flex flex-wrap gap-2">
                         {selectedProduct.seo.keywords.map(kw => (
                             <span key={kw} className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-xs border border-gray-600">
                                 {kw}
                             </span>
                         ))}
                     </div>
                 </div>
            )}
        </div>

      </div>
    </div>
  );
};
