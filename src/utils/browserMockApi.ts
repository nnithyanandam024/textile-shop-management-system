/**
 * Browser Mock API Bridge
 * Automatically provides persistent, reactive mock services on `window.api`
 * when previewing the application in standard web browser mode (Vite dev server).
 */

const STORAGE_KEYS = {
  PRODUCTS: 'texora_demo_products',
  VARIANTS: 'texora_demo_variants',
  CATEGORIES: 'texora_demo_categories',
  BRANDS: 'texora_demo_brands',
  SUPPLIERS: 'texora_demo_suppliers',
  CUSTOMERS: 'texora_demo_customers',
};

// Initial Demo Categories
const DEFAULT_CATEGORIES = [
  { id: 1, name: "Men's Wear", description: 'Formal shirts, casual t-shirts, trousers, and ethnic wear', parent_id: null, is_active: 1 },
  { id: 2, name: "Women's Wear", description: 'Pure silk sarees, designer kurtis, lehengas, and dresses', parent_id: null, is_active: 1 },
  { id: 3, name: 'Kids Wear', description: 'Boys and girls festive wear, frocks, and cotton sets', parent_id: null, is_active: 1 },
  { id: 4, name: 'Silks & Traditional', description: 'Kanchipuram, Banarasi, and Arani pure wedding silks', parent_id: null, is_active: 1 },
  { id: 5, name: 'Fabrics & Suiting', description: 'Unstitched suit lengths, fine linen, and shirting material', parent_id: null, is_active: 1 },
  { id: 6, name: 'Daily Cotton Kurtis', description: 'Breathable block-printed pure cotton kurtis', parent_id: 2, is_active: 1 },
  { id: 7, name: 'Silk Sarees', description: 'Pure mulberry silk with heavy gold and silver zari', parent_id: 4, is_active: 1 },
  { id: 8, name: 'Men Formal Shirts', description: 'Premium cotton and linen wrinkle-free shirts', parent_id: 1, is_active: 1 },
  { id: 9, name: 'Silk Dhotis & Sets', description: 'Traditional wedding dhotis with angavastram', parent_id: 1, is_active: 1 },
];

// Initial Demo Brands
const DEFAULT_BRANDS = [
  { id: 1, name: 'Raymond', description: 'Fine luxury fabrics, suiting, and formal shirting', is_active: 1 },
  { id: 2, name: 'Kanchipuram Silks', description: 'Handcrafted heritage mulberry silk sarees', is_active: 1 },
  { id: 3, name: 'FabIndia', description: 'Authentic Indian ethnic handloom and organic cotton', is_active: 1 },
  { id: 4, name: 'Ramraj Cotton', description: 'Pioneer in South Indian traditional dhotis and shirts', is_active: 1 },
  { id: 5, name: 'Peter England', description: 'Modern business formals and smart casuals', is_active: 1 },
  { id: 6, name: 'Manyavar', description: 'Celebration ethnic wear, kurtas, and sherwanis', is_active: 1 },
  { id: 7, name: 'Pothys Silks', description: 'Traditional textile house for silk weaves', is_active: 1 },
];

