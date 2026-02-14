
import { Product, Order, StoreSettings, DEFAULT_SETTINGS, StrainType, Category, HolidayTheme, Review, Customer, CartItem } from '../types';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, updateDoc, query, where, Timestamp, onSnapshot } from 'firebase/firestore';

const KEYS = {
  PRODUCTS: 'hs_products',
  ORDERS: 'hs_orders_secure',
  SETTINGS: 'hs_settings',
  CART: 'hs_cart',
  USER: 'hs_user',
  CUSTOMERS: 'hs_customers_secure',
  CATEGORIES: 'hs_categories',
  BRANDS: 'hs_brands',
  BRAND_LOGOS: 'hs_brand_logos',
  REVIEWS: 'hs_reviews',
};

// --- SECURITY UTILS ---
const SECRET_SALT = "BILLIONAIRE_SECURE_VAULT_2024";

const encryptData = (data: any): string => {
    try {
        const json = JSON.stringify(data);
        const chars = json.split('');
        const xor = chars.map((c, i) => c.charCodeAt(0) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length));
        return btoa(String.fromCharCode(...xor));
    } catch (e) {
        console.error("Encryption failed", e);
        return "";
    }
};

const decryptData = (encoded: string | null): any => {
    if (!encoded) return null;
    try {
        const str = atob(encoded);
        const chars = str.split('');
        const xor = chars.map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length)));
        return JSON.parse(xor.join(''));
    } catch (e) {
        console.error("Decryption failed", e);
        return null;
    }
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
    thcPercentage: 10,
    weights: [{ label: '10pk', price: 25, weightGrams: 0, stock: 100 }],
    stock: 100,
    imageUrl: 'https://picsum.photos/400/400?random=2',
    description: 'Delicious blueberry gummies infused with premium distillate.',
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
    colors: { primary: '#00ff00', accent: '#ffff00' }, 
    icon: '🌿',
    enabled: true
  },
  {
    id: '710',
    name: '7/10 Oil Day',
    month: 7,
    day: 10,
    colors: { primary: '#f59e0b', accent: '#fbbf24' },
    icon: '🍯',
    enabled: true
  }
];

const notifyUpdate = () => {
    window.dispatchEvent(new Event('hs_storage_update'));
};

const notifyFirestoreError = (type: 'SETUP_REQUIRED' | 'PERMISSION_DENIED') => {
    const event = new CustomEvent('hs_firestore_error', { detail: { type } });
    window.dispatchEvent(event);
};

// --- HYBRID STORAGE IMPLEMENTATION ---
// We write to LocalStorage immediately for speed/offline capability.
// We write to Firebase in the background for persistence.

let unsubscribeProducts: (() => void) | null = null;
let unsubscribeOrders: (() => void) | null = null;
let unsubscribeSettings: (() => void) | null = null;

