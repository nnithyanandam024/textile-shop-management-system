import { useState, useEffect, useCallback, useRef } from 'react';
import {
  staffPOSService,
  StaffPOSProductItem,
  StaffPOSCartItem,
  StaffPOSCustomerItem,
  StaffPOSInvoiceData,
  StaffPOSHeldSaleItem,
  StaffMySalesSummary,
} from '../services/staffPOSService';

export function useStaffPOS() {
  // Product Search & Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<StaffPOSProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cart State
  const [cart, setCart] = useState<StaffPOSCartItem[]>([]);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Customer State
  const [customers, setCustomers] = useState<StaffPOSCustomerItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<StaffPOSCustomerItem | null>(null);
  const [customerHistory, setCustomerHistory] = useState<{ orderCount: number; lifetimeSpend: number; lastPurchaseDate?: string } | null>(null);

  // Held Sales
  const [heldSales, setHeldSales] = useState<StaffPOSHeldSaleItem[]>([]);

  // Modals & UI State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHeldSalesModalOpen, setIsHeldSalesModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<StaffPOSInvoiceData | null>(null);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Personal Sales Summary (for MySales tab/page)
  const [mySales, setMySales] = useState<StaffMySalesSummary | null>(null);

  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // 1. Load initial catalog & customers
  const loadInitialData = useCallback(async () => {
    try {
      const [productList, custList, heldList] = await Promise.all([
        staffPOSService.searchProducts(''),
        staffPOSService.getCustomers(''),
        staffPOSService.getHeldSales(),
      ]);
      setProducts(productList);
      setCustomers(custList);
      setHeldSales(heldList);

      // Default to Walk-in Customer
      const walkIn = custList.find((c) => c.name.toLowerCase().includes('walk-in')) || custList[0] || null;
      setSelectedCustomer(walkIn);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize POS.');
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Barcode scanner hardware listener
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // If user is typing in an input field, let normal typing occur
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 100) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 4) {
          const barcode = barcodeBufferRef.current.trim();
          barcodeBufferRef.current = '';
          try {
            const product = await staffPOSService.getProductByBarcode(barcode);
            if (product) {
              handleAddToCart(product);
              setSuccessMessage(`Scanned: ${product.productName}`);
            } else {
              setError(`Barcode #${barcode} not found in catalog.`);
            }
          } catch (err: any) {
            setError(err.message || 'Barcode scan lookup error.');
          }
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, cart]);

  // 3. Search Products handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setLoadingProducts(true);
    try {
      const results = await staffPOSService.searchProducts(query);
      setProducts(results);
    } catch (err: any) {
      setError(err.message || 'Product search failed.');
    } finally {
      setLoadingProducts(false);
    }
  };

  // 4. Cart Add / Update / Remove
  const handleAddToCart = (product: StaffPOSProductItem) => {
    if (product.currentStock <= 0) {
      setError(`Cannot add ${product.productName}: Product is Out of Stock.`);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.variantId === product.id);
      if (existingIdx >= 0) {
        const item = prev[existingIdx];
        if (item.quantity + 1 > product.currentStock) {
          setError(`Only ${product.currentStock} units available for ${product.productName}.`);
          return prev;
        }
        const updated = [...prev];
        const newQty = item.quantity + 1;
        const lineSubtotal = newQty * item.unitPrice;
        const lineDiscount = Math.round((lineSubtotal * (item.discountPercent || 0)) / 100);
        const lineTaxable = lineSubtotal - lineDiscount;
        const lineTax = Math.round((lineTaxable * (item.taxRate || 0)) / 100);

        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          lineSubtotal,
          lineDiscount,
          lineTax,
          lineTotal: lineTaxable + lineTax,
        };
        return updated;
      } else {
        const lineSubtotal = product.sellingPrice;
        const lineTaxable = lineSubtotal;
        const lineTax = Math.round((lineTaxable * (product.taxRate || 0)) / 100);

        return [
          ...prev,
          {
            variantId: product.id,
            productId: product.productId,
            productName: product.productName,
            sku: product.sku,
            barcode: product.barcode,
            size: product.size,
            color: product.color,
            unitPrice: product.sellingPrice,
            quantity: 1,
            availableStock: product.currentStock,
            taxRate: product.taxRate || 0,
            discountPercent: 0,
            lineSubtotal,
            lineDiscount: 0,
            lineTax,
            lineTotal: lineTaxable + lineTax,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (variantId: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(variantId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.variantId === variantId) {
          if (newQty > item.availableStock) {
            setError(`Only ${item.availableStock} units available for ${item.productName}.`);
            return item;
          }
          const lineSubtotal = newQty * item.unitPrice;
          const lineDiscount = Math.round((lineSubtotal * (item.discountPercent || 0)) / 100);
          const lineTaxable = lineSubtotal - lineDiscount;
          const lineTax = Math.round((lineTaxable * (item.taxRate || 0)) / 100);

          return {
            ...item,
            quantity: newQty,
            lineSubtotal,
            lineDiscount,
            lineTax,
            lineTotal: lineTaxable + lineTax,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (variantId: number) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountValue(0);
  };

  // 5. Customer Selection & Quick Create
  const handleSelectCustomer = async (cust: StaffPOSCustomerItem) => {
    setSelectedCustomer(cust);
    try {
      const history = await staffPOSService.getCustomerHistory(cust.id);
      setCustomerHistory(history);
    } catch {
      // Ignore
    }
  };

  const handleQuickCreateCustomer = async (input: { name: string; phone?: string; email?: string; address?: string }) => {
    try {
      const res = await staffPOSService.quickCreateCustomer(input);
      setCustomers((prev) => [res.customer, ...prev]);
      setSelectedCustomer(res.customer);
      setIsCustomerModalOpen(false);
      setSuccessMessage(`Customer ${res.customer.name} registered.`);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer.');
    }
  };

  // 6. Totals calculation preview
  const subtotal = cart.reduce((sum, i) => sum + i.lineSubtotal, 0);
  const itemDiscounts = cart.reduce((sum, i) => sum + i.lineDiscount, 0);
  const billDiscount = discountType === 'PERCENT'
    ? Math.round((subtotal * discountValue) / 100)
    : Math.min(discountValue, subtotal);
  const totalDiscount = itemDiscounts + billDiscount;
  const totalTax = cart.reduce((sum, i) => sum + i.lineTax, 0);
  const totalPayable = Math.max(0, subtotal - totalDiscount + totalTax);

  // 7. Hold & Resume Sale
  const handleHoldSale = async (referenceName?: string) => {
    if (cart.length === 0) {
      setError('Cannot hold an empty cart.');
      return;
    }
    try {
      const res = await staffPOSService.holdSale({
        referenceName: referenceName || `${selectedCustomer?.name || 'Walk-in'} (${cart.length} items)`,
        customerId: selectedCustomer?.id,
        cartData: {
          cart,
          discountType,
          discountValue,
          customer: selectedCustomer,
        },
        subtotal,
        discountAmount: totalDiscount,
        taxAmount: totalTax,
        totalAmount: totalPayable,
      });

      setSuccessMessage(res.message);
      handleClearCart();
      const updatedHeld = await staffPOSService.getHeldSales();
      setHeldSales(updatedHeld);
    } catch (err: any) {
      setError(err.message || 'Failed to hold sale.');
    }
  };

  const handleResumeSale = async (heldId: number) => {
    try {
      const held = await staffPOSService.resumeSale(heldId);
      const savedData = held.cartData;
      if (savedData && savedData.cart) {
        setCart(savedData.cart);
        setDiscountType(savedData.discountType || 'PERCENT');
        setDiscountValue(savedData.discountValue || 0);
        if (savedData.customer) {
          setSelectedCustomer(savedData.customer);
        }
      }
      setIsHeldSalesModalOpen(false);
      setSuccessMessage(`Resumed held sale: ${held.referenceName}`);
      const updatedHeld = await staffPOSService.getHeldSales();
      setHeldSales(updatedHeld);
    } catch (err: any) {
      setError(err.message || 'Failed to resume held sale.');
    }
  };

  const handleCancelHeldSale = async (heldId: number) => {
    try {
      await staffPOSService.cancelHeldSale(heldId);
      const updatedHeld = await staffPOSService.getHeldSales();
      setHeldSales(updatedHeld);
      setSuccessMessage('Held cart discarded.');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel held sale.');
    }
  };

  // 8. Checkout Execution
  const handleCheckout = async (payments: Array<{ method: string; amount: number; referenceNumber?: string }>, notes?: string) => {
    if (cart.length === 0) {
      setError('Cart is empty.');
      return;
    }
    if (!selectedCustomer) {
      setError('Please select a customer.');
      return;
    }

    try {
      const invoice = await staffPOSService.completeSale({
        customerId: selectedCustomer.id,
        items: cart.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent,
        })),
        discountType,
        discountValue,
        payments: payments as any,
        notes,
      });

      setActiveInvoice(invoice);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
      handleClearCart();
      setSuccessMessage(`Sale completed! Invoice #${invoice.invoiceNumber}`);

      // Refresh product catalog stock
      const freshProducts = await staffPOSService.searchProducts(searchQuery);
      setProducts(freshProducts);
    } catch (err: any) {
      setError(err.message || 'Checkout failed.');
      throw err;
    }
  };

  // 9. Returns Handling
  const handleProcessReturn = async (input: {
    saleId: number;
    items: Array<{ saleItemId: number; variantId: number; quantity: number; reason: string; condition?: string }>;
    notes?: string;
  }) => {
    try {
      const res = await staffPOSService.createReturnRequest(input);
      setSuccessMessage(res.message);
      setIsReturnModalOpen(false);
      // Refresh products stock
      const freshProducts = await staffPOSService.searchProducts(searchQuery);
      setProducts(freshProducts);
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to process return.');
      throw err;
    }
  };

  // 10. Load Personal Sales Summary
  const loadMySales = useCallback(async (period: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL' = 'TODAY') => {
    try {
      const summary = await staffPOSService.getMySales({ period });
      setMySales(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load personal sales.');
    }
  }, []);

  return {
    searchQuery,
    products,
    loadingProducts,
    cart,
    discountType,
    discountValue,
    customers,
    selectedCustomer,
    customerHistory,
    heldSales,
    subtotal,
    totalDiscount,
    totalTax,
    totalPayable,
    activeInvoice,
    isCustomerModalOpen,
    isPaymentModalOpen,
    isHeldSalesModalOpen,
    isReceiptModalOpen,
    isReturnModalOpen,
    error,
    successMessage,
    mySales,
    setDiscountType,
    setDiscountValue,
    setIsCustomerModalOpen,
    setIsPaymentModalOpen,
    setIsHeldSalesModalOpen,
    setIsReceiptModalOpen,
    setIsReturnModalOpen,
    onSearch: handleSearch,
    onAddToCart: handleAddToCart,
    onUpdateQuantity: handleUpdateQuantity,
    onRemoveItem: handleRemoveItem,
    onClearCart: handleClearCart,
    onSelectCustomer: handleSelectCustomer,
    onQuickCreateCustomer: handleQuickCreateCustomer,
    onHoldSale: handleHoldSale,
    onResumeSale: handleResumeSale,
    onCancelHeldSale: handleCancelHeldSale,
    onCheckout: handleCheckout,
    onProcessReturn: handleProcessReturn,
    loadMySales,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMessage(null),
    refresh: () => {
      loadInitialData();
      handleSearch(searchQuery);
    },
  };
}
