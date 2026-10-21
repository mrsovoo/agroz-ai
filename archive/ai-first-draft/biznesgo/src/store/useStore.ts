import { create } from 'zustand';
import type { Merchant, Product, CartItem, BusinessTypeMeta, ViewType } from '../types';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AppState {
  user: any | null;
  merchant: Merchant | null;
  currentView: ViewType;
  meta: {
    business_types: Record<string, BusinessTypeMeta>;
    units: string[];
    payment_types: string[];
  };
  cart: CartItem[];
  toasts: ToastMessage[];

  setUser: (user: any | null) => void;
  setMerchant: (merchant: Merchant | null) => void;
  setCurrentView: (view: ViewType) => void;
  setMeta: (meta: any) => void;

  // Cart
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQty: (productId: number, quantity: number) => void;
  updateCartItemQty: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getCartTotal: () => number;
  getCartCount: () => number;

  // Toast
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // Helper
  getBusinessInfo: () => BusinessTypeMeta | null;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  merchant: null,
  currentView: 'dashboard',
  meta: {
    business_types: {},
    units: ['dona', 'kg', 'liter', 'qop', 'tonna', 'pachka', 'metr', 'gram', 'tup'],
    payment_types: ['cash', 'card', 'debt']
  },
  cart: [],
  toasts: [],

  setUser: (user) => set({ user }),
  setMerchant: (merchant) => set({ merchant }),
  setCurrentView: (currentView) => set({ currentView }),
  setMeta: (meta) => set((s) => ({ meta: { ...s.meta, ...meta } })),

  addToCart: (product, quantity = 1) => {
    const { cart } = get();
    const existing = cart.find((i) => i.product_id === product.id);
    const available = Number(product.stock_quantity);

    const resolvePrice = (qty: number) => {
      const wsMin = product.min_wholesale_quantity || product.wholesale_min_qty;
      if (product.wholesale_price && wsMin && qty >= Number(wsMin)) {
        return Number(product.wholesale_price);
      }
      return Number(product.price);
    };

    if (existing) {
      const nextQty = existing.quantity + quantity;
      const finalQty = nextQty > available ? available : nextQty;
      const unitPrice = resolvePrice(finalQty);
      const wsMin = product.min_wholesale_quantity || product.wholesale_min_qty;
      const isWs = Boolean(product.wholesale_price && wsMin && finalQty >= Number(wsMin));

      set({
        cart: cart.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: finalQty, unit_price: unitPrice, is_wholesale: isWs }
            : i
        )
      });
    } else {
      const initQty = Math.min(quantity, available > 0 ? available : 1);
      const unitPrice = resolvePrice(initQty);
      const wsMin = product.min_wholesale_quantity || product.wholesale_min_qty;
      const isWs = Boolean(product.wholesale_price && wsMin && initQty >= Number(wsMin));

      set({
        cart: [...cart, { product_id: product.id, product, quantity: initQty, unit_price: unitPrice, is_wholesale: isWs }]
      });
    }
  },

  updateCartQty: (productId, quantity) => {
    const { cart } = get();
    if (quantity <= 0) {
      set({ cart: cart.filter((i) => i.product_id !== productId) });
      return;
    }
    const item = cart.find((i) => i.product_id === productId);
    if (!item) return;

    const available = Number(item.product.stock_quantity);
    const finalQty = quantity > available ? available : quantity;

    const resolvePrice = (qty: number) => {
      const wsMin = item.product.min_wholesale_quantity || item.product.wholesale_min_qty;
      if (item.product.wholesale_price && wsMin && qty >= Number(wsMin)) {
        return Number(item.product.wholesale_price);
      }
      return Number(item.product.price);
    };

    const unitPrice = resolvePrice(finalQty);
    const wsMin = item.product.min_wholesale_quantity || item.product.wholesale_min_qty;
    const isWs = Boolean(item.product.wholesale_price && wsMin && finalQty >= Number(wsMin));

    set({
      cart: cart.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: finalQty, unit_price: unitPrice, is_wholesale: isWs }
          : i
      )
    });
  },

  updateCartItemQty: (productId, quantity) => {
    get().updateCartQty(productId, quantity);
  },

  removeFromCart: (productId) => set((s) => ({ cart: s.cart.filter((i) => i.product_id !== productId) })),
  clearCart: () => set({ cart: [] }),

  getCartSubtotal: () => {
    const { cart } = get();
    return cart.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  },

  getCartTotal: () => {
    return get().getCartSubtotal();
  },

  getCartCount: () => {
    const { cart } = get();
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  },

  showToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  addToast: (message, type = 'info') => {
    get().showToast(message, type);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  getBusinessInfo: () => {
    const { merchant, meta } = get();
    if (!merchant || !merchant.business_type) return null;
    return meta.business_types[merchant.business_type] || null;
  }
}));
