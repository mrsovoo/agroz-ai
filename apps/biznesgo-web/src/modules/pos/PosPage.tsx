import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  Printer,
  Plus,
  Minus,
  X,
  ArrowRight,
  ScanBarcode,
} from 'lucide-react';
import { useApp } from '../../app/providers/AppContext';
import { useTelegram } from '../../core/platform/telegram/useTelegram';
import { ItemIcon } from '../../shared/components/ItemIcon';

interface CartItem {
  id: string;
  name: string;
  category: string;
  categoryKey: 'dorixona' | 'yem' | 'urug' | 'issiqxona' | 'texnika';
  sku?: string;
  unit: string;
  price: number;
  qty: number;
  stock: number;
  iconType: string;
  batch?: string;
  expiry?: string;
}

export const PosPage: React.FC = () => {
  const { currentSector } = useApp();
  const { isTelegram, scanQr, haptic } = useTelegram();
  const [search, setSearch] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // To'liq va boyitilgan tovarlar katalogi (Barcha sektorlar bo'yicha haqiqiy nomlar va shtrix-kodlar)
  const demoProducts: CartItem[] = [
    // 1. VET & AGRO DORIXONA
    {
      id: 'dori-1',
      name: 'Enrofloksatsin 10% (100ml flakon)',
      category: 'Vet & Agro Dorixona',
      categoryKey: 'dorixona',
      sku: '478001201',
      unit: 'flakon',
      price: 45000,
      qty: 1,
      stock: 42,
      iconType: 'pill',
      batch: 'E-2024-12',
      expiry: '2027-12',
    },
    {
      id: 'dori-2',
      name: 'Oksitetrasiklin 20% L.A. (100ml)',
      category: 'Vet & Agro Dorixona',
      categoryKey: 'dorixona',
      sku: '478001202',
      unit: 'flakon',
      price: 62000,
      qty: 1,
      stock: 18,
      iconType: 'pill',
      batch: 'O-2024-91',
      expiry: '2027-08',
    },
    {
      id: 'dori-3',
      name: 'Vitamin B-Kompleks (100ml flakon)',
      category: 'Vet & Agro Dorixona',
      categoryKey: 'dorixona',
      sku: '478001203',
      unit: 'flakon',
      price: 38000,
      qty: 1,
      stock: 65,
      iconType: 'pill',
      batch: 'V-2025-03',
      expiry: '2028-05',
    },
    {
      id: 'dori-4',
      name: 'Ivermektin 1% (50ml inyeksiya)',
      category: 'Vet & Agro Dorixona',
      categoryKey: 'dorixona',
      sku: '478001204',
      unit: 'flakon',
      price: 55000,
      qty: 1,
      stock: 24,
      iconType: 'pill',
      batch: 'I-2024-44',
      expiry: '2027-03',
    },
    {
      id: 'dori-5',
      name: 'Amoksisillin 15% Suspenziya (100ml)',
      category: 'Vet & Agro Dorixona',
      categoryKey: 'dorixona',
      sku: '478001205',
      unit: 'flakon',
      price: 75000,
      qty: 1,
      stock: 15,
      iconType: 'pill',
      batch: 'A-2024-88',
      expiry: '2027-11',
    },
    {
      id: 'dori-6',
      name: 'Biostimulyator Gumat Kaliy (1 litr)',
      category: 'Vet & Agro Dorixona',
      categoryKey: 'dorixona',
      sku: '478001206',
      unit: 'litr',
      price: 65000,
      qty: 1,
      stock: 50,
      iconType: 'sprout',
      batch: 'G-2025-01',
      expiry: '2028-10',
    },

    // 2. YEM-XASHAK
    {
      id: 'yem-1',
      name: 'Kombikorm Broyler Start (50 kg qop)',
      category: 'Yem-xashak',
      categoryKey: 'yem',
      sku: '478002301',
      unit: 'qop',
      price: 290000,
      qty: 1,
      stock: 28,
      iconType: 'wheat',
    },
    {
      id: 'yem-2',
      name: 'Kombikorm Tuxumchi Tovuq (50 kg qop)',
      category: 'Yem-xashak',
      categoryKey: 'yem',
      sku: '478002302',
      unit: 'qop',
      price: 270000,
      qty: 1,
      stock: 35,
      iconType: 'wheat',
    },
    {
      id: 'yem-3',
      name: 'Bug‘doy yormasi yem (40 kg qop)',
      category: 'Yem-xashak',
      categoryKey: 'yem',
      sku: '478002303',
      unit: 'qop',
      price: 180000,
      qty: 1,
      stock: 45,
      iconType: 'wheat',
    },
    {
      id: 'yem-4',
      name: 'Premiks Vitaminli Qo‘shimcha (10 kg)',
      category: 'Yem-xashak',
      categoryKey: 'yem',
      sku: '478002304',
      unit: 'qop',
      price: 120000,
      qty: 1,
      stock: 20,
      iconType: 'wheat',
    },

    // 3. URUG'LAR
    {
      id: 'urug-1',
      name: 'Pomidor urug‘i "Bella" F1 (500 dona)',
      category: 'Urug‘lar',
      categoryKey: 'urug',
      sku: '478003401',
      unit: 'pachka',
      price: 90000,
      qty: 1,
      stock: 14,
      iconType: 'sprout',
    },
    {
      id: 'urug-2',
      name: 'Bodring urug‘i "Mirabelle" F1 (250 dona)',
      category: 'Urug‘lar',
      categoryKey: 'urug',
      sku: '478003402',
      unit: 'pachka',
      price: 110000,
      qty: 1,
      stock: 19,
      iconType: 'sprout',
    },
    {
      id: 'urug-3',
      name: 'Bolgar qalampiri "Kaliforniya" (1000 dona)',
      category: 'Urug‘lar',
      categoryKey: 'urug',
      sku: '478003403',
      unit: 'pachka',
      price: 85000,
      qty: 1,
      stock: 22,
      iconType: 'sprout',
    },
    {
      id: 'urug-4',
      name: 'Ko‘kat va Oshko‘k urug‘i to‘plami (1 kg)',
      category: 'Urug‘lar',
      categoryKey: 'urug',
      sku: '478003404',
      unit: 'kg',
      price: 60000,
      qty: 1,
      stock: 30,
      iconType: 'leaf',
    },

    // 4. ISSIQXONA
    {
      id: 'issiq-1',
      name: 'Issiqxona plyonkasi (120 mkr uch qatlam)',
      category: 'Issiqxona',
      categoryKey: 'issiqxona',
      sku: '478004501',
      unit: 'metr',
      price: 10000,
      qty: 10,
      stock: 850,
      iconType: 'leaf',
    },
    {
      id: 'issiq-2',
      name: 'Tomchilatib sug‘orish lentasi (200m o‘ram)',
      category: 'Issiqxona',
      categoryKey: 'issiqxona',
      sku: '478004502',
      unit: 'o‘ram',
      price: 450000,
      qty: 1,
      stock: 12,
      iconType: 'droplet',
    },
    {
      id: 'issiq-3',
      name: 'Qora mulchalash plyonkasi (500m)',
      category: 'Issiqxona',
      categoryKey: 'issiqxona',
      sku: '478004503',
      unit: 'o‘ram',
      price: 380000,
      qty: 1,
      stock: 8,
      iconType: 'leaf',
    },
    {
      id: 'issiq-4',
      name: 'Issiqxona ventilyatsiya qisqichlari',
      category: 'Issiqxona',
      categoryKey: 'issiqxona',
      sku: '478004504',
      unit: 'komplekt',
      price: 45000,
      qty: 1,
      stock: 40,
      iconType: 'leaf',
    },

    // 5. TEXNIKA
    {
      id: 'tex-1',
      name: 'Motoblok havo filtri & moy to‘plami',
      category: 'Texnika',
      categoryKey: 'texnika',
      sku: '478005601',
      unit: 'komplekt',
      price: 130000,
      qty: 1,
      stock: 10,
      iconType: 'tractor',
    },
    {
      id: 'tex-2',
      name: 'Qo‘l purkagich (16 litr akkumulyatorli)',
      category: 'Texnika',
      categoryKey: 'texnika',
      sku: '478005602',
      unit: 'dona',
      price: 320000,
      qty: 1,
      stock: 15,
      iconType: 'tractor',
    },
    {
      id: 'tex-3',
      name: 'Kultivator pichoqlari (8 talik to‘plam)',
      category: 'Texnika',
      categoryKey: 'texnika',
      sku: '478005603',
      unit: 'komplekt',
      price: 210000,
      qty: 1,
      stock: 7,
      iconType: 'tractor',
    },
    {
      id: 'tex-4',
      name: 'Suv nasosi elektr dvigateli (1.5 kW)',
      category: 'Texnika',
      categoryKey: 'texnika',
      sku: '478005604',
      unit: 'dona',
      price: 850000,
      qty: 1,
      stock: 4,
      iconType: 'tractor',
    },
  ];

  // Savatdagi tovarlar
  const [cart, setCart] = useState<CartItem[]>([demoProducts[0], demoProducts[1]]);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'debt'>('cash');

  // Nasiya (Qarz) savdosi uchun mijozlar boshqaruvi
  const [existingDebtors, setExistingDebtors] = useState([
    { id: 'deb-1', name: 'Jamshid aka (Issiqxona)', phone: '+998 90 234 56 78', currentDebt: 850000, limit: 5000000 },
    { id: 'deb-2', name: 'Rustam Karimov (Fermer)', phone: '+998 93 456 78 90', currentDebt: 2250000, limit: 10000000 },
    { id: 'deb-3', name: 'Bahrom aka (Qibray Yem)', phone: '+998 97 789 01 23', currentDebt: 1450000, limit: 7000000 },
    { id: 'deb-4', name: 'Dilshodbek Toshmatov', phone: '+998 91 112 33 44', currentDebt: 680000, limit: 3000000 },
  ]);

  const [debtorMode, setDebtorMode] = useState<'existing' | 'new'>('existing');
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>('deb-1');
  const [newDebtorName, setNewDebtorName] = useState('');
  const [newDebtorPhone, setNewDebtorPhone] = useState('+998 ');
  const [debtDueDays, setDebtDueDays] = useState('30');
  const [confirmedDebtor, setConfirmedDebtor] = useState<{ name: string; phone: string; dueDays: string } | null>(null);

  const selectedDebtor = existingDebtors.find((d) => d.id === selectedDebtorId);

  const addToCart = (product: CartItem) => {
    haptic.light();
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    haptic.selection();
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    haptic.medium();
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Telegram va Brauzer orqali shtrix-kod skaneri
  const handleScanBarcode = async () => {
    haptic.light();
    if (isTelegram) {
      const code = await scanQr('Dori yoki tovar shtrix-kodini skanerlang');
      if (code) {
        const found = demoProducts.find(
          (p) =>
            p.sku === code ||
            p.id === code ||
            p.name.toLowerCase().includes(code.toLowerCase())
        );
        if (found) {
          addToCart(found);
          haptic.success();
          setScanMessage(`"${found.name}" savatga qo‘shildi!`);
          setTimeout(() => setScanMessage(null), 3500);
        } else {
          setSearch(code);
          haptic.warning();
          setScanMessage(`Shtrix-kod: ${code} (katalogdan qidirilmoqda)`);
          setTimeout(() => setScanMessage(null), 3500);
        }
      }
    } else {
      const code = prompt('Shtrix-kodni kiriting (Namuna: 478001201, 478001202, 478002301):', '478001201');
      if (code) {
        const found = demoProducts.find(
          (p) =>
            p.sku === code ||
            p.id === code ||
            p.name.toLowerCase().includes(code.toLowerCase())
        );
        if (found) {
          addToCart(found);
          haptic.success();
          setScanMessage(`"${found.name}" savatga qo‘shildi!`);
          setTimeout(() => setScanMessage(null), 3500);
        } else {
          setSearch(code);
        }
      }
    }
  };

  // Jami summa hisoblash (bo'sh bo'lsa 0 so'm)
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Qidiruv bo'yicha to'liq katalog (Nom, kategoriya yoki shtrix-kod bo'yicha)
  const filteredProducts = demoProducts.filter((p) => {
    const q = search.toLowerCase().trim();
    if (q === '') return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  });

  const handleCheckout = () => {
    haptic.success();
    if (paymentType === 'debt') {
      if (debtorMode === 'new') {
        if (!newDebtorName.trim()) {
          alert("Iltimos, yangi qarzdor mijozning ismini kiriting!");
          return;
        }
        const newEntry = {
          id: `deb-${Date.now()}`,
          name: newDebtorName.trim(),
          phone: newDebtorPhone.trim() || '+998 -- --- -- --',
          currentDebt: totalAmount,
          limit: 5000000,
        };
        setExistingDebtors((prev) => [newEntry, ...prev]);
        setConfirmedDebtor({
          name: newEntry.name,
          phone: newEntry.phone,
          dueDays: debtDueDays,
        });
      } else {
        const found = existingDebtors.find((d) => d.id === selectedDebtorId);
        setConfirmedDebtor({
          name: found?.name ?? 'Mijoz',
          phone: found?.phone ?? '',
          dueDays: debtDueDays,
        });
      }
    } else {
      setConfirmedDebtor(null);
    }
    setPaymentSuccess(true);
  };

  const resetSale = () => {
    setCart([]);
    setCheckoutModalOpen(false);
    setPaymentSuccess(false);
    setPaymentType('cash');
    setNewDebtorName('');
    setNewDebtorPhone('+998 ');
    setConfirmedDebtor(null);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Sarlavha & Smena holati */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111215] tracking-tight">
            Kassa & Savdo Terminali (POS)
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Tezkor savdo: tovarlarni tanlang va to‘lovni amalga oshiring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/70 px-4 py-2 rounded-full shadow-2xs text-xs font-bold text-slate-700">
            <span>Kassa smenasi:</span> <span className="text-[#35ca56] font-extrabold">Faol ochiq</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ASOSIY POS QISMI:                                        */}
      {/* CHAPDA: TOVARLAR KATALOGI VA FAQAT QIDIRUV (7 ustun)     */}
      {/* O'NGDA: SAVDO SAVATCHASI (PINNED / STICKY) (5 ustun)      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* CHAP TOMON: TOVARLAR KATALOGI VA FAQAT QIDIRUV MAYDONI   */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-[#efefec] rounded-[32px] p-6 sm:p-7 shadow-2xs space-y-5 border-0">
          
          {/* FAQAT QIDIRUV MAYDONI VA TELEGRAM KAMERA SKANERI */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Dori nomi yoki shtrix-kodni skanerlang..."
                  className="w-full bg-white rounded-full py-3.5 pl-11 pr-10 text-xs sm:text-sm font-semibold text-[#111215] placeholder:text-neutral-400 shadow-2xs border-0 focus:outline-none focus:ring-2 focus:ring-[#111215]/20 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3.5 top-3.5 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Telegram Kamera Shtrix-kod Skaneri Tugmasi */}
              <button
                type="button"
                onClick={handleScanBarcode}
                className="flex items-center gap-2 bg-[#111215] hover:bg-[#383838] text-white px-4 py-3.5 rounded-full text-xs font-bold shadow-2xs transition-transform active:scale-95 cursor-pointer shrink-0"
                title="Kamerada shtrix-kodni skanerlash"
              >
                <ScanBarcode className="h-4 w-4 text-[#35ca56]" />
                <span className="hidden sm:inline">Skaner</span>
              </button>
            </div>

            {/* Skaner muvaffaqiyat / topildi bildirishnomasi */}
            {scanMessage && (
              <div className="bg-[#eafaf0] text-[#1f7a34] text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center justify-between animate-in fade-in duration-150">
                <span>{scanMessage}</span>
                <button onClick={() => setScanMessage(null)} className="cursor-pointer text-[#1f7a34]/60 hover:text-[#1f7a34]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Qidiruv holati ko'rsatkichi */}
            {search.trim().length > 0 && (
              <div className="text-xs font-semibold text-neutral-500 px-2 flex items-center justify-between pt-1">
                <span>«{search}» bo‘yicha <b>{filteredProducts.length}</b> ta tovar topildi</span>
                <button
                  onClick={() => setSearch('')}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Tozalash
                </button>
              </div>
            )}
          </div>

          {/* Tovar kartochkalari to'plami (Minimalist, Ixcham va Tezkor) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[660px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-neutral-400 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-2xs">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <p className="font-extrabold text-sm text-[#111215]">Hech qanday tovar topilmadi</p>
                <p className="text-xs text-neutral-400">
                  Qidiruv so‘zini to‘g‘ri kiritganingizni tekshiring yoki shtrix-kodni qaytadan skanerlang
                </p>
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-2xs border-0 hover:shadow-md hover:bg-neutral-50/90 transition-all cursor-pointer flex flex-col justify-between group min-h-[92px] active:scale-[0.98]"
                >
                  {/* Yuqori qator: Ikonka, Tovar nomi va Zaxira */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <ItemIcon type={p.iconType} variant="badge" className="h-3.5 w-3.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs text-[#111215] truncate leading-tight group-hover:text-[#35ca56] transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-mono truncate mt-0.5">
                        {p.sku ?? p.category}
                      </p>
                    </div>
                  </div>

                  {/* Pastki qator: Narx, O'lchov birligi va Tezkor qo'shish */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100/80 mt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-xs text-[#111215]">
                        {p.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400">
                        so‘m
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-[#249b3e] bg-[#eafaf0] px-2 py-0.5 rounded-full whitespace-nowrap">
                        {p.stock} {p.unit}
                      </span>
                      <div
                        className="w-6 h-6 rounded-full bg-[#111215] text-white flex items-center justify-center group-hover:bg-[#35ca56] transition-colors shadow-2xs flex-shrink-0"
                        title="Savatchaga qo‘shish"
                      >
                        <Plus className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* ======================================================== */}
        {/* O'NG TOMON: SAVDO SAVATCHASI (PINNED / STICKY) (5 ustun)  */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-[#efefec] rounded-[32px] p-6 sm:p-7 shadow-2xs space-y-4 flex flex-col justify-between min-h-[660px] lg:sticky lg:top-6 border-0">
          
          <div className="space-y-4">
            
            {/* Savat Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-300/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#111215] shadow-2xs">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#111215]">Savdo Savatchasi</h3>
                  <p className="text-xs text-neutral-400 font-medium">
                    {cart.length > 0 ? `${cart.length} xil tovar tanlandi` : 'Savatcha bo‘sh'}
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-full shadow-2xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Tozalash</span>
                </button>
              )}
            </div>

            {/* Savatdagi tovarlar ro'yxati */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-neutral-400 space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-2xs">
                    <ShoppingCart className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="font-extrabold text-sm text-[#111215]">Savatcha bo‘sh</p>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Chap tarafdagi katalogdan kerakli tovar yoki dori ustiga bosing
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-3.5 shadow-2xs border-0 flex items-center justify-between gap-3 hover:bg-neutral-50/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-[#111215] truncate">{item.name}</p>
                      <p className="text-xs text-neutral-400 font-medium mt-0.5">
                        {item.price.toLocaleString()} so‘m / {item.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Miqdor o'zgartirish (- / +) */}
                      <div className="flex items-center bg-[#f7f7f5] rounded-xl p-1 gap-2">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#111215] hover:bg-neutral-200 shadow-2xs cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-black text-xs min-w-4 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#111215] hover:bg-neutral-200 shadow-2xs cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Tovar jami summasi */}
                      <span className="font-black text-xs sm:text-sm text-[#111215] min-w-[70px] text-right">
                        {(item.price * item.qty).toLocaleString()}
                      </span>

                      {/* Olib tashlash */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-neutral-300 hover:text-rose-500 p-1 cursor-pointer"
                        title="Olib tashlash"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* ======================================================== */}
          {/* PASTKI PINNED BLOK:                                      */}
          {/* Jami Summa: 0 so'm (yoki hisoblangan summa)              */}
          {/* To'lovga o'tish (Fiskal Chek) DOIMIY CHIQIB TURADI!       */}
          {/* ======================================================== */}
          <div className="pt-4 border-t border-neutral-300/50 space-y-3 bg-[#efefec] rounded-b-[28px]">
            <div className="flex items-center justify-between px-1">
              <span className="font-bold text-xs text-neutral-500 uppercase tracking-wider">Jami Summa:</span>
              <span className="text-2xl sm:text-3xl font-black text-[#111215] tracking-tight">
                {totalAmount.toLocaleString()} so‘m
              </span>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => setCheckoutModalOpen(true)}
              className="w-full bg-[#111215] hover:bg-black disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-extrabold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>To‘lovga o‘tish (Fiskal Chek)</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* TO'LOV VA CHEK MODAL OYNASI                               */}
      {/* ======================================================== */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] p-6 sm:p-7 max-w-md w-full shadow-2xl border-0 space-y-5 animate-in zoom-in-95 duration-150">
            
            {paymentSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-extrabold text-[#111215]">To‘lov muvaffaqiyatli yakunlandi!</h3>
                <p className="text-xs text-slate-500">
                  Chek chop etildi va kassa tushumiga {totalAmount.toLocaleString()} so‘m qo‘shildi.
                </p>

                <div className="p-4 bg-[#f7f7f5] rounded-2xl text-left text-xs space-y-1.5 font-mono">
                  <p className="font-bold text-[#111215] border-b border-neutral-200 pb-1">CHEK #CHK-98421</p>
                  <p>Summa: <b className="text-[#111215]">{totalAmount.toLocaleString()} so‘m</b></p>
                  <p>Usul: {paymentType === 'cash' ? 'Naqd pul' : paymentType === 'card' ? 'Karta orqali' : 'Nasiya (Qarz daftari)'}</p>
                  {confirmedDebtor && (
                    <>
                      <p>Qarzdor: <b className="text-amber-800">{confirmedDebtor.name}</b></p>
                      <p>Telefon: {confirmedDebtor.phone}</p>
                      <p>Qaytarish muddati: <b>{confirmedDebtor.dueDays} kun</b></p>
                    </>
                  )}
                  <p className="text-[11px] text-neutral-400 pt-1">Sana: {new Date().toLocaleString('uz-UZ')}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-white border border-neutral-200 py-3.5 rounded-2xl text-xs font-bold text-[#111215] hover:bg-neutral-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="h-4 w-4" /> Chekni chop etish
                  </button>
                  <button
                    onClick={resetSale}
                    className="flex-1 bg-[#111215] text-white py-3.5 rounded-2xl text-xs font-bold hover:bg-black cursor-pointer shadow-xs"
                  >
                    Yangi savdo ochish
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <h3 className="text-lg font-extrabold text-[#111215]">To‘lov turini tanlang</h3>
                  <button onClick={() => setCheckoutModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="text-center py-1">
                  <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">To‘lanadigan Summa</p>
                  <h2 className="text-3xl font-black text-[#111215] mt-1">
                    {totalAmount.toLocaleString()} so‘m
                  </h2>
                </div>

                {/* 3 ta to'lov turi kartochkalari */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setPaymentType('cash')}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      paymentType === 'cash'
                        ? 'border-[#35ca56] bg-[#eafaf0] text-[#1f7a34] font-extrabold shadow-2xs'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold'
                    }`}
                  >
                    <Banknote className="h-5 w-5 text-[#35ca56]" />
                    <span className="text-xs">Naqd pul</span>
                  </button>

                  <button
                    onClick={() => setPaymentType('card')}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      paymentType === 'card'
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-extrabold shadow-2xs'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="text-xs">Karta</span>
                  </button>

                  <button
                    onClick={() => setPaymentType('debt')}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      paymentType === 'debt'
                        ? 'border-amber-600 bg-amber-50 text-amber-800 font-extrabold shadow-2xs'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold'
                    }`}
                  >
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="text-xs">Nasiya (Qarz)</span>
                  </button>
                </div>

                {/* ======================================================== */}
                {/* NASIYA (QARZ) TANLANGANDA: MAVJUDDAN TANLASH YOKI YANGI  */}
                {/* ======================================================== */}
                {paymentType === 'debt' && (
                  <div className="bg-[#f7f7f5] rounded-2xl p-4 space-y-3 text-left animate-in fade-in duration-150 border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#111215]">Qarzdor Mijoz:</span>
                      
                      {/* Rejimni tanlash (Mavjud / Yangi) */}
                      <div className="inline-flex rounded-full bg-white p-0.5 shadow-2xs text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setDebtorMode('existing')}
                          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                            debtorMode === 'existing'
                              ? 'bg-[#111215] text-white shadow-xs'
                              : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                        >
                          Mavjuddan tanlash
                        </button>
                        <button
                          type="button"
                          onClick={() => setDebtorMode('new')}
                          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                            debtorMode === 'new'
                              ? 'bg-[#111215] text-white shadow-xs'
                              : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                        >
                          + Yangi qo‘shish
                        </button>
                      </div>
                    </div>

                    {/* 1. MAVJUD QARZDORLARDAN TANLASH */}
                    {debtorMode === 'existing' ? (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-neutral-500">
                          Qarz daftaridagi mijozni tanlang:
                        </label>
                        <select
                          value={selectedDebtorId}
                          onChange={(e) => setSelectedDebtorId(e.target.value)}
                          className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#111215] border-0 shadow-2xs focus:ring-2 focus:ring-[#111215]/20 cursor-pointer"
                        >
                          {existingDebtors.map((deb) => (
                            <option key={deb.id} value={deb.id}>
                              {deb.name} ({deb.phone})
                            </option>
                          ))}
                        </select>
                        
                        {selectedDebtor && (
                          <div className="flex items-center justify-between text-xs text-neutral-500 px-1 font-semibold pt-0.5">
                            <span>Amaldagi qarzi: <b className="text-amber-800">{selectedDebtor.currentDebt.toLocaleString()} so‘m</b></span>
                            <span>Limit: {selectedDebtor.limit.toLocaleString()} so‘m</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-bold text-neutral-500">To‘lash muddati:</span>
                          <select
                            value={debtDueDays}
                            onChange={(e) => setDebtDueDays(e.target.value)}
                            className="bg-white rounded-xl px-3 py-1.5 text-xs font-bold text-[#111215] border-0 shadow-2xs cursor-pointer"
                          >
                            <option value="15">15 kun ichida</option>
                            <option value="30">30 kun ichida</option>
                            <option value="45">45 kun ichida</option>
                            <option value="60">60 kun ichida</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      /* 2. YANGI QARZDOR QO'SHISH */
                      <div className="space-y-2.5">
                        <label className="block text-[11px] font-bold text-neutral-500">
                          Yangi qarzdor rekvizitlari:
                        </label>
                        <input
                          type="text"
                          value={newDebtorName}
                          onChange={(e) => setNewDebtorName(e.target.value)}
                          placeholder="Mijoz to‘liq ismi (masalan: Otabek Norov)..."
                          className="w-full bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#111215] placeholder:text-neutral-400 border-0 shadow-2xs focus:ring-2 focus:ring-[#111215]/20"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newDebtorPhone}
                            onChange={(e) => setNewDebtorPhone(e.target.value)}
                            placeholder="+998 90 123 45 67"
                            className="flex-1 bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#111215] placeholder:text-neutral-400 border-0 shadow-2xs focus:ring-2 focus:ring-[#111215]/20 font-mono"
                          />
                          <select
                            value={debtDueDays}
                            onChange={(e) => setDebtDueDays(e.target.value)}
                            className="bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#111215] border-0 shadow-2xs cursor-pointer"
                          >
                            <option value="15">15 kun</option>
                            <option value="30">30 kun</option>
                            <option value="45">45 kun</option>
                            <option value="60">60 kun</option>
                          </select>
                        </div>
                        <p className="text-[10px] text-neutral-400 px-1">
                          * Yangi qarzdor avtomatik tarzda Qarz Daftariga qo‘shiladi
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={paymentType === 'debt' && debtorMode === 'new' && !newDebtorName.trim()}
                  className="w-full bg-[#111215] hover:bg-black disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-extrabold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#35ca56]" />
                  <span>
                    {paymentType === 'debt'
                      ? 'Nasiyani rasmiylashtirish'
                      : 'To‘lovni tasdiqlash'}
                  </span>
                </button>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};