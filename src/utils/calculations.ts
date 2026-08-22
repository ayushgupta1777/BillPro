import { BillItem } from '../db/schema';

export function calculateRowAmount(quantity: number, rate: number): number {
  return Number((quantity * rate).toFixed(2));
}

export function calculateBillTotals(
  items: Partial<BillItem>[],
  cgstRate: number,
  sgstRate: number
) {
  let taxableAmount = 0;
  
  for (const item of items) {
    if (item.quantity && item.rate) {
      taxableAmount += calculateRowAmount(item.quantity, item.rate);
    }
  }

  // Calculate taxes
  const cgst = Number(((taxableAmount * cgstRate) / 100).toFixed(2));
  const sgst = Number(((taxableAmount * sgstRate) / 100).toFixed(2));
  
  // Calculate Grand Total
  const grandTotal = taxableAmount + cgst + sgst;

  return {
    taxableAmount,
    cgst,
    sgst,
    grandTotal
  };
}
