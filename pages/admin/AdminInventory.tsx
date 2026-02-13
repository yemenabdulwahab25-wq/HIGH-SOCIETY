
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Sparkles, Save, X, Wand2, RotateCcw, Plus, Check, Trash2, ScanLine, Star, Cloud, Leaf } from 'lucide-react';
import { storage } from '../../services/storage';
import { Category, StrainType, Product, ProductWeight, ProductType } from '../../types';
import { generateDescription, analyzeImage, removeBackground } from '../../services/gemini';
import { Button } from '../../components/ui/Button';

// Default Form State
const INITIAL_FORM: Product = {
  id: '',
  productType: 'Cannabis',
  category: Category.FLOWER,
  brand: '',
  flavor: '',
  strain: StrainType.HYBRID,
  thcPercentage: 20,
  puffCount: 5000,
  stock: 0,
  imageUrl: '',
  description: '',
  isFeatured: false,
  isPublished: true,
  weights: [
    { label: '3.5g', price: 40, weightGrams: 3.5, stock: 10 },
  ]
};

export const AdminInventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProductType>('Cannabis');
  const [form, setForm] = useState<Product>(INITIAL_FORM);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Custom Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Custom Brand State
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = () => {
        setProducts(storage.getProducts());
        setCategories(storage.getCategories());
        setBrands(storage.getBrands());
    };
    load();

    window.addEventListener('hs_storage_update', load);
    window.addEventListener('storage', load);

    const draft = localStorage.getItem('hs_product_draft');
    if (draft) {
        // setForm(JSON.parse(draft)); // Disabling auto-restore for now to prevent type conflicts
    }
    
    return () => {
        window.removeEventListener('hs_storage_update', load);
        window.removeEventListener('storage', load);
    };
  }, []);

  // Sync Form Type with Tab
  useEffect(() => {
    // When switching tabs, reset defaults appropriate for that type if form is clean
    if (!form.id) {
        setForm(prev => ({
            ...prev,
            productType: activeTab,
            category: activeTab === 'Vape' ? 'Vape' : Category.FLOWER,
            weights: activeTab === 'Vape' ? [{ label: '1pc', price: 20, weightGrams: 0, stock: 50 }] : prev.weights
        }));
    }
  }, [activeTab]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleWeightChange = (index: number, field: keyof ProductWeight, value: any) => {
    const newWeights = [...form.weights];
    newWeights[index] = { ...newWeights[index], [field]: value };
    setForm(prev => ({ ...prev, weights: newWeights }));
  };

  const handleAddWeight = () => {
    setForm(prev => ({
        ...prev,
        weights: [...prev.weights, { label: '', price: 0, weightGrams: 0, stock: 0 }]
    }));
  };

  const handleRemoveWeight = (index: number) => {
      if (form.weights.length > 1) {
          setForm(prev => ({
              ...prev,
              weights: prev.weights.filter((_, i) => i !== index)
          }));
      }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
        const trimmed = newCategoryName.trim();
        storage.saveCategory(trimmed);
        handleChange('category', trimmed);
        setNewCategoryName('');
        setIsAddingCategory(false);
    }
  };

  const handleAddBrand = () => {
    if (newBrandName.trim()) {
        const trimmed = newBrandName.trim();
        storage.saveBrand(trimmed);
        handleChange('brand', trimmed);
        setNewBrandName('');
        setIsAddingBrand(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        handleChange('imageUrl', base64);
        performImageScan(base64);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const performImageScan = async (base64Image: string) => {
      setAnalyzingImage(true);
      // Pass the active product type to the AI for context
      const analysis = await analyzeImage(base64Image, activeTab);
      setAnalyzingImage(false);

      if (analysis) {
        setForm(prev => ({
            ...prev,
            imageUrl: base64Image,
            brand: analysis.brand || prev.brand,
            flavor: analysis.flavor || prev.flavor,
            // Conditionally update fields based on type
            strain: activeTab === 'Cannabis' ? ((analysis.strain as StrainType) || prev.strain) : prev.strain,
            thcPercentage: activeTab === 'Cannabis' ? (analysis.thcPercentage || prev.thcPercentage) : prev.thcPercentage,
            puffCount: activeTab === 'Vape' ? (analysis.puffCount || prev.puffCount) : prev.puffCount,
        }));
      }
  };

  const handleManualScan = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (form.imageUrl) {
          performImageScan(form.imageUrl);
      }
  };

  const handleRemoveBg = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!form.imageUrl) return;
      
      setRemovingBg(true);
      const newImage = await removeBackground(form.imageUrl);
      setRemovingBg(false);
      
      if (newImage) {
          handleChange('imageUrl', newImage);
      } else {
          alert("Could not process image background. Try again.");
      }
  };

  const handleGenerateDescription = async () => {
    setLoadingAI(true);
    // Pass type to generator
    const desc = await generateDescription(
        form.brand, 
        form.flavor, 
        activeTab === 'Vape' ? (form.puffCount + ' Puffs') : (form.strain || 'Hybrid'), 
        activeTab
    );
    handleChange('description', desc);
    setLoadingAI(false);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the form?")) {
      setForm({ ...INITIAL_FORM, id: '', productType: activeTab });
    }
  };

  const handleSave = () => {
    if (!form.brand || !form.flavor) {
        alert("Brand and Flavor are required.");
        return;
    }
    const totalStock = form.weights.reduce((acc, w) => acc + (Number(w.stock) || 0), 0);
    const newProduct: Product = {
        ...form,
        id: form.id || Math.random().toString(36).substr(2, 9),
        stock: totalStock,
        isPublished: true,
        productType: activeTab // Ensure correct type
    };
    storage.saveProduct(newProduct);
    localStorage.removeItem('hs_product_draft');
    setForm({ ...INITIAL_FORM, id: '', productType: activeTab }); 
    alert("Product Saved Successfully!");
  };

  const handleEdit = (p: Product) => {
      setActiveTab(p.productType);
      setForm(p);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Inventory Master</h1>
          <div className="flex bg-dark-800 rounded-lg p-1 border border-gray-700">
             <button 
                onClick={() => setActiveTab('Cannabis')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'Cannabis' ? 'bg-cannabis-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
                 <Leaf className="w-4 h-4" /> Cannabis
             </button>
             <button 
                onClick={() => setActiveTab('Vape')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'Vape' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
                 <Cloud className="w-4 h-4" /> Vapes
             </button>
          </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: THE FORM */}
        <div className={`p-6 rounded-2xl border transition-colors space-y-6 ${activeTab === 'Vape' ? 'bg-dark-800 border-blue-900/30' : 'bg-dark-800 border-gray-700'}`}>
          <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${activeTab === 'Vape' ? 'text-blue-400' : 'text-cannabis-400'}`}>
                  {form.id ? 'Edit' : 'Add'} {activeTab} Product
              </h2>
              <button 
                onClick={() => handleChange('isFeatured', !form.isFeatured)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${form.isFeatured ? 'bg-gold-500/20 text-gold-400 border-gold-500' : 'bg-dark-900 border-gray-700 text-gray-500 hover:text-gray-300'}`}
              >
                  <Star className={`w-4 h-4 ${form.isFeatured ? 'fill-gold-400' : ''}`} />
                  <span className="text-sm font-bold">Feature</span>
              </button>
          </div>
          
          {/* Image & Scan */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Product Photo</label>
            <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-64 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${activeTab === 'Vape' ? 'border-blue-700 hover:border-blue-500 hover:bg-blue-900/10' : 'border-gray-600 hover:border-cannabis-500 hover:bg-dark-700'}`}
            >
                {form.imageUrl ? (
                    <>
                        <img src={form.imageUrl} className="w-full h-full object-contain bg-dark-950" alt="Preview" />
                         <div className="absolute top-3 right-3 flex flex-col gap-2 z-30" onClick={(e) => e.stopPropagation()}>
                             <button
                                onClick={handleManualScan}
                                disabled={analyzingImage}
                                className="flex items-center gap-1.5 bg-dark-900/90 hover:bg-dark-800 text-white text-xs font-medium py-1.5 px-3 rounded-lg border border-gray-600 backdrop-blur-md transition-all shadow-xl"
                            >
                                <ScanLine className={`w-3.5 h-3.5 ${analyzingImage ? 'animate-pulse text-cannabis-400' : 'text-cannabis-500'}`} />
                                {analyzingImage ? 'Scanning...' : 'AI Scan'}
                            </button>
                             <button
                                onClick={handleRemoveBg}
                                disabled={removingBg}
                                className="flex items-center gap-1.5 bg-dark-900/90 hover:bg-dark-800 text-white text-xs font-medium py-1.5 px-3 rounded-lg border border-gray-600 backdrop-blur-md transition-all shadow-xl"
                            >
                                <Wand2 className={`w-3.5 h-3.5 ${removingBg ? 'animate-spin text-gray-400' : 'text-blue-400'}`} />
                                {removingBg ? 'Fixing...' : 'Remove BG'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <Camera className="w-10 h-10 text-gray-500 mb-2" />
                        <span className="text-gray-400">Tap to Capture / Upload</span>
                        <span className={`text-xs font-bold mt-1 flex items-center gap-1 ${activeTab === 'Vape' ? 'text-blue-400' : 'text-cannabis-500'}`}>
                            <Sparkles className="w-3 h-3" /> Auto-Scan Enabled
                        </span>
                    </>
                )}
                
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleImageUpload}
                />
            </div>
          </div>

          {/* Core Fields - Dynamic based on Type */}
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <div className="flex gap-2">
                    {!isAddingCategory ? (
                        <>
                            <select 
                                value={form.category}
                                onChange={e => handleChange('category', e.target.value)}
                                className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                {activeTab === 'Vape' && <option value="Vape">Vape (General)</option>}
                                {activeTab === 'Vape' && <option value="Pod">Pod System</option>}
                            </select>
                            <button onClick={() => setIsAddingCategory(true)} className="p-2.5 bg-dark-800 border border-gray-700 rounded-lg hover:bg-dark-700 text-gray-300">
                                <Plus className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New Cat" className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white" autoFocus />
                            <button onClick={handleAddCategory} className="p-2.5 bg-cannabis-600 rounded-lg text-white"><Check className="w-5 h-5" /></button>
                            <button onClick={() => setIsAddingCategory(false)} className="p-2.5 bg-dark-800 border border-gray-700 rounded-lg text-gray-300"><X className="w-5 h-5" /></button>
                        </>
                    )}
                  </div>
              </div>
              <div>
                  <label className="block text-sm text-gray-400 mb-1">Brand</label>
                  <div className="flex gap-2">
                    {!isAddingBrand ? (
                        <>
                            <select value={form.brand} onChange={e => handleChange('brand', e.target.value)} className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white">
                                <option value="">Select Brand...</option>
                                {brands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <button onClick={() => setIsAddingBrand(true)} className="p-2.5 bg-dark-800 border border-gray-700 rounded-lg hover:bg-dark-700 text-gray-300"><Plus className="w-5 h-5" /></button>
                        </>
                    ) : (
                        <>
                            <input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="New Brand" className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white" autoFocus />
                            <button onClick={handleAddBrand} className="p-2.5 bg-cannabis-600 rounded-lg text-white"><Check className="w-5 h-5" /></button>
                            <button onClick={() => setIsAddingBrand(false)} className="p-2.5 bg-dark-800 border border-gray-700 rounded-lg text-gray-300"><X className="w-5 h-5" /></button>
                        </>
                    )}
                  </div>
              </div>
          </div>

          <div>
              <label className="block text-sm text-gray-400 mb-1">Flavor Name</label>
              <input 
                type="text" 
                value={form.flavor}
                onChange={e => handleChange('flavor', e.target.value)}
                className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white"
                placeholder={activeTab === 'Vape' ? "e.g. Blue Razz Ice" : "e.g. Purple Haze"}
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
              {activeTab === 'Cannabis' ? (
                  <>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Strain Type</label>
                        <select 
                            value={form.strain}
                            onChange={e => handleChange('strain', e.target.value)}
                            className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white"
                        >
                            {Object.values(StrainType).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">THC %</label>
                        <input 
                            type="number" 
                            value={form.thcPercentage}
                            onChange={e => handleChange('thcPercentage', Number(e.target.value))}
                            className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white"
                        />
                    </div>
                  </>
              ) : (
                  <>
                    <div>
                         <label className="block text-sm text-gray-400 mb-1">Puff Count</label>
                         <input 
                            type="number" 
                            value={form.puffCount}
                            onChange={e => handleChange('puffCount', Number(e.target.value))}
                            className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white"
                            placeholder="e.g. 5000"
                        />
                    </div>
                    <div>
                         <label className="block text-sm text-gray-400 mb-1">Nicotine % (Optional)</label>
                         <input 
                            type="number" 
                            disabled
                            placeholder="5% (Standard)"
                            className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-gray-500 cursor-not-allowed"
                        />
                    </div>
                  </>
              )}
          </div>

          {/* Pricing Weights */}
          <div className="bg-dark-900/50 p-4 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-300">Product Variants</label>
                  <span className="text-xs text-gray-500">Manage price & stock per size</span>
              </div>
              
              <div className="space-y-2">
                {form.weights.map((w, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-0.5 block">Variation / Size</label>
                            <input 
                                className="w-full bg-dark-800 border border-gray-700 rounded-lg p-2 text-white text-sm placeholder-gray-600"
                                value={w.label}
                                onChange={e => handleWeightChange(idx, 'label', e.target.value)}
                                placeholder={activeTab === 'Vape' ? "e.g. 1pc" : "e.g. 3.5g"}
                            />
                        </div>
                        <div className="w-24">
                             <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-0.5 block">Price ($)</label>
                             <input 
                                type="number"
                                className="w-full bg-dark-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                                value={w.price}
                                onChange={e => handleWeightChange(idx, 'price', Number(e.target.value))}
                            />
                        </div>
                        <div className="w-20">
                             <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-0.5 block">Stock</label>
                             <input 
                                type="number"
                                className="w-full bg-dark-800 border border-gray-700 rounded-lg p-2 text-white text-sm"
                                value={w.stock}
                                onChange={e => handleWeightChange(idx, 'stock', Number(e.target.value))}
                            />
                        </div>
                        <div className="pt-6">
                            <button 
                                onClick={() => handleRemoveWeight(idx)}
                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                disabled={form.weights.length <= 1}
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
              </div>
              
              <button 
                onClick={handleAddWeight}
                className={`mt-4 flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'Vape' ? 'text-blue-400' : 'text-cannabis-500'}`}
              >
                  <Plus className="w-4 h-4" /> Add Variation
              </button>
          </div>

          {/* AI Description */}
          <div>
             <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-gray-400">Description</label>
                <button 
                    onClick={handleGenerateDescription}
                    disabled={!form.brand || !form.flavor}
                    className={`text-xs flex items-center gap-1 disabled:opacity-50 ${activeTab === 'Vape' ? 'text-blue-400 hover:text-blue-300' : 'text-cannabis-400 hover:text-cannabis-300'}`}
                >
                    <Sparkles className="w-3 h-3" /> Generate with AI
                </button>
             </div>
             <textarea 
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white h-24"
                placeholder={loadingAI ? "AI is writing..." : "Product description..."}
             />
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={handleClear} className="w-1/3">
              <RotateCcw className="w-4 h-4 mr-2" /> Clear
            </Button>
            <Button fullWidth size="lg" onClick={handleSave} className={`flex-1 ${activeTab === 'Vape' ? 'bg-blue-600 hover:bg-blue-500' : ''}`}>
                <Save className="w-5 h-5 mr-2" /> Save {activeTab}
            </Button>
          </div>

        </div>

        {/* RIGHT COLUMN: LIST VIEW (Bulk) */}
        <div className="bg-dark-800 p-6 rounded-2xl border border-gray-700 h-fit">
            <h2 className="text-xl font-bold text-white mb-4">Current {activeTab} Inventory</h2>
            <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
                {products.filter(p => p.productType === activeTab).map(p => (
                    <div key={p.id} className="flex items-center gap-3 bg-dark-900 p-3 rounded-lg border border-gray-800 hover:border-gray-600 cursor-pointer" onClick={() => handleEdit(p)}>
                        <img src={p.imageUrl} className="w-10 h-10 rounded object-cover bg-white" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="font-bold text-white truncate">{p.flavor}</div>
                                {p.isFeatured && <Star className="w-3 h-3 fill-gold-400 text-gold-400" />}
                            </div>
                            <div className="text-xs text-gray-500 flex gap-1">
                                <span>{p.brand}</span>
                                <span>•</span>
                                <span>{p.productType === 'Vape' ? `${p.puffCount} puffs` : p.category}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="font-bold text-white">${p.weights[0].price}</div>
                             <div className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1
                                ${p.stock === 0 ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 
                                  p.stock < 10 ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30' : 
                                  'bg-green-900/30 text-green-400 border border-green-500/30'}`}>
                                {p.stock === 0 ? 'Sold Out' : `${p.stock} Left`}
                             </div>
                        </div>
                    </div>
                ))}
                {products.filter(p => p.productType === activeTab).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No {activeTab} products found.</p>
                        <p className="text-xs">Add your first one to the left.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