export const storage = {
  // --- REAL-TIME SYNC ---
  initRealtimeListeners: () => {
      if (!db) return; // Don't listen if Firebase isn't configured

      console.log("📡 Initializing Real-time Listeners...");

      // 1. Products Listener
      if (!unsubscribeProducts) {
          unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
              const products: Product[] = [];
              snapshot.forEach((doc) => products.push(doc.data() as Product));
              
              if (products.length > 0) {
                  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
                  notifyUpdate();
              }
          }, (error) => {
              console.error("Product Sync Error:", error.code, error.message);
              if (error.message.includes('Cloud Firestore API has not been used')) {
                  notifyFirestoreError("SETUP_REQUIRED");
              } else if (error.code === 'permission-denied') {
                  notifyFirestoreError("PERMISSION_DENIED");
              }
          });
      }

      // 2. Orders Listener
      if (!unsubscribeOrders) {
          unsubscribeOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
              const orders: Order[] = [];
              snapshot.forEach((doc) => orders.push(doc.data() as Order));
              
              if (orders.length > 0) {
                  localStorage.setItem(KEYS.ORDERS, encryptData(orders));
                  notifyUpdate();
              }
          }, (error) => {
              if (error.code === 'permission-denied') {
                   // Only notify once from the main listener (products) to avoid spam
                   console.warn("Orders permission denied");
              }
          });
      }

      // 3. Settings Listener
      if (!unsubscribeSettings) {
           unsubscribeSettings = onSnapshot(doc(db, "settings", "global"), (doc) => {
               if (doc.exists()) {
                   localStorage.setItem(KEYS.SETTINGS, JSON.stringify(doc.data()));
                   notifyUpdate();
               }
           }, (error) => {
               // Suppress
           });
      }
  },

  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    let products = data ? JSON.parse(data) : INITIAL_PRODUCTS;
    products = products.map((p: any) => ({
        ...p,
        productType: p.productType || 'Cannabis'
    }));
    return products;
  },
  
  saveProduct: async (product: Product) => {
    // 1. Save Local (Instant)
    const products = storage.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    notifyUpdate();

    // 2. Sync to Firebase (Background)
    if (db) {
        try {
            await setDoc(doc(db, "products", product.id), product);
            console.log("☁️ Synced product to Firebase:", product.flavor);
        } catch (e: any) {
            console.error("Firebase sync error", e);
            if (e.code === 'permission-denied') notifyFirestoreError("PERMISSION_DENIED");
        }
    }
  },

  deleteProduct: async (id: string) => { 
     const products = storage.getProducts().filter(p => p.id !== id);
     localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
     notifyUpdate();
     // Delete from Firebase - Local only for safe deletion
  },
  
  // --- INVENTORY MANAGEMENT ---
  deductStock: (items: CartItem[]): boolean => {
      const allProducts = storage.getProducts();
      let inventoryUpdated = false;

      // Check stock
      for (const item of items) {
          const product = allProducts.find(p => p.id === item.id);
          if (!product) return false;
          const variant = product.weights.find(w => w.label === item.selectedWeight.label);
          if (!variant) return false;
          if (variant.stock < item.quantity) return false;
      }

      // Deduct
      items.forEach(item => {
          const productIndex = allProducts.findIndex(p => p.id === item.id);
          if (productIndex >= 0) {
              const product = allProducts[productIndex];
              const variantIndex = product.weights.findIndex(w => w.label === item.selectedWeight.label);
              
              if (variantIndex >= 0) {
                  product.weights[variantIndex].stock -= item.quantity;
                  product.stock -= item.quantity;
                  if (product.weights[variantIndex].stock < 0) product.weights[variantIndex].stock = 0;
                  if (product.stock < 0) product.stock = 0;

                  allProducts[productIndex] = product;
                  inventoryUpdated = true;
                  
                  if (db) {
                      setDoc(doc(db, "products", product.id), product).catch(e => console.error("Stock sync fail", e));
                  }
              }
          }
      });

      if (inventoryUpdated) {
          localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(allProducts));
          notifyUpdate();
          return true;
      }
      return false;
  },

  // --- ORDER STORAGE ---
  getOrders: (): Order[] => {
    const data = localStorage.getItem(KEYS.ORDERS);
    if (!data) return [];
    const decrypted = decryptData(data);
    if (decrypted) return decrypted;
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
  },
  
  saveOrder: async (order: Order) => {
    // 1. Local
    const orders = storage.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
      orders[index] = order;
    } else {
      orders.unshift(order); 
    }
    localStorage.setItem(KEYS.ORDERS, encryptData(orders));
    notifyUpdate();

    // 2. Firebase
    if (db) {
        try {
            await setDoc(doc(db, "orders", order.id), order);
            console.log("☁️ Order synced to cloud");
        } catch (e: any) {
            console.error("Order sync fail", e);
            if (e.code === 'permission-denied') notifyFirestoreError("PERMISSION_DENIED");
        }
    }
  },

  // --- CUSTOMER STORAGE ---
  saveCustomer: async (customer: Customer) => {
      // 1. Local
      const customers = storage.getCustomers();
      const index = customers.findIndex(c => c.id === customer.id);
      if (index >= 0) {
          customers[index] = customer;
      } else {
          customers.push(customer);
      }
      localStorage.setItem(KEYS.CUSTOMERS, encryptData(customers));

      // 2. Firebase
      if (db) {
          try {
              await setDoc(doc(db, "customers", customer.id), customer);
          } catch (e: any) {
              console.error("Customer sync fail", e);
              if (e.code === 'permission-denied') notifyFirestoreError("PERMISSION_DENIED");
          }
      }
  },
  
  getCustomers: (): Customer[] => {
      const data = localStorage.getItem(KEYS.CUSTOMERS);
      const decrypted = decryptData(data);
      return decrypted || [];
  },
  
  getCustomer: (phone: string): Customer | undefined => {
      const cleanPhone = phone.replace(/\D/g, '');
      return storage.getCustomers().find(c => c.id === cleanPhone);
  },

  // --- SETTINGS ---
  getSettings: (): StoreSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    const saved = data ? JSON.parse(data) : {};
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
            zones: saved.delivery?.zones || []
        },
        holidays: saved.holidays && saved.holidays.length > 0 ? saved.holidays : DEFAULT_HOLIDAYS,
        specialEvents: saved.specialEvents || []
    };
  },
  
  saveSettings: async (settings: StoreSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    notifyUpdate();
    if (db) {
        try {
            await setDoc(doc(db, "settings", "global"), settings);
        } catch (e) { console.error("Settings sync fail", e); }
    }
  },

  // --- CATEGORIES & BRANDS (Local Only for speed, could be synced if needed) ---
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
    // Remove logo
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

  // --- REVIEWS ---
  getReviews: (productId: string): Review[] => {
    const data = localStorage.getItem(KEYS.REVIEWS);
    const allReviews: Review[] = data ? JSON.parse(data) : [];
    return allReviews.filter(r => r.productId === productId).sort((a,b) => b.timestamp - a.timestamp);
  },
  addReview: async (review: Review) => {
    // Local
    const data = localStorage.getItem(KEYS.REVIEWS);
    const allReviews: Review[] = data ? JSON.parse(data) : [];
    allReviews.push(review);
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(allReviews));
    notifyUpdate();
    // Firebase
    if (db) {
        try {
            await setDoc(doc(db, "reviews", review.id), review);
        } catch (e) { console.error("Review sync fail", e); }
    }
  },

  getCustomerEmails: (): string[] => {
      const orders = storage.getOrders();
      const emails = new Set<string>();
      orders.forEach(o => {
          if (o.customerEmail) emails.add(o.customerEmail);
      });
      return Array.from(emails);
  },

  // --- UTILITY: ONE-TIME SYNC DOWNLOAD ---
  syncFromCloud: async () => {
      if (!db) return;
      try {
          console.log("☁️ Starting Cloud Sync...");
          
          // Products
          const pSnap = await getDocs(collection(db, "products"));
          const products: Product[] = [];
          pSnap.forEach(doc => products.push(doc.data() as Product));
          if (products.length > 0) {
              localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
          }

          // Settings
          const sSnap = await getDocs(collection(db, "settings"));
          sSnap.forEach(doc => {
              if (doc.id === 'global') localStorage.setItem(KEYS.SETTINGS, JSON.stringify(doc.data()));
          });

          // Customers
          const cSnap = await getDocs(collection(db, "customers"));
          const customers: Customer[] = [];
          cSnap.forEach(doc => customers.push(doc.data() as Customer));
          if (customers.length > 0) {
              localStorage.setItem(KEYS.CUSTOMERS, encryptData(customers));
          }

          notifyUpdate();
          console.log("✅ Cloud Sync Complete");
      } catch (e: any) {
          console.error("Cloud Sync Error", e);
          if (e.message.includes('Cloud Firestore API')) {
              notifyFirestoreError("SETUP_REQUIRED");
          } else if (e.code === 'permission-denied') {
              notifyFirestoreError("PERMISSION_DENIED");
          }
      }
  }
};
