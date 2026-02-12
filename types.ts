
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

export interface Product {
  id: string;
  category: string;
  brand: string;
  flavor: string;
  strain: StrainType;
  thcPercentage: number;
  cbdPercentage?: number;
  weights: ProductWeight[];
  stock: number; // Total stock (sum of weights)
  imageUrl: string;
  description: string;
  isPublished: boolean;
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
  total: number;
  status: OrderStatus;
  timestamp: number;
  type: 'Pickup' | 'Delivery';
  paymentMethod: 'Cash' | 'Card' | 'Online' | 'Crypto';
}

export interface HolidayTheme {
  id: string;
  name: string;
  month: number; // 1-12
  day: number;   // 1-31
  colors: {
    primary: string; // Replaces cannabis-500/600
    accent: string;  // Replaces gold-400/500
  };
  icon: string; // Emoji or short text
  enabled: boolean;
}

export interface SpecialEvent {
  id: string;
  title: string;
  message: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  backgroundColor: string;
  textColor: string;
  enabled: boolean;
}

export interface StoreSettings {
  storeName: string;
  access: {
    enabled: boolean;
    code: string;
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
  };
  holidays: HolidayTheme[];
  specialEvents: SpecialEvent[];
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Billionaire Level",
  access: {
    enabled: false,
    code: "420",
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
  },
  holidays: [], // Populated in storage.ts
  specialEvents: []
};
