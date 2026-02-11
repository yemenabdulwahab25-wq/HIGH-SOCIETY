import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Sparkles, Save, X, Wand2, RotateCcw } from 'lucide-react';
import { storage } from '../../services/storage';
import { Category, StrainType, Product, ProductWeight } from '../../types';
import { generateDescription, analyzeImage, removeBackground } from '../../services/gemini';
import { Button } from '../../components/ui/Button';

// Default Form State
const INITIAL_FORM = {
  id: '',
  category: Category.FLOWER,
  brand: '',
  flavor: '',
  strain: StrainType.HYBRID,
  thcPercentage: 20,
  stock: 100,
  imageUrl: '',
  description: '',
  weights: [
    { label: '3.5g', price: 0, weightGrams: 3.5 },
    { label: '7g', price: 0, weightGrams: 7 }
  ]
};

export const AdminInventory: React.FC = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [brands, setBrands] = useState<string[]>(['MoonRocks', 'YumYum', 'Cloud9', 'Cookies', 'Jungle Boys']);
  const [loadingAI, setLoadingAI] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProducts(storage.getProducts());
    // Recover unsaved work
    const draft = localStorage.getItem('hs_product_draft');
    if (draft) {
        // Optional: restore draft prompt
        setForm(JSON.parse(draft));
    }
  }, []);

  // Autosave Draft
  useEffect(() => {
    localStorage.setItem('hs_product_draft', JSON.stringify(form));
  }, [form]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleWeightChange = (index: number, field: keyof ProductWeight, value: any) => {
    const newWeights = [...form.weights];
    newWeights[index] = { ...newWeights[index], [field]: value };
    setForm(prev => ({ ...prev, weights: newWeights }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // 1. Set Image immediately
        handleChange('imageUrl', base64);
        
        // 2. Trigger AI Analysis
        setAnalyzingImage(true);
        const analysis = await analyzeImage(base64);
        setAnalyzingImage(false);

        // 3. Populate fields if found
        setForm(prev => ({
            ...prev,
            imageUrl: base64, // Ensure image stays
            brand: analysis.brand || prev.brand,
            flavor: analysis.flavor || prev.flavor,
            strain: (analysis.strain as StrainType) || prev.strain,
            thcPercentage: analysis.thcPercentage || prev.thcPercentage
        }));
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBg = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent file input trigger
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
    const desc = await generateDescription(form.brand, form.flavor, form.strain);
    handleChange('description', desc);
    setLoadingAI(false);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the form? Unsaved changes will be lost.")) {
      setForm({ ...INITIAL_FORM, id: '' });
      localStorage.removeItem('hs_product_draft');
    }
  };

  const handleSave = () => {
    const newProduct: Product = {
        ...form,
        id: form.id || Math.random().toString(36).substr(2, 9),
        isPublished: true
    };
    storage.saveProduct(newProduct);
    localStorage.removeItem('hs_product_draft');
    setForm({ ...INITIAL_FORM, id: '' }); // Reset
    setProducts(storage.getProducts()); // Refresh list
    alert("Product Saved Successfully!");
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Inventory Master</h1>
          <div className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Autosave Active
          </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: THE FORM */}
        <div className="bg-dark-800 p-6 rounded-2xl border border-gray-700 space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Add / Edit Product</h2>
          
          {/* Image & Scan */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Product Photo</label>
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative h-64 w-full border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-cannabis-500 hover:bg-dark-700 transition-all overflow-hidden group"
            >
                {form.imageUrl ? (
                    <>
                        <img src={form.imageUrl} className="w-full h-full object-contain bg-dark-950" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-medium flex items-center gap-2"><Camera className="w-5 h-5"/> Change Photo</span>
                        </div>
                    </>
                ) : (
                    <>
                        <Camera className="w-10 h-10 text-gray-500 mb-2" />
                        <span className="text-gray-400">Tap to Capture / Upload</span>
                    </>
                )}
                
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" // Forces camera on mobile
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleImageUpload}
                />
                
                {analyzingImage && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                        <div className="text-cannabis-500 font-bold animate-pulse flex flex-col items-center">
                            <Sparkles className="w-8 h-8 mb-2 animate-spin" />
                            AI Scanning Info...
                        </div>
                    </div>
                )}

                {removingBg && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                         <div className="text-blue-400 font-bold animate-pulse flex flex-col items-center">
                            <Wand2 className="w-8 h-8 mb-2 animate-bounce" />
                            Removing Background...
                        </div>
                    </div>
                )}
            </div>
            
            {/* AI Tools Bar */}
            <div className="flex gap-2">
                {form.imageUrl && (
                    <button 
                        onClick={handleRemoveBg}
                        disabled={removingBg}
                        className="flex-1 bg-dark-700 border border-gray-600 hover:bg-dark-600 text-white text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Wand2 className="w-3 h-3 text-blue-400" />
                        {removingBg ? 'Processing...' : 'Remove Background (AI)'}
                    </button>
                )}
                {/* Placeholder for future tools */}
            </div>
          </div>

          {/* Core Fields */}
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select 
                    value={form.category}
                    onChange={e => handleChange('category', e.target.value)}
                    className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  >
                      {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-sm text-gray-400 mb-1">Brand</label>
                  <select 
                    value={form.brand}
                    onChange={e => handleChange('brand', e.target.value)}
                    className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white"
                  >
                      <option value="">Select Brand...</option>
                      {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {/* Assuming quick add brand logic exists or is just simple text input fallback */}
              </div>
          </div>

          <div>
              <label className="block text-sm text-gray-400 mb-1">Flavor Name</label>
              <input 
                type="text" 
                value={form.flavor}
                onChange={e => handleChange('flavor', e.target.value)}
                className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white"
                placeholder="e.g. Purple Haze"
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Pricing Weights */}
          <div>
              <label className="block text-sm text-gray-400 mb-2">Weight & Pricing</label>
              {form.weights.map((w, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                      <input 
                        className="w-24 bg-dark-900 border border-gray-700 rounded-lg p-2 text-white"
                        value={w.label}
                        onChange={e => handleWeightChange(idx, 'label', e.target.value)}
                      />
                      <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input 
                            type="number"
                            className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2 pl-6 text-white"
                            value={w.price}
                            onChange={e => handleWeightChange(idx, 'price', Number(e.target.value))}
                          />
                      </div>
                  </div>
              ))}
          </div>
          
          <div>
              <label className="block text-sm text-gray-400 mb-1">Total Stock</label>
               <input 
                type="number" 
                value={form.stock}
                onChange={e => handleChange('stock', Number(e.target.value))}
                className="w-full bg-dark-900 border border-gray-700 rounded-lg p-2.5 text-white"
              />
          </div>

          {/* AI Description */}
          <div>
             <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-gray-400">Description</label>
                <button 
                    onClick={handleGenerateDescription}
                    disabled={!form.brand || !form.flavor}
                    className="text-xs flex items-center gap-1 text-cannabis-400 hover:text-cannabis-300 disabled:opacity-50"
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
            <Button fullWidth size="lg" onClick={handleSave} className="flex-1">
                <Save className="w-5 h-5 mr-2" /> Save & Publish
            </Button>
          </div>

        </div>

        {/* RIGHT COLUMN: LIST VIEW (Bulk) */}
        <div className="bg-dark-800 p-6 rounded-2xl border border-gray-700 h-fit">
            <h2 className="text-xl font-bold text-white mb-4">Current Inventory</h2>
            <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
                {products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 bg-dark-900 p-3 rounded-lg border border-gray-800 hover:border-gray-600 cursor-pointer" onClick={() => setForm(p)}>
                        <img src={p.imageUrl} className="w-10 h-10 rounded object-cover bg-white" />
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-white truncate">{p.flavor}</div>
                            <div className="text-xs text-gray-500">{p.brand}</div>
                        </div>
                        <div className="text-right">
                             <div className="font-bold text-white">${p.weights[0].price}</div>
                             <div className={`text-xs ${p.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{p.stock} left</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};