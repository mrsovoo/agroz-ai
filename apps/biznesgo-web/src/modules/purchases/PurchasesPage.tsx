import React, { useState } from 'react';
import { FileCheck2, AlertCircle, CheckCircle2, ArrowRight, Truck, PackageCheck, AlertTriangle } from 'lucide-react';
import { Button, Badge } from '../../shared/components';

interface ReconcileItem {
  id: string;
  name: string;
  unit: string;
  orderedQty: number;   // 1-bosqich: Biz buyurtma qilgan
  invoicedQty: number;  // 2-bosqich: Hamkor yuborgan invoys
  receivedQty: number;  // 3-bosqich: Omborda amalda qabul qilingan
}

export const PurchasesPage: React.FC = () => {
  const [items, setItems] = useState<ReconcileItem[]>([
    { id: '1', name: 'Kombikorm Broyler Start (50kg)', unit: 'qop', orderedQty: 50, invoicedQty: 50, receivedQty: 50 },
    { id: '2', name: 'Oksitetratsiklin 20% (100ml)', unit: 'flakon', orderedQty: 30, invoicedQty: 30, receivedQty: 28 }, // 2 ta kam keldi
    { id: '3', name: 'Tomchilatib sug‘orish lentasi 16mm', unit: 'metr', orderedQty: 2000, invoicedQty: 2500, receivedQty: 2500 }, // Hamkor ortiqcha yuborgan
    { id: '4', name: 'Vitamin B-Kompleks (Veterinariya)', unit: 'flakon', orderedQty: 20, invoicedQty: 20, receivedQty: 20 },
  ]);

  const [confirmed, setConfirmed] = useState(false);

  const updateReceived = (id: string, val: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, receivedQty: Math.max(0, val) } : item)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Tovar Kirimi: 3 Bosqichli Taqqoslash</h2>
            <Badge variant="info">Invoys #INV-9821</Badge>
          </div>
          <p className="text-xs text-slate-500">
            1-bosqich (Biz so‘ragan) vs 2-bosqich (Hamkor hisoboti) vs 3-bosqich (Omborga tushgan tovar)
          </p>
        </div>
        <Button
          size="md"
          variant="primary"
          onClick={() => setConfirmed(true)}
          disabled={confirmed}
        >
          <PackageCheck className="h-4 w-4 mr-1.5" />
          {confirmed ? 'Omborga Qabul Qilindi' : 'Taqqoslab Omborga Kiritish'}
        </Button>
      </div>

      {confirmed && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Tovar qoldiqqa muvaffaqiyatli qo‘shildi!</p>
            <p className="text-emerald-700">Kamomad va ortiqcha tovarlar yetkazib beruvchi bilan o‘zaro hisob-kitob jurnali (akt)da qayd etildi.</p>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="p-3">Mahsulot nomi</th>
                <th className="p-3 text-center bg-blue-50/50">1. Buyurtma Qilingan</th>
                <th className="p-3 text-center bg-amber-50/50">2. Hamkor Invoysi</th>
                <th className="p-3 text-center bg-emerald-50/50">3. Amalda Kelgan</th>
                <th className="p-3">Taqqoslash Natijasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const diff = item.receivedQty - item.orderedQty;
                const invoicedDiff = item.receivedQty - item.invoicedQty;

                let statusBadge = <Badge variant="success">Barchasi to‘liq</Badge>;
                if (invoicedDiff < 0) {
                  statusBadge = <Badge variant="danger">{Math.abs(invoicedDiff)} {item.unit} KAM KELGAN</Badge>;
                } else if (diff > 0) {
                  statusBadge = <Badge variant="warning">{diff} {item.unit} ORTIQCHA</Badge>;
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-800">{item.name}</td>
                    
                    {/* 1. Ordered */}
                    <td className="p-3 text-center font-semibold text-slate-600 bg-blue-50/20">
                      {item.orderedQty} {item.unit}
                    </td>

                    {/* 2. Invoiced */}
                    <td className="p-3 text-center font-semibold text-slate-700 bg-amber-50/20">
                      {item.invoicedQty} {item.unit}
                    </td>

                    {/* 3. Received Actual */}
                    <td className="p-3 text-center bg-emerald-50/20">
                      <input
                        type="number"
                        disabled={confirmed}
                        value={item.receivedQty}
                        onChange={(e) => updateReceived(item.id, parseInt(e.target.value || '0', 10))}
                        className="w-20 text-center font-bold text-sm bg-white border border-slate-300 rounded-md py-1 text-slate-900 focus:ring-2 focus:ring-emerald-700"
                      />
                    </td>

                    {/* Result */}
                    <td className="p-3 font-semibold">{statusBadge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

