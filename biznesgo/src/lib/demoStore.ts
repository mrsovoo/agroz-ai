import { Product, Customer, DashboardMetrics, Sale } from '../types';

export const demoMetrics: DashboardMetrics = {
  today_revenue: 3450000,
  cash_revenue: 2100000,
  card_revenue: 850000,
  debt_revenue: 500000,
  today_profit: 980000,
  total_receipts: 24,
  expired_count: 1,
  critical_7_count: 1,
  critical_expiry_count: 2,
  warning_60_count: 1,
  warning_90_count: 3,
  out_of_stock_count: 0,
  low_stock_count: 2,
  total_debt: 3200000,
  debtor_count: 3,
  overdue_debt: 1450000,
  overdue_debtors_count: 2,
  sector_type: 'agro_vet',
  urgent_expiry_drugs: [
    {
      id: 'prod-demo-2',
      name: 'Ivermektin 1%',
      active_ingredient: 'Ivermectin 10 mg/ml',
      batch_number: 'B-2025-02',
      expiry_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      stock: 4,
      price: 38000,
      days_to_expiry: 5
    },
    {
      id: 'prod-demo-3',
      name: 'Amoksitsillin 15% LA',
      active_ingredient: 'Amoxicillin trihydrate 150 mg/ml',
      batch_number: 'B-2025-03',
      expiry_date: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
      stock: 15,
      price: 52000,
      days_to_expiry: 25
    }
  ]
};

export const initialDemoProducts: Product[] = [
  {
    id: 'prod-demo-1',
    name: 'Oksitetratsiklin 20% LA',
    sku: 'VET-OXY-20',
    barcode: '478000123001',
    category: 'Antibiotiklar (Veterinariya)',
    brand: 'Invesa / FarmVet',
    unit: 'flakon',
    price: 45000,
    cost_price: 32000,
    stock: 28,
    min_stock: 10,
    is_out_of_stock: false,
    sector_type: 'agro_vet',
    active_ingredient: 'Oxytetracycline dihydrate 200 mg/ml',
    dosage_form: 'Uzoq ta\'sir qiluvchi ineksiya',
    storage_condition: '+15..+25°C (Xona haroratida)',
    batch_number: 'B-2025-09',
    expiry_date: '2026-09-15',
    expiry_status: 'normal',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'
  },
  {
    id: 'prod-demo-2',
    name: 'Ivermektin 1%',
    sku: 'VET-IVR-01',
    barcode: '478000123002',
    category: 'Antiparasitar vositalar',
    brand: 'Bioveta',
    unit: 'flakon',
    price: 38000,
    cost_price: 24000,
    stock: 4,
    min_stock: 10,
    is_out_of_stock: false,
    days_to_expiry: 5,
    sector_type: 'agro_vet',
    active_ingredient: 'Ivermectin 10 mg/ml',
    dosage_form: 'Ineksiya eritmasi',
    storage_condition: '+2..+8°C (Sovutgichda)',
    batch_number: 'B-2025-02',
    expiry_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    expiry_status: 'critical',
    image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400'
  },
  {
    id: 'prod-demo-3',
    name: 'Amoksitsillin 15% LA',
    sku: 'VET-AMX-15',
    barcode: '478000123003',
    category: 'Antibiotiklar (Veterinariya)',
    brand: 'KRKA',
    unit: 'flakon',
    price: 52000,
    cost_price: 38000,
    stock: 15,
    min_stock: 5,
    is_out_of_stock: false,
    days_to_expiry: 25,
    sector_type: 'agro_vet',
    active_ingredient: 'Amoxicillin trihydrate 150 mg/ml',
    dosage_form: 'Suspenziya',
    storage_condition: '+15..+25°C (Xona haroratida)',
    batch_number: 'B-2025-03',
    expiry_date: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    expiry_status: 'critical',
    image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400'
  },
  {
    id: 'prod-demo-4',
    name: 'Vetom 1.1 Probiotik',
    sku: 'VET-VTM-01',
    barcode: '478000123004',
    category: 'Vitaminlar & Premikslar',
    brand: 'Nauchno-Issled. Tsentr',
    unit: 'qadoq',
    price: 28000,
    cost_price: 18000,
    stock: 35,
    min_stock: 10,
    is_out_of_stock: false,
    sector_type: 'agro_vet',
    active_ingredient: 'Bacillus subtilis recombinant strain',
    dosage_form: 'Kukun',
    storage_condition: '+15..+25°C (Xona haroratida)',
    batch_number: 'B-2026-01',
    expiry_date: '2026-12-01',
    expiry_status: 'normal',
    image_url: 'https://images.unsplash.com/photo-1550572017-ed21c834cb9c?w=400'
  },
  {
    id: 'prod-demo-5',
    name: 'Enrofloksatsin 10% Oral',
    sku: 'VET-ENR-10',
    barcode: '478000123005',
    category: 'Antibiotiklar (Veterinariya)',
    brand: 'Bayer Vet',
    unit: 'litr',
    price: 85000,
    cost_price: 60000,
    stock: 12,
    min_stock: 5,
    is_out_of_stock: false,
    days_to_expiry: -30,
    sector_type: 'agro_vet',
    active_ingredient: 'Enrofloxacin 100 mg/ml',
    dosage_form: 'Oral eritma',
    storage_condition: '+15..+25°C (Xona haroratida)',
    batch_number: 'B-2024-08',
    expiry_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    expiry_status: 'expired',
    image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400'
  },
  {
    id: 'prod-demo-6',
    name: 'Butafosfan + Vit B12 (Katozal)',
    sku: 'VET-KAT-01',
    barcode: '478000123006',
    category: 'Vitaminlar & Premikslar',
    brand: 'Elanco',
    unit: 'flakon',
    price: 95000,
    cost_price: 72000,
    stock: 2,
    min_stock: 8,
    is_out_of_stock: false,
    sector_type: 'agro_vet',
    active_ingredient: 'Butafosfan 100mg + Cyanocobalamin 0.05mg',
    dosage_form: 'Ineksiya eritmasi',
    storage_condition: '+15..+25°C (Xona haroratida)',
    batch_number: 'B-2025-11',
    expiry_date: '2026-06-20',
    expiry_status: 'normal',
    image_url: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400'
  }
];