// Initial Demo Products
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Kanchipuram Pure Zari Silk Saree',
    category_id: 7,
    category_name: 'Silk Sarees',
    brand_id: 2,
    brand_name: 'Kanchipuram Silks',
    material: 'Pure Mulberry Silk',
    description: 'Exquisite bridal saree with rich peacock zari border and matching blouse piece',
    is_active: 1,
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 2,
    name: 'Raymond 100% Egyptian Cotton Formal Shirt',
    category_id: 8,
    category_name: 'Men Formal Shirts',
    brand_id: 1,
    brand_name: 'Raymond',
    material: 'Giza Egyptian Cotton',
    description: 'Tailored fit executive formal shirt with breathable weave and French cuffs',
    is_active: 1,
    created_at: '2026-01-12T11:30:00Z',
  },
  {
    id: 3,
    name: 'FabIndia Hand-Block Printed Cotton Kurti',
    category_id: 6,
    category_name: 'Daily Cotton Kurtis',
    brand_id: 3,
    brand_name: 'FabIndia',
    material: 'Organic Cotton',
    description: 'Artisanal indigo dye block print straight kurti with wooden button detailing',
    is_active: 1,
    created_at: '2026-01-15T09:15:00Z',
  },
  {
    id: 4,
    name: 'Ramraj Pure Silk Dhoti & Angavastram Set',
    category_id: 9,
    category_name: 'Silk Dhotis & Sets',
    brand_id: 4,
    brand_name: 'Ramraj Cotton',
    material: 'Pure Silk & Zari',
    description: 'Festive ceremonial 8-yard dhoti set with 2-inch rich gold zari border',
    is_active: 1,
    created_at: '2026-01-18T14:20:00Z',
  },
  {
    id: 5,
    name: 'Peter England Classic Business Formal Shirt',
    category_id: 8,
    category_name: 'Men Formal Shirts',
    brand_id: 5,
    brand_name: 'Peter England',
    material: 'Cotton Blend',
    description: 'Crisp regular fit business wear shirt suitable for daily corporate use',
    is_active: 1,
    created_at: '2026-01-20T16:00:00Z',
  },
  {
    id: 6,
    name: 'Manyavar Jacquard Silk Kurta & Churidar Set',
    category_id: 1,
    category_name: "Men's Wear",
    brand_id: 6,
    brand_name: 'Manyavar',
    material: 'Art Silk Jacquard',
    description: 'Festive embroidered mandarin collar kurta paired with ivory churidar',
    is_active: 1,
    created_at: '2026-01-22T13:45:00Z',
  },
  {
    id: 7,
    name: 'Banarasi Brocade Silk Saree',
    category_id: 7,
    category_name: 'Silk Sarees',
    brand_id: 7,
    brand_name: 'Pothys Silks',
    material: 'Banarasi Silk',
    description: 'Opulent woven brocade silk saree with intricate floral motifs and pallu',
    is_active: 1,
    created_at: '2026-01-25T15:10:00Z',
  },
];

// Initial Demo Variants
const DEFAULT_VARIANTS = [
  // Product 1 - Kanchipuram Silk Saree
  { id: 1, product_id: 1, sku: 'KAN-SLK-MRN-01', barcode: '89010001001', size: 'Free Size', color: 'Royal Maroon & Gold', purchase_price: 4500, selling_price: 8499, minimum_stock: 5, current_stock: 12, is_active: 1 },
  { id: 2, product_id: 1, sku: 'KAN-SLK-GRN-02', barcode: '89010001002', size: 'Free Size', color: 'Emerald Green & Gold', purchase_price: 4500, selling_price: 8499, minimum_stock: 5, current_stock: 8, is_active: 1 },
  { id: 3, product_id: 1, sku: 'KAN-SLK-NVY-03', barcode: '89010001003', size: 'Free Size', color: 'Royal Navy Blue', purchase_price: 4800, selling_price: 8999, minimum_stock: 4, current_stock: 6, is_active: 1 },

  // Product 2 - Raymond Cotton Shirt
  { id: 4, product_id: 2, sku: 'RAY-SHT-BLU-38', barcode: '89010002038', size: '38 (S)', color: 'Sky Blue', purchase_price: 750, selling_price: 1499, minimum_stock: 8, current_stock: 20, is_active: 1 },
  { id: 5, product_id: 2, sku: 'RAY-SHT-BLU-40', barcode: '89010002040', size: '40 (M)', color: 'Sky Blue', purchase_price: 750, selling_price: 1499, minimum_stock: 10, current_stock: 25, is_active: 1 },
  { id: 6, product_id: 2, sku: 'RAY-SHT-BLU-42', barcode: '89010002042', size: '42 (L)', color: 'Sky Blue', purchase_price: 750, selling_price: 1499, minimum_stock: 8, current_stock: 18, is_active: 1 },
  { id: 7, product_id: 2, sku: 'RAY-SHT-WHT-40', barcode: '89010002140', size: '40 (M)', color: 'Pure White', purchase_price: 750, selling_price: 1499, minimum_stock: 10, current_stock: 30, is_active: 1 },

  // Product 3 - FabIndia Kurti
  { id: 8, product_id: 3, sku: 'FAB-KUR-IND-S', barcode: '89010003001', size: 'S', color: 'Indigo Blue', purchase_price: 550, selling_price: 1299, minimum_stock: 5, current_stock: 15, is_active: 1 },
  { id: 9, product_id: 3, sku: 'FAB-KUR-IND-M', barcode: '89010003002', size: 'M', color: 'Indigo Blue', purchase_price: 550, selling_price: 1299, minimum_stock: 8, current_stock: 22, is_active: 1 },
  { id: 10, product_id: 3, sku: 'FAB-KUR-IND-L', barcode: '89010003003', size: 'L', color: 'Indigo Blue', purchase_price: 550, selling_price: 1299, minimum_stock: 6, current_stock: 16, is_active: 1 },
  { id: 11, product_id: 3, sku: 'FAB-KUR-MST-M', barcode: '89010003102', size: 'M', color: 'Mustard Yellow', purchase_price: 550, selling_price: 1299, minimum_stock: 6, current_stock: 14, is_active: 1 },

  // Product 4 - Ramraj Silk Dhoti
  { id: 12, product_id: 4, sku: 'RAM-DHO-GLD-01', barcode: '89010004001', size: '4.0 Meters', color: 'Cream / Gold Zari', purchase_price: 950, selling_price: 1899, minimum_stock: 10, current_stock: 28, is_active: 1 },

  // Product 5 - Peter England Shirt
  { id: 13, product_id: 5, sku: 'PET-SHT-WHT-40', barcode: '89010005040', size: '40 (M)', color: 'Crisp White', purchase_price: 580, selling_price: 1199, minimum_stock: 10, current_stock: 35, is_active: 1 },
  { id: 14, product_id: 5, sku: 'PET-SHT-NVY-40', barcode: '89010005140', size: '40 (M)', color: 'Navy Blue', purchase_price: 580, selling_price: 1199, minimum_stock: 8, current_stock: 20, is_active: 1 },

  // Product 6 - Manyavar Kurta
  { id: 15, product_id: 6, sku: 'MAN-KUR-MRN-L', barcode: '89010006001', size: 'L (42)', color: 'Deep Maroon', purchase_price: 1700, selling_price: 3499, minimum_stock: 4, current_stock: 9, is_active: 1 },

  // Product 7 - Banarasi Silk Saree
  { id: 16, product_id: 7, sku: 'BAN-SLK-RED-01', barcode: '89010007001', size: 'Free Size', color: 'Crimson Red & Zari', purchase_price: 3800, selling_price: 6999, minimum_stock: 5, current_stock: 10, is_active: 1 },
];

