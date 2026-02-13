
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Sparkles, Save, X, Wand2, RotateCcw, Plus, Check, Trash2, ScanLine, Star, Cloud, Leaf, Search, ArrowRightLeft, Mail, Send } from 'lucide-react';
import { storage } from '../../services/storage';
import { Category, StrainType, Product, ProductWeight, ProductType } from '../../types';
import { generateDescription, analyzeImage, removeBackground, generateMarketingEmail } from '../../services/gemini';
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

const SUGGESTED_VARIANTS = {
    Cannabis: ['1g', '3.5g', '7g', '14g', '28g (1oz)', 'Pre-Roll', '5-Pack', 'Edible Pack'],
    Vape: ['Single Unit', '5-Pack', '10-Pack Box', 'Master Case']
};

export const AdminInventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProductType>('Cannabis'); // Controls List View
  const [form, setForm] = useState<Product>(INITIAL_FORM); // Controls Form Data
  const [brands, setBrands] = useState<string[]>([]);
  const [brandLogos, setBrandLogos] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  
  // Custom Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Custom Brand State
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  
  // Marketing / Notifications
  const [notifyCustomers, setNotifyCustomers] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{isOpen: boolean, subject: string, body: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = () => {
        setProducts(storage.getProducts());
        setCategories(storage.getCategories());
        setBrands(storage.getBrands());
        setBrandLogos(storage.getBrandLogos());
        const settings = storage.getSettings();
        setLowStockThreshold(settings.inventory.lowStockThreshold);
    };
    load();

    window.addEventListener('hs_storage_update', load);
    window.addEventListener('storage', load);

    return () => {
        window.removeEventListener('hs_storage_update', load);
        window.removeEventListener('storage', load);
    };
  }, []);

  // Sync Form Defaults when switching List Tabs (Only if adding new)
  useEffect(() => {
    if (!form.id) {
        setForm(prev => ({
            ...prev,
            productType: activeTab,
            category: activeTab === 'Vape' ? 'Vape' : Category.FLOWER,
            weights: activeTab === 'Vape' ? [{ label: 'Single Unit', price: 20, weightGrams: 0, stock: 50 }] : INITIAL_FORM.weights
        }));
    }
  }, [activeTab]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: ProductType) => {
      // When manually changing type in form, update form and list context
      setActiveTab(type);
      setForm(prev => ({
          ...prev,
          productType: type,
          // Reset relevant fields for the new type
          category: type === 'Vape' ? 'Vape' : Category.FLOWER,
          weights: type === 'Vape' ? [{ label: 'Single Unit', price: 20, weightGrams: 0, stock: 50 }] : INITIAL_FORM.weights
      }));
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

  const handleQuickAddVariant = (label: string) => {
      // If the last variant is empty (default state), replace it. Otherwise add new.
      const lastVariant = form.weights[form.weights.length - 1];
      const isLastEmpty = lastVariant && lastVariant.label === '' && lastVariant.price === 0;

      if (isLastEmpty && form.weights.length === 1) {
          setForm(prev => ({
              ...prev,
              weights: [{ label, price: 0, weightGrams: 0, stock: 0 }]
          }));
      } else {
           setForm(prev => ({
              ...prev,
              weights: [...prev.weights, { label, price: 0, weightGrams: 0, stock: 0 }]
          }));
      }
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

  const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && form.brand) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              storage.saveBrandLogo(form.brand, base64);
          };
          reader.readAsDataURL(file);
      }
  };

  const performImageScan = async (base64Image: string) => {
      setAnalyzingImage(true);
      // STRICTLY use form.productType to ensure the AI knows what it's looking for
      const analysis = await analyzeImage(base64Image, form.productType);
      setAnalyzingImage(false);

      if (analysis) {
        setForm(prev => ({
            ...prev,
            imageUrl: base64Image,
            brand: analysis.brand || prev.brand,
            flavor: analysis.flavor || prev.flavor,
            // Conditionally update fields based on form type
            strain: form.productType === 'Cannabis' ? ((analysis.strain as StrainType) || prev.strain) : prev.strain,
            thcPercentage: form.productType === 'Cannabis' ? (analysis.thcPercentage || prev.thcPercentage) : prev.thcPercentage,
            puffCount: form.productType === 'Vape' ? (analysis.puffCount || prev.puffCount) : prev.puffCount,
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
    // STRICTLY use form.productType to generate relevant copy
    const desc = await generateDescription(
        form.brand, 
        form.flavor, 
        form.productType === 'Vape' ? (form.puffCount + ' Puffs') : (form.strain || 'Hybrid'), 
        form.productType
    );
    handleChange('description', desc);
    setLoadingAI(false);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the form?")) {
      setForm({ ...INITIAL_FORM, id: '', productType: activeTab });
      setNotifyCustomers(false);
    }
  };

  const handleSave = async () => {
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
        // Product Type is already in form state
    };
    
    storage.saveProduct(newProduct);
    localStorage.removeItem('hs_product_draft');

    // Trigger Email Flow
    if (notifyCustomers) {
        const copy = await generateMarketingEmail('Product_Drop', newProduct);
        setEmailPreview({ isOpen: true, subject: copy.subject, body: copy.body });
    } else {
        // Just reset if no email needed
        setForm({ ...INITIAL_FORM, id: '', productType: activeTab }); 
        alert("Product Saved Successfully!");
    }
  };

  const handleSendEmailBlast = () => {
      if (!emailPreview) return;
      
      const emails = storage.getCustomerEmails();
      if (emails.length === 0) {
          alert("No customer emails found in order history to send to.");
          setEmailPreview(null);
          setForm({ ...INITIAL_FORM, id: '', productType: activeTab });
          setNotifyCustomers(false);
          return;
      }

      // Simulate sending
      alert(`Email Blast Sent to ${emails.length} customers!\n\nSubject: ${emailPreview.subject}`);
      setEmailPreview(null);
      setForm({ ...INITIAL_FORM, id: '', productType: activeTab });
      setNotifyCustomers(false);
  };

  const handleEdit = (p: Product) => {
      setActiveTab(p.productType);
      setForm(p);
  };

  // Filter list based on tabs, but DO NOT affect the form rendering
  const filteredProducts = products.filter(p => 
      p.productType === activeTab && (
          p.flavor.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.brand.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const isVapeForm = form.productType === 'Vape';

  return (
    <div className="space-y-8 pb-20 relative">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Inventory Master</h1>
          
          {/* List Filter Tabs */}
          <div className="flex bg-dark-800 rounded-lg p-1 border border-gray-700">
             <button 
                onClick={() => setActiveTab('Cannabis')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'Cannabis' ? 'bg-cannabis-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
                 <Leaf className="w-4 h-4" /> Cannabis List
             </button>
             <button 
                onClick={() => setActiveTab('Vape')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'Vape' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
                 <Cloud className="w-4 h-4" /> Vape List
             </button>
          </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: THE FORM */}
        <div className={`p-6 rounded-2xl border transition-colors space-y-6 ${isVapeForm ? 'bg-dark-800 border-blue-900/30' : 'bg-dark-800 border-gray-700'}`}>
          
          <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                  <h2 className={`text-xl font-bold ${isVapeForm ? 'text-blue-400' : 'text-cannabis-400'}`}>
                      {form.id ? 'Edit Product' : 'Add Product'}
                  </h2>
                  
                  {/* Product Type Switcher - Edit Mode Enabled */}
                  <div className="flex items-center bg-dark-900 rounded-lg p-1 border border-gray-700">
                      <button 
                          onClick={() => handleTypeChange('Cannabis')}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${!isVapeForm ? 'bg-cannabis-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                          Flower
                      </button>
                      <button 
                          onClick={() => handleTypeChange('Vape')}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${isVapeForm ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                          Vape
                      </button>
                  </div>
              </div>

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
                className={`relative h-64 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${isVapeForm ? 'border-blue-700 hover:border-blue-500 hover:bg-blue-900/10' : 'border-gray-600 hover:border-cannabis-500 hover:bg-dark-700'}`}
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
                        <span className={`text-xs font-bold mt-1 flex items-center gap-1 ${isVapeForm ? 'text-blue-400' : 'text-cannabis-500'}`}>
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
                                {isVapeForm && <option value="Vape">Vape (General)</option>}
                                {isVapeForm && <option value="Pod">Pod System</option>}
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
                            <div className="relative flex-1">
                                <select 
                                    value={form.brand} 
                                    onChange={e => handleChange('brand', e.target.value)} 
                                    className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white appearance-none"
                                >
                                    <option value="">Select Brand...</option>
                                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>

                            {/* Brand Logo Uploader */}
                            <div 
                                onClick={() => form.brand && brandLogoInputRef.current?.click()}
                                className={`w-11 h-11 rounded-lg border flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden transition-all ${form.brand ? 'bg-dark-800 border-gray-700 hover:border-gray-500 hover:bg-dark-700' : 'bg-dark-900 border-gray-800 opacity-50 cursor-not-allowed'}`}
                                title={form.brand ? "Upload Brand Logo" : "Select Brand First"}
                            >
                                {form.brand && brandLogos[form.brand] ? (
                                    <img src={brandLogos[form.brand]} alt="Brand Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={brandLogoInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleBrandLogoUpload} 
                                disabled={!form.brand}
                            />

                            <button onClick={() => setIsAddingBrand(true)} className="p-2.5 bg-dark-800 border border-gray-700 rounded-lg hover:bg-dark-700 text-gray-300">
                                <Plus className="w-5 h-5" />
                            </button>
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
                placeholder={isVapeForm ? "e.g. Blue Razz Ice" : "e.g. Purple Haze"}
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
              {/* CONDITIONAL RENDERING BASED ON FORM TYPE, NOT TAB */}
              {!isVapeForm ? (
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
                  <div className="col-span-2">
                       <label className="block text-sm text-gray-400 mb-1">Puff Count</label>
                       <input 
                          type="number" 
                          value={form.puffCount}
                          onChange={e => handleChange('puffCount', Number(e.target.value))}
                          className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white"
                          placeholder="e.g. 5000"
                      />
                  </div>
              )}
          </div>

          {/* Pricing Weights */}
          <div className="bg-dark-900/50 p-4 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-sm font-bold text-gray-300">Product Variants</label>
                    <div className="text-xs text-gray-500">Define sizes, packs, or unit types</div>
                  </div>
                  
                  {/* Quick Add Buttons */}
                  <div className="flex gap-2 flex-wrap justify-end">
                      {SUGGESTED_VARIANTS[form.productType].slice(0, 4).map(label => (
                         <button
                            key={label}
                            onClick={() => handleQuickAddVariant(label)}
                            className="text-[10px] bg-dark-800 hover:bg-dark-700 border border-gray-700 rounded px-2 py-1 text-gray-400 transition-colors whitespace-nowrap"
                         >
                            + {label}
                         </button>
                      ))}
                  </div>
              </div>
              
              <div className="space-y-3">
                {form.weights.map((w, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3 bg-dark-950/30 rounded-lg border border-gray-800/50">
                        <div className="flex-1">
                            <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-1 block">Label / Size</label>
                            <input 
                                className="w-full bg-dark-800 border border-gray-700 rounded-lg p-2 text-white text-sm placeholder-gray-600 focus:border-cannabis-500 focus:outline-none"
                                value={w.label}
                                onChange={e => handleWeightChange(idx, 'label', e.target.value)}
                                placeholder="e.g. 3.5g, Box, Single"
                            />
                        </div>
                        <div className="w-24">
                             <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-1 block">Price ($)</label>
                             <input 
                                type="number"
                                className="w-full bg-dark-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-cannabis-500 focus:outline-none"
                                value={w.price}
                                onChange={e => handleWeightChange(idx, 'price', Number(e.target.value))}
                            />
                        </div>
                        <div className="w-24">
                             <label className="text-[10px] text-gray-500 uppercase font-bold pl-1 mb-1 block">Stock</label>
                             <input 
                                type="number"
                                className="w-full bg-dark-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-cannabis-500 focus:outline-none"
                                value={w.stock}
                                onChange={e => handleWeightChange(idx, 'stock', Number(e.target.value))}
                            />
                        </div>
                        <div className="pt-7">
                            <button 
                                onClick={() => handleRemoveWeight(idx)}
                                className="p-1.5 text-gray-500 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-lg"
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
                className={`mt-4 w-full py-2 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all hover:border-gray-500 hover:bg-dark-800 ${isVapeForm ? 'text-blue-400' : 'text-cannabis-500'}`}
              >
                  <Plus className="w-4 h-4" /> Add Custom Variant
              </button>
          </div>

          {/* AI Description */}
          <div>
             <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-gray-400">Description</label>
                <button 
                    onClick={handleGenerateDescription}
                    disabled={!form.brand || !form.flavor}
                    className={`text-xs flex items-center gap-1 disabled:opacity-50 ${isVapeForm ? 'text-blue-400 hover:text-blue-300' : 'text-cannabis-400 hover:text-cannabis-300'}`}
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

          {/* NOTIFY CUSTOMERS TOGGLE */}
          <div className="bg-gradient-to-r from-cannabis-500/10 to-transparent p-4 rounded-xl border border-cannabis-500/20 flex items-center justify-between">
              <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-cannabis-400" /> Notify Customers
                  </h3>
                  <p className="text-xs text-gray-400">Send an AI-crafted email blast about this product.</p>
              </div>
              <button 
                onClick={() => setNotifyCustomers(!notifyCustomers)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifyCustomers ? 'bg-cannabis-500' : 'bg-gray-700'}`}
              >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifyCustomers ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={handleClear} className="w-1/3">
              <RotateCcw className="w-4 h-4 mr-2" /> Clear
            </Button>
            <Button fullWidth size="lg" onClick={handleSave} className={`flex-1 ${isVapeForm ? 'bg-blue-600 hover:bg-blue-500' : ''}`}>
                <Save className="w-5 h-5 mr-2" /> Save & {notifyCustomers ? 'Notify' : 'Finish'}
            </Button>
          </div>

        </div>

        {/* RIGHT COLUMN: LIST VIEW (Bulk) */}
        <div className="bg-dark-800 p-6 rounded-2xl border border-gray-700 h-fit">
            <h2 className="text-xl font-bold text-white mb-4">Current {activeTab} Inventory</h2>
            
            {/* Search Filter */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search brand or flavor..." 
                    className="w-full bg-dark-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-cannabis-500 focus:outline-none placeholder:text-gray-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
                {filteredProducts.map(p => (
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
                             <div className={`text-xs font-bold px-2 py-0.5 rounded border mt-1 inline-flex items-center gap-1
                                ${p.stock === 0 
                                    ? 'bg-red-900/20 text-red-400 border-red-500/30' 
                                    : p.stock <= lowStockThreshold 
                                        ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' 
                                        : 'bg-green-900/20 text-green-400 border-green-500/30'
                                }`}>
                                {p.stock === 0 ? 'Out of Stock' : p.stock <= lowStockThreshold ? 'Low Stock' : 'In Stock'}
                                <span className="opacity-70 ml-1">({p.stock})</span>
                             </div>
                        </div>
                    </div>
                ))}
                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No {activeTab} products found.</p>
                        <p className="text-xs">Add your first one to the left.</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* EMAIL PREVIEW MODAL */}
      {emailPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-dark-800 w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-dark-900/50">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <Mail className="w-5 h-5 text-cannabis-500" /> Review Email Blast
                      </h3>
                      <button onClick={() => { setEmailPreview(null); setNotifyCustomers(false); setForm({ ...INITIAL_FORM, id: '', productType: activeTab }); }} className="text-gray-500 hover:text-white">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-sm text-gray-400">
                          Product Saved! Review the automated email below before sending to {storage.getCustomerEmails().length} subscribers.
                      </p>
                      
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                          <div className="bg-dark-900 border border-gray-700 rounded-lg p-3 text-white text-sm font-medium">
                              {emailPreview.subject}
                          </div>
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Message Body</label>
                          <div className="bg-dark-900 border border-gray-700 rounded-lg p-3 text-gray-300 text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                              {emailPreview.body}
                          </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                          <Button 
                            variant="secondary" 
                            fullWidth 
                            onClick={() => { setEmailPreview(null); setNotifyCustomers(false); setForm({ ...INITIAL_FORM, id: '', productType: activeTab }); }}
                          >
                              Skip
                          </Button>
                          <Button fullWidth onClick={handleSendEmailBlast}>
                              <Send className="w-4 h-4 mr-2" /> Send to All
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
