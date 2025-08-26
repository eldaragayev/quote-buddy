import { InvoiceItem, DiscountType } from '../types/database';

export interface InvoiceCalculation {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export const calculateInvoiceTotal = (
  items: InvoiceItem[],
  discountType?: DiscountType | null,
  discountValue?: number | null,
  taxRate?: number | null
): InvoiceCalculation => {
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  
  let discountAmount = 0;
  if (discountType && discountValue) {
    if (discountType === 'percent') {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      discountAmount = Math.min(discountValue, subtotal);
    }
  }
  
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = taxRate ? afterDiscount * (taxRate / 100) : 0;
  const total = afterDiscount + taxAmount;
  
  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
};

export const calculateLineTotal = (qty: number, rate: number): number => {
  return qty * rate;
};