// Initial Demo Suppliers
const DEFAULT_SUPPLIERS = [
  {
    id: 1,
    supplier_code: 'SUPP-0001',
    company_name: 'Kanchipuram Silk Weavers Society',
    contact_person: 'Venkatesan Sundaram',
    phone: '+91 98401 22334',
    email: 'venkat@kanchisilks.org',
    address: '42 Handloom Weaver Street, Kanchipuram, Tamil Nadu',
    gst_number: '33ABCDE1234F1Z5',
    payment_terms: 'NET_30',
    status: 'ACTIVE',
    total_purchases: 450000,
    total_paid: 350000,
    outstanding_balance: 100000,
  },
  {
    id: 2,
    supplier_code: 'SUPP-0002',
    company_name: 'Raymond Textiles Wholesale Dist',
    contact_person: 'Anil Singhania',
    phone: '+91 98200 44556',
    email: 'sales@raymond-textiles.com',
    address: '15 Textile Mill Road, Mumbai, Maharashtra',
    gst_number: '27AABCR5678G1Z2',
    payment_terms: 'NET_15',
    status: 'ACTIVE',
    total_purchases: 320000,
    total_paid: 320000,
    outstanding_balance: 0,
  },
  {
    id: 3,
    supplier_code: 'SUPP-0003',
    company_name: 'Surat Handloom Mill Exporters',
    contact_person: 'Dinesh Patel',
    phone: '+91 98250 88990',
    email: 'info@surathandlooms.in',
    address: '88 Ring Road Cloth Market, Surat, Gujarat',
    gst_number: '24AABCS9988H1Z1',
    payment_terms: 'IMMEDIATE',
    status: 'ACTIVE',
    total_purchases: 185000,
    total_paid: 160000,
    outstanding_balance: 25000,
  },
];

// Initial Demo Customers
const DEFAULT_CUSTOMERS = [
  { id: 1, customer_code: 'CUST-0000', name: 'Walk-in Customer', phone: '0000000000', email: '', address: 'Counter Retail Sale', loyalty_points: 0, total_spent: 45200 },
  { id: 2, customer_code: 'CUST-0001', name: 'Dr. Sundaram Meenakshi', phone: '+91 94433 11223', email: 'sundaram.m@gmail.com', address: '12 Crosscut Road, Gandhipuram, Coimbatore', loyalty_points: 480, total_spent: 54990 },
  { id: 3, customer_code: 'CUST-0002', name: 'Mrs. Radhika Natarajan', phone: '+91 98422 55667', email: 'radhika.n@outlook.com', address: '88 RS Puram East, Coimbatore', loyalty_points: 210, total_spent: 24500 },
  { id: 4, customer_code: 'CUST-0003', name: 'Karthik Subramanian', phone: '+91 97890 33445', email: 'karthik.subbu@yahoo.com', address: '45 Sai Baba Colony, Coimbatore', loyalty_points: 95, total_spent: 12890 },
];

