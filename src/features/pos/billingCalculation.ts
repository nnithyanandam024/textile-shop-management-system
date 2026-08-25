export interface CartItemCalculationInput {
  variantId: number;
  productId?: number;
  productName: string;
  sku: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  discountType?: 'FIXED' | 'PERCENT';
  discountValue?: number;
  taxRate?: number; // e.g. 5 for 5%
}

export interface BillCalculationInput {
  items: CartItemCalculationInput[];
  billDiscountType?: 'FIXED' | 'PERCENT';
  billDiscountValue?: number;
  defaultTaxRate?: number; // e.g. 5
  isInterstate?: boolean;
}

export interface CalculatedItem {
  variantId: number;
  productId?: number;
  productName: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  rawTotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface BillCalculationResult {
  items: CalculatedItem[];
  subtotal: number;
  totalItemDiscount: number;
  billDiscountAmount: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  rawGrandTotal: number;
  roundOffAmount: number;
  grandTotal: number;
  totalItemsCount: number;
  totalUnitsCount: number;
}

export class BillingCalculationEngine {
  /**
   * Performs deterministic, verified billing and tax calculations
   */
  public static calculateBill(input: BillCalculationInput): BillCalculationResult {
    const defaultTaxRate = input.defaultTaxRate !== undefined ? input.defaultTaxRate : 5.0;
    const isInterstate = !!input.isInterstate;

    let subtotal = 0;
    let totalItemDiscount = 0;
    let totalUnitsCount = 0;

    // 1. Calculate each item's net taxable base
    const calculatedItems: CalculatedItem[] = input.items.map((item) => {
      const qty = Math.max(1, Math.floor(item.quantity || 1));
      const price = Math.max(0, Number(item.unitPrice || 0));
      const rawTotal = qty * price;
      totalUnitsCount += qty;
      subtotal += rawTotal;

      let itemDisc = 0;
      if (item.discountType === 'PERCENT') {
        const pct = Math.min(100, Math.max(0, Number(item.discountValue || 0)));
        itemDisc = (rawTotal * pct) / 100;
      } else {
        itemDisc = Math.min(rawTotal, Math.max(0, Number(item.discountValue || 0)));
      }
      totalItemDiscount += itemDisc;

      const itemTaxable = Math.max(0, rawTotal - itemDisc);
      const taxRate = item.taxRate !== undefined ? item.taxRate : defaultTaxRate;
      const taxAmount = (itemTaxable * taxRate) / 100;
      const lineTotal = itemTaxable + taxAmount;

      return {
        variantId: item.variantId,
        productId: item.productId,
        productName: item.productName || 'Textile Item',
        sku: item.sku || 'SKU-UNKNOWN',
        hsnCode: item.hsnCode || '5208',
        quantity: qty,
        unitPrice: price,
        rawTotal,
        discountAmount: Number(itemDisc.toFixed(2)),
        taxableAmount: Number(itemTaxable.toFixed(2)),
        taxRate,
        taxAmount: Number(taxAmount.toFixed(2)),
        lineTotal: Number(lineTotal.toFixed(2)),
      };
    });

    const netItemsSubtotal = Math.max(0, subtotal - totalItemDiscount);

    // 2. Bill-Level Discount
    let billDiscountAmount = 0;
    if (input.billDiscountType === 'PERCENT') {
      const pct = Math.min(100, Math.max(0, Number(input.billDiscountValue || 0)));
      billDiscountAmount = (netItemsSubtotal * pct) / 100;
    } else {
      billDiscountAmount = Math.min(netItemsSubtotal, Math.max(0, Number(input.billDiscountValue || 0)));
    }

    const finalTaxableAmount = Math.max(0, netItemsSubtotal - billDiscountAmount);

    // 3. Tax Computation on taxable amount
    const totalTaxAmount = (finalTaxableAmount * defaultTaxRate) / 100;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterstate) {
      igstAmount = Number(totalTaxAmount.toFixed(2));
    } else {
      cgstAmount = Number((totalTaxAmount / 2).toFixed(2));
      sgstAmount = Number((totalTaxAmount / 2).toFixed(2));
    }

    // 4. Grand Total & Mathematical Round-off
    const rawGrandTotal = finalTaxableAmount + totalTaxAmount;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOffAmount = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

    return {
      items: calculatedItems,
      subtotal: Number(subtotal.toFixed(2)),
      totalItemDiscount: Number(totalItemDiscount.toFixed(2)),
      billDiscountAmount: Number(billDiscountAmount.toFixed(2)),
      totalDiscount: Number((totalItemDiscount + billDiscountAmount).toFixed(2)),
      taxableAmount: Number(finalTaxableAmount.toFixed(2)),
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
      rawGrandTotal: Number(rawGrandTotal.toFixed(2)),
      roundOffAmount,
      grandTotal: roundedGrandTotal,
      totalItemsCount: calculatedItems.length,
      totalUnitsCount,
    };
  }

  /**
   * Helper to convert numbers to Indian currency words format
   */
  public static amountToWords(amount: number): string {
    const num = Math.round(Math.abs(amount));
    if (num === 0) return 'Zero Rupees Only';

    const a = [
      '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
      'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
      'Seventeen ', 'Eighteen ', 'Nineteen '
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      let str = '';
      if (n > 99) {
        str += a[Math.floor(n / 100)] + 'Hundred ';
        n %= 100;
      }
      if (n > 19) {
        str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
      } else if (n > 0) {
        str += a[n];
      }
      return str;
    };

    let n = num;
    let res = '';

    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    if (crore > 0) res += inWords(crore) + 'Crore ';

    const lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) res += inWords(lakh) + 'Lakh ';

    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) res += inWords(thousand) + 'Thousand ';

    if (n > 0) res += inWords(n);

    return res.trim() + ' Rupees Only';
  }
}
