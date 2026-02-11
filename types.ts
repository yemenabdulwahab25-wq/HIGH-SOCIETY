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
  label: string; // e.g., "1g", "3.5g"
  price: number;
  weightGrams: number;
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
  stock: number;
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

export interface StoreSettings {
  storeName: string;
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
  }
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Billionaire Level",
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
  }
};