function loadStorage<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(item);
  } catch {
    return defaultVal;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to persist to localStorage [${key}]:`, e);
  }
}

export function initBrowserMockApi() {
  if (typeof window === 'undefined') return;

  // If electron window.api is already provided by electron preload, don't overwrite
  if ((window as any).api && !(window as any).api.__isMock) {
    return;
  }

  // Pre-seed storage if missing
  let products = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  let variants = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
  let categories = loadStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  let brands = loadStorage(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);
  let suppliers = loadStorage(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
  let customers = loadStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);

  // Force re-seed if products array is empty
  if (!products || products.length === 0) {
    products = DEFAULT_PRODUCTS;
    saveStorage(STORAGE_KEYS.PRODUCTS, products);
  }
  if (!variants || variants.length === 0) {
    variants = DEFAULT_VARIANTS;
    saveStorage(STORAGE_KEYS.VARIANTS, variants);
  }
  if (!categories || categories.length === 0) {
    categories = DEFAULT_CATEGORIES;
    saveStorage(STORAGE_KEYS.CATEGORIES, categories);
  }
  if (!brands || brands.length === 0) {
    brands = DEFAULT_BRANDS;
    saveStorage(STORAGE_KEYS.BRANDS, brands);
  }
  if (!suppliers || suppliers.length === 0) {
    suppliers = DEFAULT_SUPPLIERS;
    saveStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
  }
  if (!customers || customers.length === 0) {
    customers = DEFAULT_CUSTOMERS;
    saveStorage(STORAGE_KEYS.CUSTOMERS, customers);
  }

  const mockApi: any = {
    __isMock: true,

    // --- PRODUCTS API ---
    products: {
      getAll: async () => {
        const pList = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const cList = loadStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        const bList = loadStorage(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);
        return pList.map((p: any) => ({
          ...p,
          category_name: cList.find((c: any) => c.id === p.category_id)?.name || 'Uncategorized',
          brand_name: bList.find((b: any) => b.id === p.brand_id)?.name || 'Generic',
        }));
      },
      getById: async (id: number) => {
        const list = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        return list.find((p: any) => p.id === id) || null;
      },
      create: async (data: any) => {
        const list = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const cList = loadStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        const bList = loadStorage(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);
        const newId = list.length > 0 ? Math.max(...list.map((p: any) => p.id)) + 1 : 1;
        const newProduct = {
          id: newId,
          name: data.name,
          category_id: data.category_id || 1,
          category_name: cList.find((c: any) => c.id === data.category_id)?.name || 'Uncategorized',
          brand_id: data.brand_id || 1,
          brand_name: bList.find((b: any) => b.id === data.brand_id)?.name || 'Generic',
          material: data.material || 'Cotton',
          description: data.description || '',
          is_active: 1,
          created_at: new Date().toISOString(),
        };
        list.push(newProduct);
        saveStorage(STORAGE_KEYS.PRODUCTS, list);

        // Handle initial variant if provided
        if (data.variants && Array.isArray(data.variants)) {
          const varList = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
          data.variants.forEach((v: any, idx: number) => {
            const varId = varList.length > 0 ? Math.max(...varList.map((item: any) => item.id)) + 1 : idx + 1;
            varList.push({
              id: varId,
              product_id: newId,
              sku: v.sku || `TX-SKU-${newId}-${idx + 1}`,
              barcode: v.barcode || `890100${newId}00${idx + 1}`,
              size: v.size || 'M',
              color: v.color || 'Standard',
              purchase_price: Number(v.purchase_price) || 500,
              selling_price: Number(v.selling_price) || 999,
              minimum_stock: Number(v.minimum_stock) || 5,
              current_stock: Number(v.current_stock) || 10,
              is_active: 1,
            });
          });
          saveStorage(STORAGE_KEYS.VARIANTS, varList);
        }
        return { success: true, id: newId, product: newProduct };
      },
      update: async (id: number, data: any) => {
        const list = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const idx = list.findIndex((p: any) => p.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data };
          saveStorage(STORAGE_KEYS.PRODUCTS, list);
          return { success: true, product: list[idx] };
        }
        return { success: false, error: 'Product not found' };
      },
      deactivate: async (id: number) => {
        const list = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const p = list.find((item: any) => item.id === id);
        if (p) {
          p.is_active = p.is_active === 1 ? 0 : 1;
          saveStorage(STORAGE_KEYS.PRODUCTS, list);
          return { success: true, is_active: p.is_active };
        }
        return { success: false, error: 'Product not found' };
      },
    },

    // --- VARIANTS API ---
    variants: {
      getAll: async () => loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS),
      getByProductId: async (productId: number) => {
        const list = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        return list.filter((v: any) => v.product_id === productId);
      },
      create: async (data: any) => {
        const list = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const newId = list.length > 0 ? Math.max(...list.map((v: any) => v.id)) + 1 : 1;
        const newVariant = { id: newId, is_active: 1, ...data };
        list.push(newVariant);
        saveStorage(STORAGE_KEYS.VARIANTS, list);
        return { success: true, id: newId, variant: newVariant };
      },
      update: async (id: number, data: any) => {
        const list = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const idx = list.findIndex((v: any) => v.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data };
          saveStorage(STORAGE_KEYS.VARIANTS, list);
          return { success: true, variant: list[idx] };
        }
        return { success: false, error: 'Variant not found' };
      },
    },

    // --- CATEGORIES API ---
    categories: {
      getAll: async () => loadStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES),
      create: async (data: any) => {
        const list = loadStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        const newId = list.length > 0 ? Math.max(...list.map((c: any) => c.id)) + 1 : 1;
        const newCategory = { id: newId, is_active: 1, ...data };
        list.push(newCategory);
        saveStorage(STORAGE_KEYS.CATEGORIES, list);
        return { success: true, id: newId, category: newCategory };
      },
      update: async (id: number, data: any) => {
        const list = loadStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        const idx = list.findIndex((c: any) => c.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data };
          saveStorage(STORAGE_KEYS.CATEGORIES, list);
          return { success: true, category: list[idx] };
        }
        return { success: false, error: 'Category not found' };
      },
    },

    // --- BRANDS API ---
    brands: {
      getAll: async () => loadStorage(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS),
      create: async (data: any) => {
        const list = loadStorage(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);
        const newId = list.length > 0 ? Math.max(...list.map((b: any) => b.id)) + 1 : 1;
        const newBrand = { id: newId, is_active: 1, ...data };
        list.push(newBrand);
        saveStorage(STORAGE_KEYS.BRANDS, list);
        return { success: true, id: newId, brand: newBrand };
      },
      update: async (id: number, data: any) => {
        const list = loadStorage(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);
        const idx = list.findIndex((b: any) => b.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data };
          saveStorage(STORAGE_KEYS.BRANDS, list);
          return { success: true, brand: list[idx] };
        }
        return { success: false, error: 'Brand not found' };
      },
    },

    // --- SUPPLIERS API ---
    suppliers: {
      getAll: async () => loadStorage(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS),
      create: async (data: any) => {
        const list = loadStorage(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
        const newId = list.length > 0 ? Math.max(...list.map((s: any) => s.id)) + 1 : 1;
        const code = `SUPP-000${newId}`;
        const newSupp = {
          id: newId,
          supplier_code: code,
          total_purchases: 0,
          total_paid: 0,
          outstanding_balance: 0,
          status: 'ACTIVE',
          ...data,
        };
        list.push(newSupp);
        saveStorage(STORAGE_KEYS.SUPPLIERS, list);
        return { success: true, id: newId, supplier: newSupp };
      },
      getProfile: async (id: number) => {
        const list = loadStorage(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
        const s = list.find((item: any) => item.id === id) || list[0];
        return {
          success: true,
          supplier: s,
          purchaseOrders: [
            { id: 101, po_number: 'PO-2026-001', total: 45000, status: 'RECEIVED', created_at: '2026-02-01' },
            { id: 102, po_number: 'PO-2026-008', total: 55000, status: 'RECEIVED', created_at: '2026-02-15' },
          ],
          payments: [
            { id: 201, payment_date: '2026-02-05', amount: 45000, payment_mode: 'NEFT / RTGS', reference_no: 'UTR998822' },
          ],
        };
      },
      makePayment: async (data: any) => {
        return { success: true, message: `Payment of ₹${data.amount} recorded successfully.` };
      },
    },

    // --- CUSTOMERS API ---
    customers: {
      getAll: async () => loadStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS),
      create: async (data: any) => {
        const list = loadStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
        const newId = list.length > 0 ? Math.max(...list.map((c: any) => c.id)) + 1 : 1;
        const code = `CUST-000${newId}`;
        const newCust = { id: newId, customer_code: code, loyalty_points: 0, total_spent: 0, ...data };
        list.push(newCust);
        saveStorage(STORAGE_KEYS.CUSTOMERS, list);
        return { success: true, id: newId, customer: newCust };
      },
    },

    // --- INVENTORY API ---
    inventory: {
      getLedger: async () => {
        const vars = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const prods = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        return vars.map((v: any) => {
          const p = prods.find((prod: any) => prod.id === v.product_id);
          return {
            ...v,
            product_name: p?.name || 'Textile Item',
            material: p?.material || 'Cotton',
            total_value: v.current_stock * v.purchase_price,
            stock_status: v.current_stock <= v.minimum_stock ? 'LOW_STOCK' : 'HEALTHY',
          };
        });
      },
      adjustStock: async (variantId: number, qtyChange: number, _reason?: string) => {
        const list = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const v = list.find((item: any) => item.id === variantId);
        if (v) {
          v.current_stock = Math.max(0, v.current_stock + qtyChange);
          saveStorage(STORAGE_KEYS.VARIANTS, list);
          return { success: true, newStock: v.current_stock, message: `Stock updated for SKU ${v.sku}` };
        }
        return { success: false, error: 'Variant not found' };
      },
    },

    // --- AUTH & USER API ---
    auth: {
      checkSetup: async () => ({ setupRequired: false }),
      getCurrentUser: async () => {
        const raw = localStorage.getItem('texora_current_user');
        if (raw) {
          try {
            return JSON.parse(raw);
          } catch {}
        }
        return {
          userId: 1,
          username: 'admin',
          displayName: 'Store Administrator',
          roleId: 1,
          roleName: 'Owner',
          permissions: ['*'],
        };
      },
      login: async (username: string) => {
        const mockUser = {
          userId: 1,
          username,
          displayName: username === 'admin' ? 'Store Administrator' : username,
          roleId: 1,
          roleName: 'Owner',
          permissions: ['*'],
        };
        localStorage.setItem('texora_current_user', JSON.stringify(mockUser));
        return { success: true, user: mockUser };
      },
      logout: async () => {
        localStorage.removeItem('texora_current_user');
        return { success: true };
      },
    },

    // --- USERS MANAGEMENT API ---
    users: {
      getAll: async () => [
        { id: 1, username: 'admin', display_name: 'Store Administrator', role_id: 1, role_name: 'Owner', is_active: 1, last_login: '2026-08-23 00:00' },
        { id: 2, username: 'manager', display_name: 'Rajesh Kumar', role_id: 2, role_name: 'Manager', is_active: 1, last_login: '2026-08-22 18:30' },
        { id: 3, username: 'arun.cashier', display_name: 'Arun Kumar', role_id: 3, role_name: 'Cashier', is_active: 1, last_login: '2026-08-22 19:15' },
        { id: 4, username: 'priya.sales', display_name: 'Priya Sharma', role_id: 3, role_name: 'Cashier', is_active: 1, last_login: '2026-08-22 17:45' },
        { id: 5, username: 'karthik.inventory', display_name: 'Karthik Raja', role_id: 4, role_name: 'Inventory Staff', is_active: 1, last_login: '2026-08-22 16:00' },
        { id: 6, username: 'anitha.hr', display_name: 'Anitha Ramesh', role_id: 6, role_name: 'HR Staff', is_active: 1, last_login: '2026-08-22 15:30' },
      ],
      create: async (data: any) => ({ success: true, id: Date.now(), user: data }),
      update: async (_id: number, _data: any) => ({ success: true, message: 'User updated' }),
      resetPassword: async (_id: number, _pass: string) => ({ success: true, message: 'Password reset' }),
    },
  };

  // Attach mock to window
  (window as any).api = mockApi;
  console.log('⚡ [BrowserMockApi] Texora Demo Mock Services initialized on window.api with rich textile catalog.');
}
