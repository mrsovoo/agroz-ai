import { Product, Customer, DashboardMetrics, Sale } from '../types';

export const demoMetrics: DashboardMetrics = {
  today_revenue: 0,
  cash_revenue: 0,
  card_revenue: 0,
  debt_revenue: 0,
  today_profit: 0,
  total_receipts: 0,
  expired_count: 0,
  critical_7_count: 0,
  critical_expiry_count: 0,
  warning_60_count: 0,
  warning_90_count: 0,
  out_of_stock_count: 0,
  low_stock_count: 0,
  total_debt: 0,
  debtor_count: 0,
  overdue_debt: 0,
  overdue_debtors_count: 0,
  sector_type: 'agro_vet',
  urgent_expiry_drugs: []
};

// Yangi deploy qilingan B2B do'kon toza 0-holatda boshlanadi:
export const initialDemoProducts: Product[] = [];
export const initialDemoCustomers: Customer[] = [];
export const initialDemoBatches: any[] = [];
export const initialDemoSales: Sale[] = [];

class DemoStore {
  products: Product[] = [...initialDemoProducts];
  customers: Customer[] = [...initialDemoCustomers];
  batches = [...initialDemoBatches];
  sales: Sale[] = [...initialDemoSales];
  metrics: DashboardMetrics = { ...demoMetrics };

  getProducts(search?: string, filter?: string) {
    let list = [...this.products];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.includes(q) ||
          p.active_ingredient?.toLowerCase().includes(q) ||
          p.batch_number?.toLowerCase().includes(q)
      );
    }
    if (filter) {
      if (filter === 'critical') {
        list = list.filter(p => p.expiry_status === 'critical' || p.expiry_status === 'expired');
      } else if (filter === 'low_stock') {
        list = list.filter(p => p.stock <= (p.min_stock || 5));
      }
    }
    return list;
  }

  addProduct(prod: Partial<Product>) {
    const newP: Product = {
      id: `prod-demo-${Date.now()}`,
      name: prod.name || 'Agro-Vet Preparat',
      sku: prod.sku || `VET-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: prod.barcode || `478000${Math.floor(100000 + Math.random() * 900000)}`,
      category: prod.category || 'Antibiotiklar (Veterinariya)',
      brand: prod.brand || 'VetPharma',
      unit: prod.unit || 'flakon',
      price: prod.price || 10000,
      cost_price: prod.cost_price || 7000,
      stock: prod.stock || 10,
      min_stock: prod.min_stock || 5,
      is_out_of_stock: false,
      sector_type: 'agro_vet',
      active_ingredient: prod.active_ingredient || 'Faol modda',
      dosage_form: prod.dosage_form || 'Ineksiya',
      storage_condition: prod.storage_condition || '+15..+25°C (Xona haroratida)',
      batch_number: prod.batch_number || `B-${new Date().getFullYear()}-01`,
      expiry_date: prod.expiry_date || '2026-12-31',
      expiry_status: 'normal',
      image_url: prod.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'
    };
    this.products.unshift(newP);
    return newP;
  }

  checkout(items: { product_id: string; quantity: number }[], paymentType: 'cash' | 'card' | 'debt', customerId?: string, customerName?: string) {
    let total = 0;
    for (const item of items) {
      const prod = this.products.find(p => p.id === item.product_id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        prod.is_out_of_stock = prod.stock <= 0;
        total += prod.price * item.quantity;
      }
    }

    const receiptNum = `CHK-${Math.floor(100000 + Math.random() * 900000)}`;
    const newSale: Sale = {
      id: `s-${Date.now()}`,
      receipt_number: receiptNum,
      total_amount: total,
      payment_type: paymentType,
      cash_amount: paymentType === 'cash' ? total : 0,
      card_amount: paymentType === 'card' ? total : 0,
      debt_amount: paymentType === 'debt' ? total : 0,
      customer_name: customerName || (customerId ? this.customers.find(c => c.id === customerId)?.name : 'Chakana xaridor'),
      created_at: new Date().toISOString()
    };
    this.sales.unshift(newSale);

    if (paymentType === 'debt' && customerId) {
      const cust = this.customers.find(c => c.id === customerId);
      if (cust) {
        cust.debt_balance += total;
      }
    }

    this.metrics.today_revenue += total;
    if (paymentType === 'cash') this.metrics.cash_revenue += total;
    if (paymentType === 'card') this.metrics.card_revenue += total;
    if (paymentType === 'debt') this.metrics.debt_revenue += total;
    this.metrics.total_receipts += 1;

    return {
      success: true,
      receipt_number: receiptNum,
      message: 'Sotuv muvaffaqiyatli amalga oshirildi'
    };
  }

  repayDebt(customerId: string, amount: number, newDueDate?: string) {
    const cust = this.customers.find(c => c.id === customerId);
    if (!cust) throw new Error('Mijoz topilmadi');
    cust.debt_balance = Math.max(0, cust.debt_balance - amount);
    if (cust.debt_balance === 0) {
      cust.status = 'normal';
    }
    if (newDueDate) {
      cust.due_date = newDueDate;
    }
    this.metrics.total_debt = Math.max(0, this.metrics.total_debt - amount);
    return {
      success: true,
      message: 'Qarz to\'lovi qabul qilindi',
      remaining_balance: cust.debt_balance
    };
  }
}

export const demoStore = new DemoStore();

