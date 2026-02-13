
export enum StrainType {
  INDICA = 'Indica',
  SATIVA = 'Sativa',
  HYBRID = 'Hybrid',
}

export enum Category {
  FLOWER = 'Flower',
  PREROLL = 'Pre-Roll',
  DISPOSABLE = 'Disposable',
  CARTRIDGE = 'Cartridge',
  EDIBLE = 'Edible',
  CONCENTRATE = 'Concentrate',
  ACCESSORY = 'Accessory',
  VAPE = 'Vape', // Generic Vape category
  POD = 'Pod',
}

export enum OrderStatus {
  PLACED = 'Placed',
  ACCEPTED = 'Accepted',
  READY = 'Ready',
  PICKED_UP = 'Picked Up',
  CANCELLED = 'Cancelled',
}

export interface ProductWeight {
  label: string; // e.g., "1g", "3.5g", "S", "10pk"
  price: number;
  weightGrams: number;
  stock: number;
}

export type ProductType = 'Cannabis' | 'Vape';

export interface ProductSEO {
  title: string;
  description: string;
  keywords: string[];
}

export interface Product {
  id: string;
  productType: ProductType; // New: Distinguish between Cannabis and Vape
  category: string;
  brand: string;
  flavor: string;
  strain?: StrainType; // Optional for Vapes
  thcPercentage?: number; // Optional for Vapes
  cbdPercentage?: number;
  puffCount?: number; // New: Specific for Vapes
  weights: ProductWeight[];
  stock: number; 
  imageUrl: string;
  description: string;
  isPublished: boolean;
  isFeatured?: boolean; 
  seo?: ProductSEO; // New: AI SEO Data
}

export interface CartItem extends Product {
  selectedWeight: ProductWeight;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discountAmount?: number;
  total: number;
  status: OrderStatus;
  timestamp: number;
  type: 'Pickup' | 'Delivery';
  paymentMethod: 'Cash' | 'Card' | 'Online' | 'Crypto';
  generatedReferralCode?: string;
  appliedReferralCode?: string;
  deliveryZoneName?: string; // New: Track which zone was used
}

export interface HolidayTheme {
  id: string;
  name: string;
  month: number; 
  day: number;   
  colors: {
    primary: string; 
    accent: string;  
  };
  icon: string; 
  enabled: boolean;
}

export interface SpecialEvent {
  id: string;
  title: string;
  message: string;
  startDate: string; 
  endDate: string;   
  backgroundColor: string;
  textColor: string;
  enabled: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string; // e.g. "Queens", "Brooklyn"
  centerAddress: string; // e.g. "Astoria, NY"
  lat: number;
  lng: number;
  radiusMiles: number;
  fee: number;
  minOrder: number;
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  adminPin: string; 
  maintenanceMode: boolean; 
  access: {
    enabled: boolean;
    code: string;
  };
  financials: {
    taxRate: number; 
    deliveryFee: number; // Fallback fee
    minOrderAmount: number;
    currencySymbol: string;
  };
  hours: {
    enabled: boolean;
    openTime: string; 
    closeTime: string; 
    closedDays: number[]; 
  };
  inventory: {
    lowStockThreshold: number;
  };
  payments: {
    online: boolean;
    cashInStore: boolean;
    cardInStore: boolean;
    crypto: boolean;
  };
  loyalty: {
    enabled: boolean;
    pointsPerDollar: number;
  };
  referral: { 
    enabled: boolean;
    percentage: number;
  };
  messages: {
    enabled: boolean;
    template: string;
  };
  visibility: {
    localTraffic: boolean;
    showMap: boolean;
  };
  delivery: {
    enabled: boolean;
    zones: DeliveryZone[]; // New: List of active zones
  };
  holidays: HolidayTheme[];
  specialEvents: SpecialEvent[];
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Billionaire Level",
  adminPin: "4200",
  maintenanceMode: false,
  access: {
    enabled: false,
    code: "420",
  },
  financials: {
    taxRate: 0,
    deliveryFee: 10,
    minOrderAmount: 0,
    currencySymbol: '$'
  },
  hours: {
    enabled: false,
    openTime: "09:00",
    closeTime: "22:00",
    closedDays: []
  },
  inventory: {
    lowStockThreshold: 5
  },
  payments: {
    online: false,
    cashInStore: true,
    cardInStore: true,
    crypto: false,
  },
  loyalty: {
    enabled: true,
    pointsPerDollar: 1,
  },
  referral: {
    enabled: true,
    percentage: 10,
  },
  messages: {
    enabled: true,
    template: "Thanks for shopping with us! Enjoy your lift-off.",
  },
  visibility: {
    localTraffic: true,
    showMap: true,
  },
  delivery: {
    enabled: false,
    zones: []
  },
  holidays: [], 
  specialEvents: []
};
