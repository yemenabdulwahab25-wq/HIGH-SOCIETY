
import { Product, Order, StoreSettings, DEFAULT_SETTINGS, StrainType, Category, HolidayTheme, Review } from '../types';

const KEYS = {
  PRODUCTS: 'hs_products',
  ORDERS: 'hs_orders',
  SETTINGS: 'hs_settings',
  CART: 'hs_cart',
  USER: 'hs_user',
  CATEGORIES: 'hs_categories',
  BRANDS: 'hs_brands',
  BRAND_LOGOS: 'hs_brand_logos',
  REVIEWS: 'hs_reviews',
};

// Seed Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    productType: 'Cannabis',
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
    isFeatured: true,
  },
  {
    id: '2',
    productType: 'Cannabis',
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
    isFeatured: true,
  },
    {
    id: '3',
    productType: 'Cannabis',
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
    isFeatured: false,
  },
  {
    id: '4',
    productType: 'Vape',
    category: 'Vape',
    brand: 'ElfBar',
    flavor: 'Blue Razz Ice',
    puffCount: 5000,
    weights: [{ label: '1pc', price: 20, weightGrams: 0, stock: 50 }],
    stock: 50,
    imageUrl: 'https://picsum.photos/400/400?random=4',
    description: 'Refreshing blue raspberry with a cool menthol finish. 5000 puffs.',
    isPublished: true,
    isFeatured: true,
  }
];

const DEFAULT_HOLIDAYS: HolidayTheme[] = [
  {
    id: '420',
    name: '4/20 Celebration',
    month: 4,
    day: 20,
    colors: { primary: '#00ff00', accent: '#ffff00' }, // Neon Green & Yellow
    icon: '🌿',
    enabled: true
  },
  {
    id: '710',
    name: '7/10 Oil Day',
    month: 7,
    day: 10,
    colors: { primary: '#f59e0b', accent: '#fbbf24' }, // Amber/Gold
    icon: '🍯',
    enabled: true
  },
  {
    id: 'halloween',
    name: 'Spooky Season',
    month: 10,
    day: 31,
    colors: { primary: '#f97316', accent: '#a855f7' }, // Orange & Purple
    icon: '🎃',
    enabled: true
  },
  {
    id: 'christmas',
    name: 'Holidaze',
    month: 12,
    day: 25,
    colors: { primary: '#ef4444', accent: '#10b981' }, // Red & Green
    icon: '🎄',
    enabled: true
  }
];

const notifyUpdate = () => {
    window.dispatchEvent(new Event('hs_storage_update'));
};

export const storage = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    let products = data ? JSON.parse(data) : INITIAL_PRODUCTS;
    // Migration helper: ensure productType exists
    products = products.map((p: any) => ({
        ...p,
        productType: p.productType || 'Cannabis'
    }));
    return products;
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
    notifyUpdate();
  },
  deleteProduct: (id: string) => { 
     const products = storage.getProducts().filter(p => p.id !== id);
     localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
     notifyUpdate();
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
    notifyUpdate();
  },
  getSettings: (): StoreSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    const saved = data ? JSON.parse(data) : {};
    
    // Deep merge to ensure new fields are present
    return {
        ...DEFAULT_SETTINGS,
        ...saved,
        access: { ...DEFAULT_SETTINGS.access, ...(saved.access || {}) },
        financials: { ...DEFAULT_SETTINGS.financials, ...(saved.financials || {}) },
        hours: { ...DEFAULT_SETTINGS.hours, ...(saved.hours || {}) },
        inventory: { ...DEFAULT_SETTINGS.inventory, ...(saved.inventory || {}) },
        payments: { ...DEFAULT_SETTINGS.payments, ...(saved.payments || {}) },
        loyalty: { ...DEFAULT_SETTINGS.loyalty, ...(saved.loyalty || {}) },
        referral: { ...DEFAULT_SETTINGS.referral, ...(saved.referral || {}) },
        messages: { ...DEFAULT_SETTINGS.messages, ...(saved.messages || {}) },
        visibility: { ...DEFAULT_SETTINGS.visibility, ...(saved.visibility || {}) },
        delivery: { 
            ...DEFAULT_SETTINGS.delivery, 
            ...(saved.delivery || {}),
            zones: saved.delivery?.zones || [] // Ensure zones array exists
        },
        holidays: saved.holidays && saved.holidays.length > 0 ? saved.holidays : DEFAULT_HOLIDAYS,
        specialEvents: saved.specialEvents || []
    };
  },
  saveSettings: (settings: StoreSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    notifyUpdate();
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
      notifyUpdate();
    }
  },
  deleteCategory: (category: string) => {
    const categories = storage.getCategories().filter(c => c !== category);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    notifyUpdate();
  },
  getBrands: (): string[] => {
    const data = localStorage.getItem(KEYS.BRANDS);
    return data ? JSON.parse(data) : ['MoonRocks', 'YumYum', 'Cloud9', 'Cookies', 'Jungle Boys', 'ElfBar', 'GeekBar'];
  },
  saveBrand: (brand: string) => {
    const brands = storage.getBrands();
    if (!brands.includes(brand)) {
      brands.push(brand);
      localStorage.setItem(KEYS.BRANDS, JSON.stringify(brands));
      notifyUpdate();
    }
  },
  deleteBrand: (brand: string) => {
    const brands = storage.getBrands().filter(b => b !== brand);
    localStorage.setItem(KEYS.BRANDS, JSON.stringify(brands));
    
    // Also remove logo if it exists
    const logos = storage.getBrandLogos();
    if (logos[brand]) {
        delete logos[brand];
        localStorage.setItem(KEYS.BRAND_LOGOS, JSON.stringify(logos));
    }

    notifyUpdate();
  },
  getBrandLogos: (): Record<string, string> => {
    const data = localStorage.getItem(KEYS.BRAND_LOGOS);
    return data ? JSON.parse(data) : {};
  },
  saveBrandLogo: (brand: string, logoUrl: string) => {
    const logos = storage.getBrandLogos();
    logos[brand] = logoUrl;
    localStorage.setItem(KEYS.BRAND_LOGOS, JSON.stringify(logos));
    notifyUpdate();
  },
  // Reviews
  getReviews: (productId: string): Review[] => {
    const data = localStorage.getItem(KEYS.REVIEWS);
    const allReviews: Review[] = data ? JSON.parse(data) : [];
    return allReviews.filter(r => r.productId === productId).sort((a,b) => b.timestamp - a.timestamp);
  },
  addReview: (review: Review) => {
    const data = localStorage.getItem(KEYS.REVIEWS);
    const allReviews: Review[] = data ? JSON.parse(data) : [];
    allReviews.push(review);
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(allReviews));
    notifyUpdate();
  }
};
