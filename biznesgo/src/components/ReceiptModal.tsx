import React from 'react';
import { Modal } from './Modal';
import { formatMoney, formatDate } from '../lib/utils';
import { Printer, ShieldCheck } from 'lucide-react';
import type { Sale, Merchant } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale | null;
  merchant?: Merchant | null;
  data?: {
    sale_id: number;
    items: any[];
    total: number;
    payment_type: string;
    store_name: string;
    date: string;
    customer_name?: string;
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale: propSale,
  merchant,
  data
}) => {
  if (!propSale && !data) return null;

  const sale: any = propSale || {
    id: data?.sale_id,
    created_at: data?.date,
    total_amount: data?.total,
    payment_type: data?.payment_type,
    customer_name: data?.customer_name,
    items: data?.items?.map((i: any) => ({
      product_name: i.product?.name || i.name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      unit: i.product?.unit || i.unit,
      warranty_months: i.product?.warranty_months
    }))
  };

  const paymentLabels: Record<string, string> = {
    cash: 'Naqd pul',
    card: 'Plastik karta',
    debt: 'Nasiya / Qarz'
  };

  const handlePrint = () => {
    window.print();
  };

  const storeTitle = merchant?.store_name || data?.store_name || 'BiznesGO Do‘kon';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sotuv Cheki"
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Yopish
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish</span>
          </button>
        </>
      }
    >
      <div id="printable-receipt" className="font-mono text-xs bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
        {/* Header */}
        <div className="text-center pb-3 border-b border-dashed border-slate-300">
          <div className="font-bold text-base text-slate-900">{storeTitle}</div>
          {merchant?.phone && <div className="text-slate-600 mt-0.5">{merchant.phone}</div>}
          {merchant?.address && <div className="text-slate-500 text-[11px] mt-0.5">{merchant.address}</div>}
          <div className="text-slate-700 font-bold mt-2">Sotuv #{sale.id}</div>
          <div className="text-slate-500 text-[10px]">{formatDate(sale.created_at, true)}</div>
        </div>

        {/* Items */}
        <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
          {sale.items?.map((it: any, idx: number) => (
            <div key={idx} className="space-y-0.5">
              <div className="font-bold text-slate-800 flex justify-between">
                <span>{it.product_name}</span>
                <span>{formatMoney(it.quantity * it.unit_price)}</span>
              </div>
              <div className="text-slate-500 text-[11px] flex justify-between">
                <span>{it.quantity} {it.unit || ''} × {formatMoney(it.unit_price)}</span>
              </div>
              {it.warranty_months && (
                <div className="text-sky-600 font-semibold text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Kafolat muddati: {it.warranty_months} oy</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-slate-700">
          {Boolean(sale.discount_amount && sale.discount_amount > 0) && (
            <div className="flex justify-between">
              <span>Chegirma:</span>
              <span className="text-rose-600">-{formatMoney(sale.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1">
            <span>JAMI:</span>
            <span className="text-emerald-700">{formatMoney(sale.total_amount)}</span>
          </div>
          <div className="flex justify-between text-slate-600 pt-1">
            <span>To'lov turi:</span>
            <span className="font-semibold">{paymentLabels[sale.payment_type] || sale.payment_type}</span>
          </div>
          {sale.customer_name && (
            <div className="flex justify-between text-slate-600">
              <span>Mijoz:</span>
              <span className="font-semibold">{sale.customer_name}</span>
            </div>
          )}
        </div>

        {/* Debt Section if debt */}
        {sale.debt && (
          <div className="py-2.5 border-b border-dashed border-slate-300 text-rose-700 font-semibold space-y-0.5">
            <div className="flex justify-between">
              <span>Yozilgan qarz:</span>
              <span>{formatMoney(sale.debt.total_debt || sale.debt.total_amount)}</span>
            </div>
            {sale.debt.due_date && (
              <div className="flex justify-between text-slate-600 font-normal text-[11px]">
                <span>Qaytarish muddati:</span>
                <span>{formatDate(sale.debt.due_date)}</span>
              </div>
            )}
          </div>
        )}

        <div className="text-center pt-3 text-slate-500 text-[11px]">
          Xaridingiz uchun rahmat!
        </div>
      </div>
    </Modal>
  );
};
