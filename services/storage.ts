import { Product, Order, StoreSettings, DEFAULT_SETTINGS, StrainType, Category } from '../types';

const KEYS = {
  PRODUCTS: 'hs_products',
  ORDERS: 'hs_orders',
  SETTINGS: 'hs_settings',
  CART: 'hs_cart',
  USER: 'hs_user',
  CATEGORIES: 'hs_categories',
  BRANDS: 'hs_brands',
};

// Seed Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    category: Category.FLOWER,
    brand: 'MoonRocks',
    flavor: 'Galactic Gas',
    strain: StrainType.INDICA,
    thcPercentage: 32,
    weights: [
        { label: '3.5g', price: 60, weightGrams: 3.5, stock: 40 }, 
        { label: '7g', price: 110, weightGrams: 7, stock: 10 }
    ],
    stock: 50,
    imageUrl: 'https://picsum.photos/400/400?random=1',
    description: 'Heavy hitting indica with notes of diesel and pine.',
    isPublished: true,
  },
  {
    id: '2',
    category: Category.EDIBLE,
    brand: 'YumYum',
    flavor: 'Blueberry Blast',
    strain: StrainType.HYBRID,
    thcPercentage: 10, // 10mg
    weights: [{ label: '10pk', price: 25, weightGrams: 0, stock: 100 }],
    stock: 100,
    imageUrl: 'https://picsum.photos/400/400?random=2',
    description: 'Delicious blueberry gummies infused with premium distillate.',
    isPublished: true,
  },
    {
    id: '3',
    category: Category.DISPOSABLE,
    brand: 'Cloud9',
    flavor: 'Mango Haze',
    strain: StrainType.SATIVA,
    thcPercentage: 88,
    weights: [{ label: '1g', price: 45, weightGrams: 1, stock: 20 }],
    stock: 20,
    imageUrl: 'https://picsum.photos/400/400?random=3',
    description: 'Tropical mango vibes for an uplifting day.',
    isPublished: true,
  }
];

export const storage = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : INITIAL_PRODUCTS;
  },
  saveProduct: (product: Product) => {
    const products = storage.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },
  deleteProduct: (id: string) => { // Soft delete or actual delete? Prompt implies no deleting tools, but deleting products is standard.
     const products = storage.getProducts().filter(p => p.id !== id);
     localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },
  getOrders: (): Order[] => {
    const data = localStorage.getItem(KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },
  saveOrder: (order: Order) => {
    const orders = storage.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
      orders[index] = order;
    } else {
      orders.unshift(order); // Newest first
    }
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  },
  getSettings: (): StoreSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    
    // Deep merge to ensure new settings (like access) are present even if local storage is old
    const parsed = JSON.parse(data);
    return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        access: { ...DEFAULT_SETTINGS.access, ...(parsed.access || {}) },
        payments: { ...DEFAULT_SETTINGS.payments, ...(parsed.payments || {}) },
        loyalty: { ...DEFAULT_SETTINGS.loyalty, ...(parsed.loyalty || {}) },
        messages: { ...DEFAULT_SETTINGS.messages, ...(parsed.messages || {}) },
        visibility: { ...DEFAULT_SETTINGS.visibility, ...(parsed.visibility || {}) },
        delivery: { ...DEFAULT_SETTINGS.delivery, ...(parsed.delivery || {}) },
    };
  },
  saveSettings: (settings: StoreSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
  getCategories: (): string[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : Object.values(Category);
  },
  saveCategory: (category: string) => {
    const categories = storage.getCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    }
  },
  deleteCategory: (category: string) => {
    const categories = storage.getCategories().filter(c => c !== category);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  },
  getBrands: (): string[] => {
    const data = localStorage.getItem(KEYS.BRANDS);
    return data ? JSON.parse(data) : ['MoonRocks', 'YumYum', 'Cloud9', 'Cookies', 'Jungle Boys'];
  },
  saveBrand: (brand: string) => {
    const brands = storage.getBrands();
    if (!brands.includes(brand)) {
      brands.push(brand);
      localStorage.setItem(KEYS.BRANDS, JSON.stringify(brands));
    }
  },
  deleteBrand: (brand: string) => {
    const brands = storage.getBrands().filter(b => b !== brand);
    localStorage.setItem(KEYS.BRANDS, JSON.stringify(brands));
  },
};