export const initialDemoCustomers: Customer[] = [
  {
    id: 'cust-demo-1',
    name: 'Rustam Qodirov (Chorvador)',
    phone: '+998901234567',
    customer_type: 'ferma',
    farm_profile: 'Oksitetratsiklin 20% LA (14 ta)',
    debt_balance: 650000,
    due_date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    status: 'overdue',
    notes: 'Oksitetratsiklin 20% LA (14 ta)'
  },
  {
    id: 'cust-demo-2',
    name: 'Olimjon Aka (Parrandachi)',
    phone: '+998935551122',
    customer_type: 'fermer',
    farm_profile: 'Ivermektin 1% (20 flakon)',
    debt_balance: 800000,
    due_date: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10),
    status: 'overdue',
    notes: 'Ivermektin 1% (20 flakon)'
  },
  {
    id: 'cust-demo-3',
    name: 'Zangiota Agro-Servis',
    phone: '+998977778899',
    customer_type: 'korxona',
    farm_profile: 'Amoksitsillin 15% LA (35 flakon)',
    debt_balance: 1750000,
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    status: 'normal',
    notes: 'Amoksitsillin 15% LA (35 flakon)'
  }
];

export const initialDemoBatches = [
  {
    id: 'batch-1',
    batch_number: 'B-2025-09',
    product_name: 'Oksitetratsiklin 20% LA',
    active_ingredient: 'Oxytetracycline dihydrate 200 mg/ml',
    quantity: 28,
    expiry_date: '2026-09-15',
    status: 'normal',
    supplier_name: 'FarmVet Ta\'minot MCHJ'
  },
  {
    id: 'batch-2',
    batch_number: 'B-2025-02',
    product_name: 'Ivermektin 1%',
    active_ingredient: 'Ivermectin 10 mg/ml',
    quantity: 4,
    expiry_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    status: 'critical_7',
    supplier_name: 'Bioveta Distribyutsiya'
  },
  {
    id: 'batch-3',
    batch_number: 'B-2025-03',
    product_name: 'Amoksitsillin 15% LA',
    active_ingredient: 'Amoxicillin trihydrate 150 mg/ml',
    quantity: 15,
    expiry_date: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    status: 'critical_30',
    supplier_name: 'KRKA Pharma'
  },
  {
    id: 'batch-4',
    batch_number: 'B-2024-08',
    product_name: 'Enrofloksatsin 10% Oral',
    active_ingredient: 'Enrofloxacin 100 mg/ml',
    quantity: 12,
    expiry_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    status: 'expired',
    supplier_name: 'AgroDori Ta\'minot'
  },
  {
    id: 'batch-5',
    batch_number: 'B-2024-RECALL',
    product_name: 'Biovit-80 Premiks',
    active_ingredient: 'Chlortetracycline + Vit B12',
    quantity: 8,
    expiry_date: '2026-05-10',
    status: 'quarantined',
    supplier_name: 'Veterinariya Sanoat'
  }
];

export const initialDemoSales: Sale[] = [
  {
    id: 's-1',
    receipt_number: 'CHK-894102',
    total_amount: 145000,
    payment_type: 'cash',
    cash_amount: 145000,
    card_amount: 0,
    debt_amount: 0,
    customer_name: 'Rustam Qodirov',
    created_at: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: 's-2',
    receipt_number: 'CHK-894101',
    total_amount: 280000,
    payment_type: 'card',
    cash_amount: 0,
    card_amount: 280000,
    debt_amount: 0,
    customer_name: 'Olimjon Aka',
    created_at: new Date(Date.now() - 65 * 60000).toISOString()
  },
  {
    id: 's-3',
    receipt_number: 'CHK-894100',
    total_amount: 500000,
    payment_type: 'debt',
    cash_amount: 0,
    card_amount: 0,
    debt_amount: 500000,
    customer_name: 'Zangiota Agro-Servis',
    created_at: new Date(Date.now() - 140 * 60000).toISOString()
  }
];

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

