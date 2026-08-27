/**
 * Browser Mock API Bridge
 * Automatically provides persistent, reactive mock services on `window.api`
 * when previewing the application in standard web browser mode (Vite dev server).
 */
import { BillingCalculationEngine } from '../features/pos/billingCalculation';

const STORAGE_KEYS = {
  PRODUCTS: 'texora_demo_products',
  VARIANTS: 'texora_demo_variants',
  CATEGORIES: 'texora_demo_categories',
  BRANDS: 'texora_demo_brands',
  SUPPLIERS: 'texora_demo_suppliers',
  CUSTOMERS: 'texora_demo_customers',
  SALES: 'texora_demo_sales',
  HELD_CARTS: 'texora_demo_held_carts',
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
  { id: 10, name: 'Designer Salwar & Suits', description: 'Embroidered festive and casual salwar kameez sets', parent_id: 2, is_active: 1 },
  { id: 11, name: 'Kids Ethnic & Pattu Pavadai', description: 'Traditional silk skirts and kurta sets for children', parent_id: 3, is_active: 1 },
  { id: 12, name: 'Home Linen & Furnishings', description: 'Fine cotton bedsheets, silk shawls and drapery', parent_id: 5, is_active: 1 },
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
  { id: 8, name: 'Linen Club', description: 'Premium 100% pure European linen apparel and fabrics', is_active: 1 },
  { id: 9, name: 'Biba', description: 'Contemporary ethnic wear and designer salwar suits', is_active: 1 },
  { id: 10, name: 'Bombay Dyeing', description: 'Heritage home textiles and high-count cotton bedding', is_active: 1 },
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
  {
    id: 8,
    name: 'Linen Club Pure Linen Casual Shirt',
    category_id: 1,
    category_name: "Men's Wear",
    brand_id: 8,
    brand_name: 'Linen Club',
    material: '100% Pure Flax Linen',
    description: 'Ultra-breathable premium washed linen regular fit casual button-down shirt',
    is_active: 1,
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 9,
    name: 'Biba Festive Anarkali Embroidered Suit',
    category_id: 10,
    category_name: 'Designer Salwar & Suits',
    brand_id: 9,
    brand_name: 'Biba',
    material: 'Chanderi Silk & Georgette',
    description: 'Floor-length flared anarkali suit set with heavy gota patti work and net dupatta',
    is_active: 1,
    created_at: '2026-02-05T12:00:00Z',
  },
  {
    id: 10,
    name: 'Pattu Pavadai Girls Traditional Silk Set',
    category_id: 11,
    category_name: 'Kids Ethnic & Pattu Pavadai',
    brand_id: 7,
    brand_name: 'Pothys Silks',
    material: 'Soft Silk & Zari',
    description: 'Traditional South Indian kids lehenga choli with rich peacock border and matching top',
    is_active: 1,
    created_at: '2026-02-08T14:30:00Z',
  },
  {
    id: 11,
    name: 'Coimbatore Handloom Soft Silk Saree',
    category_id: 7,
    category_name: 'Silk Sarees',
    brand_id: 2,
    brand_name: 'Kanchipuram Silks',
    material: 'Soft Handloom Silk',
    description: 'Lightweight dual-tone soft silk saree with temple border suitable for functions',
    is_active: 1,
    created_at: '2026-02-12T16:45:00Z',
  },
  {
    id: 12,
    name: 'Bombay Dyeing 100% Cotton King Bedsheet Set',
    category_id: 12,
    category_name: 'Home Linen & Furnishings',
    brand_id: 10,
    brand_name: 'Bombay Dyeing',
    material: '300 TC Percale Cotton',
    description: 'Luxurious king size glazed cotton bedsheet with two matching standard pillowcases',
    is_active: 1,
    created_at: '2026-02-15T11:20:00Z',
  },
];

// Initial Demo Variants
const DEFAULT_VARIANTS = [
  // Product 1 - Kanchipuram Silk Saree
  { id: 1, product_id: 1, sku: 'KAN-SLK-MRN-01', barcode: '89010001001', size: 'Free Size', color: 'Royal Maroon & Gold', purchase_price: 4500, selling_price: 8499, minimum_stock: 5, current_stock: 14, is_active: 1 },
  { id: 2, product_id: 1, sku: 'KAN-SLK-GRN-02', barcode: '89010001002', size: 'Free Size', color: 'Emerald Green & Gold', purchase_price: 4500, selling_price: 8499, minimum_stock: 5, current_stock: 7, is_active: 1 },
  { id: 3, product_id: 1, sku: 'KAN-SLK-NVY-03', barcode: '89010001003', size: 'Free Size', color: 'Royal Navy Blue', purchase_price: 4800, selling_price: 8999, minimum_stock: 4, current_stock: 3, is_active: 1 },
  { id: 4, product_id: 1, sku: 'KAN-SLK-RED-04', barcode: '89010001004', size: 'Free Size', color: 'Temple Crimson Red', purchase_price: 5200, selling_price: 9499, minimum_stock: 4, current_stock: 0, is_active: 1 },

  // Product 2 - Raymond Cotton Shirt
  { id: 5, product_id: 2, sku: 'RAY-SHT-BLU-38', barcode: '89010002038', size: '38 (S)', color: 'Sky Blue', purchase_price: 750, selling_price: 1499, minimum_stock: 8, current_stock: 18, is_active: 1 },
  { id: 6, product_id: 2, sku: 'RAY-SHT-BLU-40', barcode: '89010002040', size: '40 (M)', color: 'Sky Blue', purchase_price: 750, selling_price: 1499, minimum_stock: 10, current_stock: 24, is_active: 1 },
  { id: 7, product_id: 2, sku: 'RAY-SHT-BLU-42', barcode: '89010002042', size: '42 (L)', color: 'Sky Blue', purchase_price: 750, selling_price: 1499, minimum_stock: 8, current_stock: 4, is_active: 1 },
  { id: 8, product_id: 2, sku: 'RAY-SHT-WHT-40', barcode: '89010002140', size: '40 (M)', color: 'Pure White', purchase_price: 750, selling_price: 1499, minimum_stock: 10, current_stock: 32, is_active: 1 },
  { id: 9, product_id: 2, sku: 'RAY-SHT-CHR-40', barcode: '89010002240', size: '40 (M)', color: 'Charcoal Gray', purchase_price: 750, selling_price: 1499, minimum_stock: 6, current_stock: 0, is_active: 1 },

  // Product 3 - FabIndia Kurti
  { id: 10, product_id: 3, sku: 'FAB-KUR-IND-S', barcode: '89010003001', size: 'S', color: 'Indigo Blue', purchase_price: 550, selling_price: 1299, minimum_stock: 5, current_stock: 12, is_active: 1 },
  { id: 11, product_id: 3, sku: 'FAB-KUR-IND-M', barcode: '89010003002', size: 'M', color: 'Indigo Blue', purchase_price: 550, selling_price: 1299, minimum_stock: 8, current_stock: 20, is_active: 1 },
  { id: 12, product_id: 3, sku: 'FAB-KUR-IND-L', barcode: '89010003003', size: 'L', color: 'Indigo Blue', purchase_price: 550, selling_price: 1299, minimum_stock: 6, current_stock: 2, is_active: 1 },
  { id: 13, product_id: 3, sku: 'FAB-KUR-MST-M', barcode: '89010003102', size: 'M', color: 'Mustard Yellow', purchase_price: 550, selling_price: 1299, minimum_stock: 6, current_stock: 15, is_active: 1 },
  { id: 14, product_id: 3, sku: 'FAB-KUR-OLV-M', barcode: '89010003202', size: 'M', color: 'Olive Green', purchase_price: 550, selling_price: 1299, minimum_stock: 5, current_stock: 0, is_active: 1 },

  // Product 4 - Ramraj Silk Dhoti
  { id: 15, product_id: 4, sku: 'RAM-DHO-GLD-01', barcode: '89010004001', size: '4.0 Meters', color: 'Cream / Gold Zari', purchase_price: 950, selling_price: 1899, minimum_stock: 10, current_stock: 28, is_active: 1 },
  { id: 16, product_id: 4, sku: 'RAM-DHO-SLV-02', barcode: '89010004002', size: '4.0 Meters', color: 'White / Silver Border', purchase_price: 850, selling_price: 1699, minimum_stock: 8, current_stock: 4, is_active: 1 },

  // Product 5 - Peter England Shirt
  { id: 17, product_id: 5, sku: 'PET-SHT-WHT-40', barcode: '89010005040', size: '40 (M)', color: 'Crisp White', purchase_price: 580, selling_price: 1199, minimum_stock: 10, current_stock: 35, is_active: 1 },
  { id: 18, product_id: 5, sku: 'PET-SHT-NVY-40', barcode: '89010005140', size: '40 (M)', color: 'Navy Blue', purchase_price: 580, selling_price: 1199, minimum_stock: 8, current_stock: 18, is_active: 1 },
  { id: 19, product_id: 5, sku: 'PET-SHT-OXF-42', barcode: '89010005242', size: '42 (L)', color: 'Oxford Gray', purchase_price: 580, selling_price: 1199, minimum_stock: 6, current_stock: 0, is_active: 1 },

  // Product 6 - Manyavar Kurta Set
  { id: 20, product_id: 6, sku: 'MAN-KUR-MRN-L', barcode: '89010006001', size: 'L (42)', color: 'Deep Maroon', purchase_price: 1700, selling_price: 3499, minimum_stock: 4, current_stock: 8, is_active: 1 },
  { id: 21, product_id: 6, sku: 'MAN-KUR-IVR-M', barcode: '89010006002', size: 'M (40)', color: 'Ivory Gold', purchase_price: 1800, selling_price: 3699, minimum_stock: 4, current_stock: 3, is_active: 1 },
  { id: 22, product_id: 6, sku: 'MAN-KUR-ROY-XL', barcode: '89010006003', size: 'XL (44)', color: 'Royal Blue', purchase_price: 1700, selling_price: 3499, minimum_stock: 3, current_stock: 0, is_active: 1 },

  // Product 7 - Banarasi Silk Saree
  { id: 23, product_id: 7, sku: 'BAN-SLK-RED-01', barcode: '89010007001', size: 'Free Size', color: 'Crimson Red & Zari', purchase_price: 3800, selling_price: 6999, minimum_stock: 5, current_stock: 9, is_active: 1 },
  { id: 24, product_id: 7, sku: 'BAN-SLK-PNK-02', barcode: '89010007002', size: 'Free Size', color: 'Rani Pink & Gold', purchase_price: 3800, selling_price: 6999, minimum_stock: 4, current_stock: 2, is_active: 1 },

  // Product 8 - Linen Club Shirt
  { id: 25, product_id: 8, sku: 'LIN-SHT-BGE-40', barcode: '89010008040', size: '40 (M)', color: 'Natural Beige', purchase_price: 1100, selling_price: 2299, minimum_stock: 6, current_stock: 16, is_active: 1 },
  { id: 26, product_id: 8, sku: 'LIN-SHT-OLV-42', barcode: '89010008042', size: '42 (L)', color: 'Olive Green', purchase_price: 1100, selling_price: 2299, minimum_stock: 5, current_stock: 11, is_active: 1 },
  { id: 27, product_id: 8, sku: 'LIN-SHT-SKY-40', barcode: '89010008140', size: '40 (M)', color: 'Sky Blue', purchase_price: 1100, selling_price: 2299, minimum_stock: 6, current_stock: 1, is_active: 1 },

  // Product 9 - Biba Anarkali Suit
  { id: 28, product_id: 9, sku: 'BIB-SLW-TEL-M', barcode: '89010009001', size: 'M (38)', color: 'Teal Blue & Gold', purchase_price: 1600, selling_price: 3299, minimum_stock: 5, current_stock: 14, is_active: 1 },
  { id: 29, product_id: 9, sku: 'BIB-SLW-PCH-L', barcode: '89010009002', size: 'L (40)', color: 'Peach Blossom', purchase_price: 1600, selling_price: 3299, minimum_stock: 5, current_stock: 3, is_active: 1 },
  { id: 30, product_id: 9, sku: 'BIB-SLW-MRN-S', barcode: '89010009003', size: 'S (36)', color: 'Wine Maroon', purchase_price: 1600, selling_price: 3299, minimum_stock: 4, current_stock: 0, is_active: 1 },

  // Product 10 - Pattu Pavadai Kids Set
  { id: 31, product_id: 10, sku: 'PAT-KID-MAG-28', barcode: '89010010028', size: 'Size 28 (Age 6-8)', color: 'Magenta & Gold', purchase_price: 950, selling_price: 1999, minimum_stock: 6, current_stock: 15, is_active: 1 },
  { id: 32, product_id: 10, sku: 'PAT-KID-GRN-32', barcode: '89010010032', size: 'Size 32 (Age 9-11)', color: 'Emerald Peacock', purchase_price: 1050, selling_price: 2199, minimum_stock: 4, current_stock: 2, is_active: 1 },

  // Product 11 - Coimbatore Soft Silk Saree
  { id: 33, product_id: 11, sku: 'COI-SLK-PEA-01', barcode: '89010011001', size: 'Free Size', color: 'Peacock Blue & Gold', purchase_price: 2200, selling_price: 4299, minimum_stock: 6, current_stock: 12, is_active: 1 },
  { id: 34, product_id: 11, sku: 'COI-SLK-MST-02', barcode: '89010011002', size: 'Free Size', color: 'Mustard Gold', purchase_price: 2200, selling_price: 4299, minimum_stock: 5, current_stock: 0, is_active: 1 },

  // Product 12 - Bombay Dyeing Bedsheet Set
  { id: 35, product_id: 12, sku: 'BOM-BED-FLR-K', barcode: '89010012001', size: 'King (108x108 in)', color: 'Floral Jaipuri', purchase_price: 850, selling_price: 1799, minimum_stock: 8, current_stock: 22, is_active: 1 },
  { id: 36, product_id: 12, sku: 'BOM-BED-GEO-K', barcode: '89010012002', size: 'King (108x108 in)', color: 'Geometric Indigo', purchase_price: 850, selling_price: 1799, minimum_stock: 6, current_stock: 4, is_active: 1 },
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

const DEFAULT_SALES = [
  {
    id: 1,
    invoice_number: 'INV-2026-00001',
    customer_id: 1,
    customer_name: 'Anand Sundaram',
    sale_date: new Date().toISOString(),
    subtotal: 7500,
    discount: 375,
    tax: 356.25,
    round_off_amount: -0.25,
    total: 7481,
    paid_amount: 7481,
    balance_amount: 0,
    payment_method: 'UPI',
    status: 'COMPLETED',
  },
  {
    id: 2,
    invoice_number: 'INV-2026-00002',
    customer_id: 2,
    customer_name: 'Pooja Hegde',
    sale_date: new Date().toISOString(),
    subtotal: 12400,
    discount: 500,
    tax: 595,
    round_off_amount: 0,
    total: 12495,
    paid_amount: 12495,
    balance_amount: 0,
    payment_method: 'CASH',
    status: 'COMPLETED',
  },
];

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

    // --- DASHBOARD API ---
    dashboard: {
      getKPIs: async () => {
        const sales = loadStorage(STORAGE_KEYS.SALES, DEFAULT_SALES);
        const variants = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const products = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const customers = loadStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);

        const today = new Date().toISOString().slice(0, 10);
        const todaySalesList = sales.filter((s: any) => (s.sale_date || '').startsWith(today));
        const todaySales = todaySalesList.reduce((acc: number, s: any) => acc + (Number(s.total) || 0), 0);
        const todayBills = todaySalesList.length;

        const totalRevenue = sales.reduce((acc: number, s: any) => acc + (Number(s.total) || 0), 0);
        const grossProfit = Math.round(totalRevenue * 0.32);

        const totalUnits = variants.reduce((acc: number, v: any) => acc + (Number(v.current_stock) || 0), 0);
        const lowStock = variants.filter((v: any) => Number(v.current_stock) > 0 && Number(v.current_stock) <= (Number(v.minimum_stock) || 5)).length;
        const outOfStock = variants.filter((v: any) => (Number(v.current_stock) || 0) === 0).length;
        const inventoryValuation = variants.reduce((acc: number, v: any) => acc + (Number(v.current_stock) || 0) * (Number(v.purchase_price) || 0), 0);

        return {
          today_sales: todaySales > 0 ? todaySales : 24590,
          today_bills: todayBills > 0 ? todayBills : 8,
          total_revenue: totalRevenue > 0 ? totalRevenue : 142500,
          total_cogs: Math.round(totalRevenue * 0.68),
          gross_profit: grossProfit > 0 ? grossProfit : 45600,
          total_expenses: 12500,
          net_operating_result: 33100,
          products_in_stock: totalUnits,
          total_products: products.length,
          total_stock_units: totalUnits,
          low_stock_count: lowStock,
          out_of_stock_count: outOfStock,
          inventory_value: inventoryValuation > 0 ? inventoryValuation : 845000,
          total_customers: customers.length,
          active_staff_count: 6,
          total_staff_count: 6,
        };
      },
      getSalesTrend: async (_days: number = 7) => {
        return [
          { date: 'Mon', sales: 18500 },
          { date: 'Tue', sales: 22400 },
          { date: 'Wed', sales: 19800 },
          { date: 'Thu', sales: 28900 },
          { date: 'Fri', sales: 34200 },
          { date: 'Sat', sales: 48500 },
          { date: 'Sun', sales: 52100 },
        ];
      },
      getBestSellers: async (_limit: number = 5) => {
        return [
          { name: 'Kanchipuram Pure Silk Saree', sku: 'KAN-SLK-001', units_sold: 14, total_revenue: 105000 },
          { name: 'Formal Linen Full Sleeve Shirt', sku: 'MSH-LIN-001', units_sold: 28, total_revenue: 44800 },
          { name: 'Pure Cotton Ethnic Kurti', sku: 'WKT-COT-001', units_sold: 22, total_revenue: 28600 },
          { name: 'Zari Border Traditional Dhoti', sku: 'MDH-ZAR-001', units_sold: 19, total_revenue: 17100 },
          { name: 'Embroidered Festive Lehenga', sku: 'KLH-EMB-001', units_sold: 7, total_revenue: 38500 },
        ];
      },
      getLowStockAlerts: async (_limit: number = 5) => {
        const variants = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const products = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const low = variants
          .filter((v: any) => Number(v.current_stock) <= (Number(v.minimum_stock) || 5))
          .map((v: any) => {
            const p = products.find((prod: any) => prod.id === v.product_id);
            return {
              product_name: p?.name || 'Textile SKU',
              sku: v.sku,
              color: v.color,
              current_stock: v.current_stock,
              minimum_stock: v.minimum_stock || 5,
            };
          });
        return low.length > 0 ? low.slice(0, 5) : [
          { product_name: 'Kanchipuram Silk Saree (Gold)', sku: 'KAN-SLK-001', color: 'Gold & Crimson', current_stock: 2, minimum_stock: 5 },
          { product_name: 'Formal Linen Shirt (Sky Blue)', sku: 'MSH-LIN-002', color: 'Sky Blue', current_stock: 3, minimum_stock: 8 },
          { product_name: 'Silk Blend Fancy Dupatta', sku: 'DUP-SLK-001', color: 'Magenta', current_stock: 1, minimum_stock: 6 },
        ];
      },
      getRecentTransactions: async (_limit: number = 5) => {
        const sales = loadStorage(STORAGE_KEYS.SALES, DEFAULT_SALES);
        return sales.slice(0, 5);
      },
    },

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
      getAll: async () => {
        const vList = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const pList = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const cList = loadStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        const bList = loadStorage(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);
        return vList.map((v: any) => {
          const p = pList.find((prod: any) => prod.id === v.product_id);
          const c = cList.find((cat: any) => cat.id === p?.category_id);
          const b = bList.find((brand: any) => brand.id === p?.brand_id);
          return {
            ...v,
            product_name: p?.name || 'Textile Item',
            category_name: c?.name || p?.category_name || 'General',
            brand_name: b?.name || p?.brand_name || 'Generic',
            material: p?.material || 'Cotton',
          };
        });
      },
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
      getMetrics: async () => {
        const vList = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const totalVariants = vList.length;
        const totalStockUnits = vList.reduce((acc: number, v: any) => acc + (Number(v.current_stock) || 0), 0);
        const lowStockCount = vList.filter((v: any) => Number(v.current_stock) > 0 && Number(v.current_stock) <= (Number(v.minimum_stock) || 5)).length;
        const outOfStockCount = vList.filter((v: any) => (Number(v.current_stock) || 0) === 0).length;
        return {
          totalVariants,
          totalStockUnits,
          lowStockCount,
          outOfStockCount,
        };
      },
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

    // --- SALES & POS API ---
    sales: {
      getAll: async () => loadStorage(STORAGE_KEYS.SALES, []),
      getDailySummary: async () => ({
        totalSales: 84250,
        ordersCount: 126,
        discountTotal: 2450,
        netTax: 4210,
      }),
      calculate: async (input: any) => {
        return (BillingCalculationEngine as any).calculateBill(input);
      },
      checkout: async (request: any) => {
        const calcResult = (BillingCalculationEngine as any).calculateBill(request.calculationInput);
        const salesList = loadStorage<any[]>(STORAGE_KEYS.SALES, []);
        const varList = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const prodList = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const custList = loadStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);

        const newSaleId = salesList.length > 0 ? Math.max(...salesList.map((s: any) => s.id)) + 1 : 1001;
        const invoiceNum = `INV-2026-${String(newSaleId).padStart(5, '0')}`;
        const saleDate = new Date().toISOString();
        const customer = custList.find((c: any) => c.id === request.customerId) || { id: 0, name: 'Walk-in Retail Customer' };

        // Deduct inventory
        const detailedItems = (calcResult.items || []).map((item: any) => {
          const v = varList.find((variant: any) => variant.id === item.variantId);
          const p = prodList.find((prod: any) => prod.id === v?.product_id);
          if (v) {
            v.current_stock = Math.max(0, v.current_stock - item.quantity);
          }
          return {
            id: Date.now() + Math.random(),
            variantId: item.variantId,
            product_variant_id: item.variantId,
            productName: item.productName || p?.name || 'Textile Item',
            product_name: item.productName || p?.name || 'Textile Item',
            product_name_snapshot: item.productName || p?.name || 'Textile Item',
            sku: item.sku || v?.sku || 'SKU-ITEM',
            sku_snapshot: item.sku || v?.sku || 'SKU-ITEM',
            hsn_code_snapshot: item.hsnCode || '5208',
            size: v?.size || 'Free Size',
            color: v?.color || 'Standard',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit_price: item.unitPrice,
            discount: item.discountAmount,
            discount_amount: item.discountAmount,
            tax: item.taxAmount,
            tax_rate: item.taxRate,
            tax_amount: item.taxAmount,
            total: item.lineTotal,
          };
        });
        saveStorage(STORAGE_KEYS.VARIANTS, varList);

        const totalPaid = (request.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        const newSale = {
          id: newSaleId,
          invoice_number: invoiceNum,
          invoiceNumber: invoiceNum,
          saleDate,
          sale_date: saleDate,
          staffId: 1,
          staffName: 'Store Administrator',
          customerId: customer.id,
          customer_id: customer.id,
          customerName: customer.name,
          customer_name: customer.name,
          customerPhone: (customer as any).phone || '',
          customer_phone: (customer as any).phone || '',
          subtotal: calcResult.subtotal,
          discount: calcResult.totalDiscount,
          discount_amount: calcResult.totalDiscount,
          tax: calcResult.totalTaxAmount,
          tax_amount: calcResult.totalTaxAmount,
          round_off_amount: calcResult.roundOffAmount,
          cgst_amount: calcResult.cgstAmount,
          sgst_amount: calcResult.sgstAmount,
          igst_amount: calcResult.igstAmount,
          total: calcResult.grandTotal,
          totalAmount: calcResult.grandTotal,
          paid_amount: totalPaid,
          paidAmount: totalPaid,
          balance_amount: Math.max(0, calcResult.grandTotal - totalPaid),
          status: 'COMPLETED',
          items: detailedItems,
          payments: request.payments || [{ payment_method: 'CASH', amount: calcResult.grandTotal }],
        };

        salesList.unshift(newSale);
        saveStorage(STORAGE_KEYS.SALES, salesList);

        return {
          success: true,
          saleId: newSaleId,
          invoiceNumber: invoiceNum,
          grandTotal: calcResult.grandTotal,
          invoice: newSale,
        };
      },
      create: async (data: any) => {
        const salesList = loadStorage<any[]>(STORAGE_KEYS.SALES, []);
        const varList = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const prodList = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const custList = loadStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);

        const newSaleId = salesList.length > 0 ? Math.max(...salesList.map((s: any) => s.id)) + 1 : 1001;
        const invoiceNum = `INV-2026-${String(newSaleId).padStart(5, '0')}`;
        const saleDate = new Date().toISOString();
        const customer = custList.find((c: any) => c.id === data.customer_id) || custList[0];

        // Deduct inventory
        const detailedItems = (data.items || []).map((item: any) => {
          const v = varList.find((variant: any) => variant.id === (item.product_variant_id || item.variantId));
          const p = prodList.find((prod: any) => prod.id === v?.product_id);
          if (v) {
            v.current_stock = Math.max(0, v.current_stock - item.quantity);
          }
          return {
            id: Date.now() + Math.random(),
            variantId: v?.id || item.product_variant_id,
            product_variant_id: v?.id || item.product_variant_id,
            productName: p?.name || 'Textile Item',
            product_name: p?.name || 'Textile Item',
            product_name_snapshot: p?.name || 'Textile Item',
            sku: v?.sku || 'SKU-ITEM',
            sku_snapshot: v?.sku || 'SKU-ITEM',
            hsn_code_snapshot: '5208',
            size: v?.size || 'Free Size',
            color: v?.color || 'Standard',
            quantity: item.quantity,
            unitPrice: item.unit_price || item.unitPrice || 0,
            unit_price: item.unit_price || item.unitPrice || 0,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total: (item.unit_price || item.unitPrice || 0) * item.quantity - (item.discount || 0),
          };
        });
        saveStorage(STORAGE_KEYS.VARIANTS, varList);

        const newSale = {
          id: newSaleId,
          invoice_number: invoiceNum,
          invoiceNumber: invoiceNum,
          saleDate,
          sale_date: saleDate,
          staffId: 1,
          staffName: 'Store Administrator',
          customerId: customer.id,
          customer_id: customer.id,
          customerName: customer.name,
          customer_name: customer.name,
          customerPhone: customer.phone,
          customer_phone: customer.phone,
          subtotal: data.subtotal || data.total,
          discount: data.discount || 0,
          discount_amount: data.discount || 0,
          tax: data.tax || 0,
          tax_amount: data.tax || 0,
          total: data.total,
          totalAmount: data.total,
          paid_amount: data.total,
          paidAmount: data.total,
          balance_amount: 0,
          paymentMethod: data.payments?.[0]?.payment_method || data.payments?.[0]?.method || 'CASH',
          status: 'COMPLETED',
          items: detailedItems,
          payments: data.payments || [{ payment_method: 'CASH', amount: data.total }],
        };

        salesList.unshift(newSale);
        saveStorage(STORAGE_KEYS.SALES, salesList);

        return { success: true, saleId: newSaleId, invoice: newSale };
      },
      getDetails: async (saleId: number) => {
        const salesList = loadStorage(STORAGE_KEYS.SALES, []);
        const s = salesList.find((item: any) => item.id === saleId);
        const saleObj = s || {
          id: saleId,
          invoice_number: `INV-2026-${String(saleId).padStart(5, '0')}`,
          invoiceNumber: `INV-2026-${String(saleId).padStart(5, '0')}`,
          sale_date: new Date().toISOString(),
          customer_name: 'Walk-in Retail Customer',
          subtotal: 9998,
          discount: 0,
          tax: 500,
          total: 10498,
          status: 'COMPLETED',
          items: [
            { id: 1, product_name: 'Kanchipuram Silk Saree', sku: 'KAN-SLK-MRN-01', size: 'Free Size', color: 'Royal Maroon & Gold', quantity: 1, unit_price: 8499, discount_amount: 0, total: 8499, hsn_code_snapshot: '5208' },
            { id: 2, product_name: 'Raymond Cotton Shirt', sku: 'RAY-SHT-BLU-40', size: '40 (M)', color: 'Sky Blue', quantity: 1, unit_price: 1499, discount_amount: 0, total: 1499, hsn_code_snapshot: '5208' },
          ],
          payments: [{ payment_method: 'UPI', amount: 10498, reference_number: 'UPI77889900' }],
        };

        return {
          success: true,
          data: {
            sale: saleObj,
            items: saleObj.items || [],
            payments: saleObj.payments || [{ payment_method: 'CASH', amount: saleObj.total }],
            shopName: 'ரத்னா விலாஸ் (Ratna Vilas)',
            shopAddress: '123 Cross Cut Road, Gandhipuram, Coimbatore, TN - 641012',
            shopPhone: '+91 98765 43210',
            shopEmail: 'contact@ratnavilas.com',
            shopGst: '33AAAAA0000A1Z5',
            currencySymbol: '₹',
            amountInWords: (BillingCalculationEngine as any).amountToWords(saleObj.total || 0),
          },
        };
      },
      cancel: async (saleId: number) => {
        const salesList = loadStorage<any[]>(STORAGE_KEYS.SALES, []);
        const s = salesList.find((item: any) => item.id === saleId);
        if (s) {
          s.status = 'CANCELLED';
          saveStorage(STORAGE_KEYS.SALES, salesList);
          return { success: true };
        }
        return { success: false, error: 'Sale not found.' };
      },
    },

    // --- POS BILLING COUNTER BRIDGE ---
    staffPOS: {
      searchProducts: async (query?: string, categoryId?: number) => {
        const vList = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const pList = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const cList = loadStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        const bList = loadStorage(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);

        let formatted = vList
          .filter((v: any) => v.is_active === 1)
          .map((v: any) => {
            const p = pList.find((prod: any) => prod.id === v.product_id);
            const cat = cList.find((c: any) => c.id === p?.category_id);
            const br = bList.find((b: any) => b.id === p?.brand_id);
            return {
              id: v.id,
              productId: p?.id || v.product_id,
              productName: p?.name || 'Textile Item',
              sku: v.sku,
              barcode: v.barcode,
              categoryName: cat?.name || 'General',
              brandName: br?.name || 'Generic',
              color: v.color,
              size: v.size,
              sellingPrice: v.selling_price,
              taxRate: 5.0,
              currentStock: v.current_stock,
              status: v.current_stock <= 0 ? 'OUT_OF_STOCK' : v.current_stock <= v.minimum_stock ? 'LOW_STOCK' : 'IN_STOCK',
            };
          });

        if (categoryId) {
          formatted = formatted.filter((item: any) => {
            const p = pList.find((prod: any) => prod.id === item.productId);
            return p?.category_id === categoryId;
          });
        }

        if (query && query.trim()) {
          const q = query.trim().toLowerCase();
          formatted = formatted.filter(
            (item: any) =>
              item.productName.toLowerCase().includes(q) ||
              item.sku.toLowerCase().includes(q) ||
              (item.barcode && item.barcode.includes(q)) ||
              (item.color && item.color.toLowerCase().includes(q))
          );
        }

        return { success: true, data: formatted };
      },
      getByBarcode: async (barcode: string) => {
        const vList = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
        const pList = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const v = vList.find((item: any) => item.barcode === barcode);
        if (v) {
          const p = pList.find((prod: any) => prod.id === v.product_id);
          return {
            success: true,
            data: {
              id: v.id,
              productId: v.product_id,
              productName: p?.name || 'Textile Item',
              sku: v.sku,
              barcode: v.barcode,
              sellingPrice: v.selling_price,
              taxRate: 5.0,
              currentStock: v.current_stock,
              color: v.color,
              size: v.size,
              status: v.current_stock <= 0 ? 'OUT_OF_STOCK' : 'IN_STOCK',
            },
          };
        }
        return { success: false, error: 'Barcode not recognized.' };
      },
      getCustomers: async (query?: string) => {
        const list = loadStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
        if (query && query.trim()) {
          const q = query.trim().toLowerCase();
          return { success: true, data: list.filter((c: any) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))) };
        }
        return { success: true, data: list };
      },
      quickCustomer: async (input: any) => {
        const list = loadStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
        const newId = list.length > 0 ? Math.max(...list.map((c: any) => c.id)) + 1 : 1;
        const newCust = { id: newId, customer_code: `CUST-000${newId}`, loyalty_points: 0, total_spent: 0, ...input };
        list.push(newCust);
        saveStorage(STORAGE_KEYS.CUSTOMERS, list);
        return { success: true, customer: newCust };
      },
      customerHistory: async (customerId: number) => {
        const custList = loadStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
        const c = custList.find((item: any) => item.id === customerId);
        return {
          success: true,
          data: {
            orderCount: 6,
            lifetimeSpend: c?.total_spent || 15400,
            lastPurchaseDate: '2026-08-15',
          },
        };
      },
      calculateTotals: async (input: any) => {
        const items = input.items || [];
        let subtotal = 0;
        let lineDiscountTotal = 0;

        const itemBreakdowns = items.map((i: any) => {
          const lineSub = i.unitPrice * i.quantity;
          const disc = i.discountPercent ? (lineSub * i.discountPercent) / 100 : 0;
          const afterDisc = lineSub - disc;
          const tax = (afterDisc * 5) / 100;
          subtotal += lineSub;
          lineDiscountTotal += disc;
          return {
            variantId: i.variantId,
            lineSubtotal: lineSub,
            lineDiscount: disc,
            lineTax: tax,
            lineTotal: afterDisc + tax,
          };
        });

        let billDisc = 0;
        if (input.discountType === 'PERCENT' && input.discountValue) {
          billDisc = ((subtotal - lineDiscountTotal) * input.discountValue) / 100;
        } else if (input.discountType === 'FIXED' && input.discountValue) {
          billDisc = input.discountValue;
        }

        const totalDiscount = lineDiscountTotal + billDisc;
        const taxableAmount = Math.max(0, subtotal - totalDiscount);
        const taxAmount = (taxableAmount * 5) / 100;
        const totalAmount = Math.round(taxableAmount + taxAmount);

        return {
          success: true,
          data: {
            subtotal,
            discountAmount: totalDiscount,
            taxAmount,
            totalAmount,
            itemBreakdowns,
          },
        };
      },
      completeSale: async (input: any) => {
        const salesRes = await mockApi.sales.create({
          customer_id: input.customerId,
          items: input.items.map((i: any) => ({
            product_variant_id: i.variantId,
            quantity: i.quantity,
            unit_price: i.unitPrice,
            discount: i.discount || 0,
          })),
          payments: input.payments,
          subtotal: input.subtotal,
          discount: input.discountValue,
          tax: input.taxAmount,
          total: input.totalAmount || input.payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0),
        });
        return { success: true, data: salesRes.invoice };
      },
      getHeldSales: async () => {
        return loadStorage<any[]>(STORAGE_KEYS.HELD_CARTS, []);
      },
      holdSale: async (input: any) => {
        const held = loadStorage<any[]>(STORAGE_KEYS.HELD_CARTS, []);
        held.push({ id: Date.now(), ...input });
        saveStorage(STORAGE_KEYS.HELD_CARTS, held);
        return { success: true };
      },
      processReturn: async (_input: any) => {
        return { success: true, refundAmount: 1499, message: 'Return processed and refund issued.' };
      },
    },

    // --- AUTH & USER API ---
    auth: {
      checkSetup: async () => ({ setupRequired: false }),
      getCurrentUser: async () => {
        const token = localStorage.getItem('texora_auth_token') || localStorage.getItem('texora_token');
        const raw = localStorage.getItem('texora_current_user') || localStorage.getItem('texora_auth_user');
        if (token && raw) {
          try {
            return JSON.parse(raw);
          } catch {}
        }
        return null;
      },
      login: async (username: string) => {
        const key = (username || 'admin').trim().toLowerCase();
        const MOCK_USERS_MAP: Record<string, any> = {
          admin: {
            userId: 1,
            username: 'admin',
            displayName: 'Store Administrator',
            roleId: 1,
            roleName: 'Owner',
            permissions: ['*'],
          },
          owner: {
            userId: 1,
            username: 'admin',
            displayName: 'Store Administrator',
            roleId: 1,
            roleName: 'Owner',
            permissions: ['*'],
          },
          manager: {
            userId: 2,
            username: 'manager',
            displayName: 'Rajesh Kumar',
            roleId: 2,
            roleName: 'Manager',
            permissions: [
              'dashboard.view', 'billing.create', 'sales.view', 'customers.view', 'products.view', 'products.manage',
              'inventory.view', 'inventory.manage', 'suppliers.view', 'purchases.view', 'returns.create', 'reports.view',
              'staff.view', 'attendance.view', 'shift.view', 'leave.view', 'payroll.view', 'settings.view',
              'ai.sales.view', 'ai.forecast.view', 'ai.reorders.view', 'ai.customer.view', 'ai.anomalies.view',
              'ai.risk.view', 'ai.reports.view', 'ai.chat.use', 'ai.cross_sell.use', 'ai.alerts.receive'
            ],
          },
          'stf-0001': {
            userId: 2,
            username: 'manager',
            displayName: 'Rajesh Kumar',
            roleId: 2,
            roleName: 'Manager',
            permissions: [
              'dashboard.view', 'billing.create', 'sales.view', 'customers.view', 'products.view', 'products.manage',
              'inventory.view', 'inventory.manage', 'suppliers.view', 'purchases.view', 'returns.create', 'reports.view',
              'staff.view', 'attendance.view', 'shift.view', 'leave.view', 'payroll.view', 'settings.view',
              'ai.sales.view', 'ai.forecast.view', 'ai.reorders.view', 'ai.customer.view', 'ai.anomalies.view',
              'ai.risk.view', 'ai.reports.view', 'ai.chat.use', 'ai.cross_sell.use', 'ai.alerts.receive'
            ],
          },
          'arun.cashier': {
            userId: 3,
            username: 'arun.cashier',
            displayName: 'Arun Kumar',
            roleId: 3,
            roleName: 'Cashier',
            permissions: [
              'dashboard.view', 'billing.create', 'sales.view', 'customers.view', 'products.view', 'inventory.view', 'returns.create',
              'self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view', 'self.payroll.view',
              'ai.cross_sell.use', 'ai.chat.use', 'ai.sales.view'
            ],
          },
          'stf-0002': {
            userId: 3,
            username: 'arun.cashier',
            displayName: 'Arun Kumar',
            roleId: 3,
            roleName: 'Cashier',
            permissions: [
              'dashboard.view', 'billing.create', 'sales.view', 'customers.view', 'products.view', 'inventory.view', 'returns.create',
              'self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view', 'self.payroll.view',
              'ai.cross_sell.use', 'ai.chat.use', 'ai.sales.view'
            ],
          },
          'priya.sales': {
            userId: 4,
            username: 'priya.sales',
            displayName: 'Priya Sharma',
            roleId: 3,
            roleName: 'Cashier',
            permissions: [
              'dashboard.view', 'billing.create', 'sales.view', 'customers.view', 'products.view', 'inventory.view', 'returns.create',
              'self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view', 'self.payroll.view',
              'ai.cross_sell.use', 'ai.chat.use', 'ai.sales.view'
            ],
          },
          'stf-0003': {
            userId: 4,
            username: 'priya.sales',
            displayName: 'Priya Sharma',
            roleId: 3,
            roleName: 'Cashier',
            permissions: [
              'dashboard.view', 'billing.create', 'sales.view', 'customers.view', 'products.view', 'inventory.view', 'returns.create',
              'self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view', 'self.payroll.view',
              'ai.cross_sell.use', 'ai.chat.use', 'ai.sales.view'
            ],
          },
          'karthik.inventory': {
            userId: 5,
            username: 'karthik.inventory',
            displayName: 'Karthik Raja',
            roleId: 4,
            roleName: 'Inventory Staff',
            permissions: [
              'dashboard.view', 'inventory.view', 'inventory.manage', 'products.view', 'products.manage', 'purchases.view', 'suppliers.view',
              'self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view', 'self.payroll.view',
              'ai.reorders.view', 'ai.forecast.view', 'ai.sales.view', 'ai.chat.use', 'ai.cross_sell.use'
            ],
          },
          'stf-0004': {
            userId: 5,
            username: 'karthik.inventory',
            displayName: 'Karthik Raja',
            roleId: 4,
            roleName: 'Inventory Staff',
            permissions: [
              'dashboard.view', 'inventory.view', 'inventory.manage', 'products.view', 'products.manage', 'purchases.view', 'suppliers.view',
              'self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view', 'self.payroll.view'
            ],
          },
          'anitha.hr': {
            userId: 6,
            username: 'anitha.hr',
            displayName: 'Anitha Ramesh',
            roleId: 6,
            roleName: 'HR Staff',
            permissions: [
              'dashboard.view', 'staff.view', 'staff.manage', 'staff.organization', 'attendance.view', 'shift.view', 'leave.view', 'payroll.view',
              'performance.view', 'documents.view', 'communication.view', 'reports.view',
              'self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view', 'self.payroll.view'
            ],
          },
          'stf-0005': {
            userId: 6,
            username: 'anitha.hr',
            displayName: 'Anitha Ramesh',
            roleId: 6,
            roleName: 'HR Staff',
            permissions: [
              'dashboard.view', 'staff.view', 'staff.manage', 'staff.organization', 'attendance.view', 'shift.view', 'leave.view', 'payroll.view',
              'performance.view', 'documents.view', 'communication.view', 'reports.view',
              'self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view', 'self.payroll.view'
            ],
          },
        };

        const matchedUser = MOCK_USERS_MAP[key] || {
          userId: 99,
          username,
          displayName: username,
          roleId: 3,
          roleName: 'Cashier',
          permissions: [
            'dashboard.view', 'billing.create', 'sales.view', 'customers.view', 'products.view', 'inventory.view', 'returns.create',
            'self.profile.view', 'self.attendance.view', 'self.shift.view', 'self.leave.view', 'self.payroll.view'
          ],
        };

        const token = `texora_token_${Date.now()}`;
        localStorage.setItem('texora_current_user', JSON.stringify(matchedUser));
        localStorage.setItem('texora_token', token);
        localStorage.setItem('texora_auth_token', token);
        localStorage.setItem('texora_auth_user', JSON.stringify({
          id: matchedUser.userId,
          username: matchedUser.username,
          name: matchedUser.displayName,
          role: matchedUser.roleName,
          roleId: matchedUser.roleId,
          permissions: matchedUser.permissions,
        }));
        return { success: true, user: matchedUser };
      },
      logout: async () => {
        localStorage.removeItem('texora_current_user');
        localStorage.removeItem('texora_auth_user');
        localStorage.removeItem('texora_token');
        localStorage.removeItem('texora_auth_token');
        localStorage.removeItem('texora_user');
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

    // --- SELF SERVICE API ---
    selfService: {
      getDashboard: async () => {
        const raw = localStorage.getItem('texora_current_user');
        let user: any = { userId: 1, username: 'admin', displayName: 'Store Administrator', roleName: 'Owner' };
        if (raw) {
          try { user = JSON.parse(raw); } catch {}
        }
        const profile = getMockStaffProfile(user);
        return {
          profile,
          todayAttendance: {
            check_in: new Date().toISOString().slice(0, 10) + 'T09:15:00',
            check_out: null,
            status: 'PRESENT',
            work_duration_minutes: 360,
          },
          todayShift: {
            shift_name: 'Standard Store Shift',
            start_time: '09:00',
            end_time: '18:00',
            location: 'Main Textile Store',
          },
          leaveBalance: {
            used: 3,
            total: 18,
            remaining: 15,
          },
          documentCompletion: {
            totalRequired: 5,
            completedCount: 5,
            complianceScore: 100,
          },
          unreadNotificationsCount: 2,
        };
      },
      getProfile: async () => {
        const raw = localStorage.getItem('texora_current_user');
        let user: any = { userId: 1, username: 'admin', displayName: 'Store Administrator', roleName: 'Owner' };
        if (raw) {
          try { user = JSON.parse(raw); } catch {}
        }
        return getMockStaffProfile(user);
      },
      updateProfile: async (fields: any) => {
        const saved = loadStorage('texora_profile_custom', {});
        saveStorage('texora_profile_custom', { ...saved, ...fields });
        return { success: true };
      },
      requestProfileChange: async (input: any) => {
        const reqs = loadStorage<any[]>('texora_profile_requests', []);
        reqs.unshift({ id: Date.now(), ...input, status: 'PENDING', created_at: new Date().toISOString() });
        saveStorage('texora_profile_requests', reqs);
        return { success: true, id: Date.now() };
      },
      getProfileChangeRequests: async () => {
        return loadStorage<any[]>('texora_profile_requests', [
          { id: 101, field_name: 'phone', old_value: '+91 98765 00000', new_value: '+91 98765 33003', reason: 'Updated primary contact', status: 'APPROVED', created_at: '2026-02-10' }
        ]);
      },
      getAttendance: async (_month?: string, _year?: number) => {
        return [
          { id: 1, date: new Date().toISOString().slice(0, 10), check_in: '09:15', check_out: '18:05', status: 'PRESENT', total_hours: '8.8' },
          { id: 2, date: '2026-08-22', check_in: '09:00', check_out: '18:00', status: 'PRESENT', total_hours: '9.0' },
          { id: 3, date: '2026-08-21', check_in: '09:30', check_out: '18:00', status: 'LATE', total_hours: '8.5' },
          { id: 4, date: '2026-08-20', check_in: '09:00', check_out: '18:00', status: 'PRESENT', total_hours: '9.0' },
          { id: 5, date: '2026-08-19', check_in: '09:00', check_out: '18:00', status: 'PRESENT', total_hours: '9.0' },
          { id: 6, date: '2026-08-18', check_in: null, check_out: null, status: 'LEAVE', total_hours: '0' },
        ];
      },
      requestAttendanceCorrection: async (_input: any) => {
        return { success: true, id: Date.now() };
      },
      getLeave: async () => {
        return {
          balances: [
            { leave_type: 'Casual Leave (CL)', allocated: 12, used: 2, remaining: 10 },
            { leave_type: 'Sick Leave (SL)', allocated: 6, used: 1, remaining: 5 },
            { leave_type: 'Earned Leave (EL)', allocated: 15, used: 0, remaining: 15 },
          ],
          requests: [
            { id: 201, leave_type: 'Casual Leave', start_date: '2026-08-18', end_date: '2026-08-18', days_count: 1, reason: 'Family function', status: 'APPROVED' },
            { id: 202, leave_type: 'Sick Leave', start_date: '2026-07-12', end_date: '2026-07-12', days_count: 1, reason: 'Viral fever', status: 'APPROVED' },
          ]
        };
      },
      applyLeave: async (_input: any) => {
        return { success: true, id: Date.now() };
      },
      cancelLeave: async (_id: number) => {
        return { success: true };
      },
      getPayroll: async () => {
        return [
          { id: 301, month: 'July 2026', basic_salary: 25000, allowances: 5000, deductions: 1800, net_pay: 28200, status: 'PAID', pay_date: '2026-08-01' },
          { id: 302, month: 'June 2026', basic_salary: 25000, allowances: 5000, deductions: 1800, net_pay: 28200, status: 'PAID', pay_date: '2026-07-01' },
          { id: 303, month: 'May 2026', basic_salary: 25000, allowances: 5000, deductions: 1800, net_pay: 28200, status: 'PAID', pay_date: '2026-06-01' },
        ];
      },
      getDocuments: async () => {
        return [
          { id: 401, title: 'Aadhaar Card Copy', doc_type: 'ID_PROOF', status: 'VERIFIED', upload_date: '2026-01-15' },
          { id: 402, title: 'PAN Card Copy', doc_type: 'TAX_PROOF', status: 'VERIFIED', upload_date: '2026-01-15' },
          { id: 403, title: 'Employment Contract', doc_type: 'CONTRACT', status: 'VERIFIED', upload_date: '2026-01-15' },
        ];
      },
      getPerformance: async () => {
        return {
          rating: 4.8,
          salesTarget: 500000,
          salesAchieved: 485000,
          kpis: [
            { name: 'Customer Satisfaction', score: '96%' },
            { name: 'Billing Accuracy', score: '99.8%' },
            { name: 'Punctuality Score', score: '98%' },
          ],
        };
      },
    },

    // --- AI BUSINESS ASSISTANT API ---
    ai: {
      chat: async (request: any, userContext?: any) => {
        const rawQuery = (request?.message || '').toLowerCase().trim();
        const query = rawQuery.replace(/[’‘]/g, "'").replace(/-/g, ' ');
        const rawUser = localStorage.getItem('texora_current_user');
        let user = userContext;
        if (!user && rawUser) {
          try { user = JSON.parse(rawUser); } catch {}
        }
        const role = (user?.roleName || user?.role || 'Cashier').toLowerCase();
        const isAdminOrManager = role === 'owner' || role === 'super_admin' || role === 'admin' || role === 'manager';
        const now = new Date().toISOString();

        // 1. Sensitive Payroll Check
        if (query.includes('salary') || query.includes('salaries') || query.includes('payroll') || query.includes('wage')) {
          if (role !== 'owner' && role !== 'super_admin' && role !== 'admin' && role !== 'hr staff') {
            return {
              answer: "🔒 **Access Restricted**\n\nYou don't have permission to access staff salary or payroll information. Please contact your store administrator.",
              data: {
                type: 'permission_denied',
                title: 'Access Restricted',
                aiInsight: 'Request rejected by RBAC security guard.',
              },
              source: 'Texora Security & RBAC Guard',
              sourcesUsed: ['Role Permission Matrix'],
              generatedAt: now,
              confidence: 1.0,
              requiresPermission: 'Restricted',
            };
          }
        }

        // 2. Executive Business Summary
        if (
          query.includes('business summary') ||
          query.includes('daily summary') ||
          query.includes('daily report') ||
          query.includes('store overview') ||
          query.includes('shop overview') ||
          query.includes('executive summary')
        ) {
          if (!isAdminOrManager) {
            return {
              answer: "🔒 **Access Restricted**\n\nYou don't have permission to access executive business summary reports.",
              data: { type: 'permission_denied', title: 'Access Restricted' },
              source: 'Texora Security & RBAC Guard',
              sourcesUsed: ['Role Permission Matrix'],
              generatedAt: now,
              confidence: 1.0,
            };
          }

          const vList = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
          const lowCount = vList.filter((v: any) => v.current_stock > 0 && v.current_stock <= (v.minimum_stock || 10)).length;
          const outCount = vList.filter((v: any) => v.current_stock === 0).length;

          return {
            answer: `### 📊 Today's Business Summary\n\n` +
              `**Sales:** **₹84,250**  \n` +
              `**Transactions:** **126**  \n` +
              `**Average Bill:** **₹669**  \n` +
              `**Top Category:** **Kanchipuram Silks & Sarees**  \n` +
              `**Low Stock Alerts:** **${lowCount} products** (${outCount} out of stock)  \n` +
              `**Staff On Duty:** **5 / 6 present**  \n\n` +
              `💡 **AI Insight:** Today's revenue is ₹84,250, which is **12% higher** than yesterday. Footfall peaked during afternoon festive bridal enquiries.`,
            data: {
              type: 'daily_business_report',
              title: "Today's Business Summary",
              metrics: {
                'Sales': '₹84,250',
                'Transactions': 126,
                'Average Bill': '₹669',
                'Top Category': 'Kanchipuram Silks & Sarees',
                'Low Stock': `${lowCount} products`,
                'Staff Present': '5/6',
              },
              aiInsight: "Sales are 12% higher than yesterday. Strong customer interest in bridal silk sarees.",
            },
            source: 'Consolidated Executive Business Intelligence Register',
            sourcesUsed: ['Sales Records', 'Warehouse Stock Matrix', 'Customer CRM', 'Staff Attendance Terminal'],
            generatedAt: now,
            confidence: 1.0,
            toolExecuted: 'getDailyReport',
          };
        }

        // 3. Cashier Personal Shift / Register Query
        if (
          query.includes('my register') ||
          query.includes('my shift') ||
          query.includes('my sales') ||
          query.includes('my counter') ||
          query.includes('my drawer') ||
          query.includes('my bills')
        ) {
          return {
            answer: `### 💳 Cashier Shift Summary — Tuesday, Aug 25\n\n` +
              `• **Your Terminal Sales:** **₹18,450**\n` +
              `• **Bills Processed:** **24 transactions**\n` +
              `• **Average Bill Value:** **₹768**\n` +
              `• **Discounts Given:** **₹850**\n\n` +
              `*Register drawer is reconciled and balanced.*`,
            data: {
              type: 'sales_summary',
              title: 'Cashier Shift Summary',
              metrics: {
                'Your Sales': '₹18,450',
                'Bills Processed': 24,
                'Avg Bill': '₹768',
                'Discounts': '₹850',
              },
              aiInsight: 'Your shift drawer is balanced across 24 completed invoices.',
            },
            source: 'POS Terminal Register Ledger',
            sourcesUsed: ['Cashier Terminal Sales', 'Completed Invoices'],
            generatedAt: now,
            confidence: 1.0,
            toolExecuted: 'getCashierShiftSummary',
          };
        }

        // 4. Product Pairings / Cross-Selling Recommendations
        if (
          query.includes('pair') ||
          query.includes('accessor') ||
          query.includes('cross sell') ||
          query.includes('match') ||
          query.includes('complement')
        ) {
          return {
            answer: `### 👗 Cross-Selling & Pairing Recommendations for Bridal Silk Sarees\n\n` +
              `Boost customer basket size with these complementary high-margin pairings:\n\n` +
              `1. **Pure Zari Contrast Blouse Fabric** (\`BLS-ZAR-001\`) — **₹1,850** (+42% basket lift)\n` +
              `2. **Gold-Plated Antique Temple Jewelry Set** (\`ACC-JWL-008\`) — **₹4,200** (+35% basket lift)\n` +
              `3. **Handcrafted Zardozi Silk Potli Bag** (\`BAG-POT-003\`) — **₹950** (+28% basket lift)\n` +
              `4. **Pure Satin Saree Shapewear / Petticoat** (\`UND-PET-002\`) — **₹799** (+50% attachment rate)\n\n` +
              `💡 *Staff Tip: Suggest matching readymade blouse pieces and contrast potli bags at checkout to increase average invoice value.*`,
            data: {
              type: 'general_answer',
              title: 'Bridal Saree Cross-Sell Recommendations',
              items: [
                { name: 'Pure Zari Contrast Blouse Fabric', sku: 'BLS-ZAR-001', price: 1850, margin: '62%' },
                { name: 'Gold-Plated Antique Temple Jewelry Set', sku: 'ACC-JWL-008', price: 4200, margin: '55%' },
                { name: 'Handcrafted Zardozi Silk Potli Bag', sku: 'BAG-POT-003', price: 950, margin: '70%' },
                { name: 'Pure Satin Saree Shapewear', sku: 'UND-PET-002', price: 799, margin: '48%' },
              ],
              aiInsight: 'Pairing blouse fabrics and temple jewelry increases average ticket size by ₹3,400.',
            },
            source: 'Texora Smart Product Affinity Engine',
            sourcesUsed: ['Historical POS Invoices', 'Basket Co-occurrence Matrix'],
            generatedAt: now,
            confidence: 1.0,
            toolExecuted: 'getProductPairings',
          };
        }

        // 5. Profit & Gross Margins (RBAC Protected for Admin/Manager)
        if (
          query.includes('profit') ||
          query.includes('margin') ||
          query.includes('gross profit') ||
          query.includes('net profit')
        ) {
          if (!isAdminOrManager) {
            return {
              answer: "🔒 **Access Restricted**\n\nStorewide profit margins and financial statements require **Store Manager** or **Admin** authorization.\n\nAs a Cashier, you can check:\n• *\"Show my register sales today\"*\n• *\"Check stock for Bridal Silk Saree\"*\n• *\"What accessories pair with this saree?\"*",
              data: { type: 'permission_denied', title: 'Permission Denied' },
              source: 'Texora Security & RBAC Guard',
              sourcesUsed: ['Role Permission Matrix'],
              generatedAt: now,
              confidence: 1.0,
              requiresPermission: 'sales.view',
            };
          }
        }

        // 6. Top Selling Products (PRIORITIZED BEFORE generic sales check)
        if (
          query.includes('top selling') ||
          query.includes('top product') ||
          query.includes('best seller') ||
          query.includes('bestseller') ||
          query.includes('fast moving') ||
          query.includes('popular') ||
          query.includes('most sold') ||
          query.includes('top category') ||
          query.includes('top items') ||
          query.includes('top seller')
        ) {
          const topItems = [
            { rank: 1, name: 'Bridal Kanchipuram Pure Silk Saree', category: 'Sarees', unitsSold: 18, revenue: 323982, sku: 'SAR-KAN-001-RED-FS', variantInfo: 'Crimson Red / Free Size' },
            { rank: 2, name: 'Premium Egyptian Giza Cotton Shirt', category: 'Men’s Wear', unitsSold: 24, revenue: 59976, sku: 'MSH-EGY-002-WHT-40', variantInfo: 'Pure White / 40 (M)' },
            { rank: 3, name: 'Banarasi Brocade Silk Saree', category: 'Sarees', unitsSold: 12, revenue: 143988, sku: 'SAR-BAN-003-NVY-FS', variantInfo: 'Navy Gold / Free Size' },
            { rank: 4, name: 'Designer Soft Silk Partywear Saree', category: 'Sarees', unitsSold: 15, revenue: 112485, sku: 'SAR-SFT-004-PNK-FS', variantInfo: 'Rose Pink / Free Size' },
            { rank: 5, name: 'Pure Linen Formal Trouser', category: 'Men’s Wear', unitsSold: 16, revenue: 36784, sku: 'MTR-LIN-005-BEI-32', variantInfo: 'Beige / 32' },
          ];

          let answer = `### 🏆 Top Selling Products & Fast Movers\n\n`;
          topItems.forEach((p) => {
            answer += `${p.rank}. **${p.name}** (${p.category})\n` +
              `   • Units Sold: **${p.unitsSold} units** | Revenue: **₹${p.revenue.toLocaleString()}**\n` +
              `   • Variant: \`${p.sku}\` (${p.variantInfo})\n\n`;
          });

          return {
            answer,
            data: {
              type: 'top_products',
              title: 'Top Fast-Moving Products',
              items: topItems,
              aiInsight: 'Bridal Silk Sarees and Giza Cotton Shirts represent 68% of today’s volume.',
            },
            source: 'Product Variant & Sales Item Aggregates',
            sourcesUsed: ['Sale Items Database', 'Barcode Records', 'Inventory Movement Register'],
            generatedAt: now,
            confidence: 1.0,
            toolExecuted: 'getTopSellingProducts',
          };
        }

        // 7. Storewide Sales Queries
        if (
          query.includes('sale') ||
          query.includes('sold') ||
          query.includes('sell') ||
          query.includes('revenue') ||
          query.includes('turnover') ||
          query.includes('collection') ||
          query.includes('bill') ||
          query.includes('yesterday') ||
          query.includes('transaction') ||
          query.includes('how much')
        ) {
          if (!isAdminOrManager) {
            return {
              answer: "🔒 **Access Restricted**\n\nStorewide sales totals and financial revenue require **Store Manager** or **Admin** authorization.\n\nTo view your own terminal sales, ask: *\"Show my register sales today\"*.",
              data: { type: 'permission_denied', title: 'Permission Denied' },
              source: 'Texora Security & RBAC Guard',
              sourcesUsed: ['Role Permission Matrix'],
              generatedAt: now,
              confidence: 1.0,
              requiresPermission: 'sales.view',
            };
          }

          const isYesterday = query.includes('yesterday');
          const salesVal = isYesterday ? 75200 : 84250;
          const txCount = isYesterday ? 112 : 126;
          const avgBill = isYesterday ? 671 : 669;
          const period = isYesterday ? 'Yesterday' : 'Today';

          return {
            answer: `### 📊 ${period}'s Sales Summary\n\n` +
              `• **Total Revenue:** **₹${salesVal.toLocaleString()}**${!isYesterday ? ' (📈 **+12%** higher than yesterday)' : ''}\n` +
              `• **Completed Invoices:** **${txCount}** transactions\n` +
              `• **Average Bill Value:** **₹${avgBill}**\n` +
              `• **Top Category:** **Kanchipuram Silks & Sarees**`,
            data: {
              type: 'sales_summary',
              title: `${period}'s Sales`,
              metrics: {
                'Total Revenue': `₹${salesVal.toLocaleString()}`,
                'Transactions': txCount,
                'Average Ticket': `₹${avgBill}`,
                'Leading Category': 'Kanchipuram Silks & Sarees',
              },
              aiInsight: isYesterday
                ? 'Yesterday finished with healthy billings across men formal wear and festive silks.'
                : 'Today’s sales are ₹84,250 from 126 transactions (+12% vs yesterday).',
            },
            source: 'Sales Engine & POS Billing Invoices',
            sourcesUsed: ['Sales Records', `${period} POS Invoices`, 'Register Balances'],
            generatedAt: now,
            confidence: 1.0,
            toolExecuted: 'getSalesSummary',
          };
        }

        // 5. Low Stock & Out of Stock Queries
        if (
          query.includes('low stock') ||
          query.includes('out of stock') ||
          query.includes('reorder') ||
          query.includes('shortage') ||
          query.includes('empty stock') ||
          query.includes('stock alert')
        ) {
          const vList = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
          const pList = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);

          const lowStockVariants = vList.filter((v: any) => v.current_stock <= (v.minimum_stock || 10));
          const outOfStock = lowStockVariants.filter((v: any) => v.current_stock === 0);
          const lowStock = lowStockVariants.filter((v: any) => v.current_stock > 0);

          let answer = `### 🚨 Inventory Stock Alerts\n\n` +
            `• **Low Stock Warnings:** **${lowStock.length} items**\n` +
            `• **Out of Stock Items:** **${outOfStock.length} items**\n\n`;

          if (outOfStock.length > 0) {
            answer += `#### ⛔ Out of Stock (Urgent Re-order Required):\n`;
            outOfStock.slice(0, 4).forEach((v: any) => {
              const p = pList.find((x: any) => x.id === v.product_id);
              answer += `• **${p?.name || 'Textile Item'}** (\`${v.sku}\`) — ${v.color || 'Standard'}, ${v.size || 'Free Size'} (Min threshold: ${v.minimum_stock})\n`;
            });
            answer += '\n';
          }

          if (lowStock.length > 0) {
            answer += `#### ⚠️ Low Stock (Below Minimum Threshold):\n`;
            lowStock.slice(0, 4).forEach((v: any) => {
              const p = pList.find((x: any) => x.id === v.product_id);
              answer += `• **${p?.name || 'Textile Item'}** (\`${v.sku}\`) — **${v.current_stock} units left** (Min: ${v.minimum_stock})\n`;
            });
          }

          return {
            answer,
            data: {
              type: 'low_stock',
              title: 'Stock Re-order Alerts',
              metrics: {
                'Low Stock Items': lowStock.length,
                'Out of Stock': outOfStock.length,
                'Total Alerts': lowStockVariants.length,
              },
              aiInsight: `${outOfStock.length} out-of-stock SKUs require immediate supplier purchase orders.`,
            },
            source: 'Warehouse Inventory & Variant Threshold Engine',
            sourcesUsed: ['Product Variants Ledger', 'Minimum Stock Rules', 'Warehouse Stock Matrix'],
            generatedAt: now,
            confidence: 1.0,
            toolExecuted: 'getLowStockProducts',
          };
        }

        // 6. Master Inventory Overview
        if (
          query.includes('inventory') ||
          query.includes('total stock') ||
          query.includes('stock valuation') ||
          query.includes('stock value') ||
          query.includes('warehouse') ||
          query.includes('how many products') ||
          query.includes('how many items')
        ) {
          const pList = loadStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
          const vList = loadStorage(STORAGE_KEYS.VARIANTS, DEFAULT_VARIANTS);
          const totalUnits = vList.reduce((acc: number, v: any) => acc + (Number(v.current_stock) || 0), 0);
          const costVal = vList.reduce((acc: number, v: any) => acc + ((Number(v.current_stock) || 0) * (Number(v.purchase_price) || 0)), 0);
          const retailVal = vList.reduce((acc: number, v: any) => acc + ((Number(v.current_stock) || 0) * (Number(v.selling_price) || 0)), 0);
          const lowCount = vList.filter((v: any) => v.current_stock > 0 && v.current_stock <= (v.minimum_stock || 10)).length;
          const outCount = vList.filter((v: any) => v.current_stock === 0).length;

          return {
            answer: `### 📦 Warehouse & Inventory Overview\n\n` +
              `• **Active Products:** **${pList.length} products** (${vList.length} SKUs)\n` +
              `• **Total Stock in Store:** **${totalUnits.toLocaleString()} units**\n` +
              `• **Stock Valuation (Cost):** **₹${costVal.toLocaleString()}**\n` +
              `• **Estimated Retail Value:** **₹${retailVal.toLocaleString()}** (Potential Gross Margin: **₹${(retailVal - costVal).toLocaleString()}**)\n` +
              `• **Alerts:** ${lowCount} Low Stock, ${outCount} Out of Stock`,
            data: {
              type: 'inventory_summary',
              title: 'Inventory Valuation & Metrics',
              metrics: {
                'Total Products': pList.length,
                'Total SKUs': vList.length,
                'In-Stock Units': totalUnits.toLocaleString(),
                'Cost Valuation': `₹${costVal.toLocaleString()}`,
                'Retail Valuation': `₹${retailVal.toLocaleString()}`,
                'Gross Margin': `₹${(retailVal - costVal).toLocaleString()}`,
              },
              aiInsight: `Total store inventory health is strong across ${totalUnits.toLocaleString()} units.`,
            },
            source: 'Master Warehouse Stock Balance & Costing Registry',
            sourcesUsed: ['Product Variants Table', 'Purchase Cost Master', 'Active SKU Inventory'],
            generatedAt: now,
            confidence: 1.0,
            toolExecuted: 'getInventorySummary',
          };
        }

        // 7. Customers & Loyalty
        if (
          query.includes('customer') ||
          query.includes('client') ||
          query.includes('patron') ||
          query.includes('loyalty') ||
          query.includes('buyer')
        ) {
          const cList = loadStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
          return {
            answer: `### 👥 Customer CRM & Loyalty Insights\n\n` +
              `• **Total Registered Customers:** **${cList.length}**\n` +
              `• **New Customers Today:** **+3**\n\n` +
              `#### 🌟 Top Loyalty Customers:\n` +
              `1. **Dr. Sundaram Meenakshi** — Lifetime Spend: **₹54,990** (480 pts)\n` +
              `2. **Mrs. Radhika Natarajan** — Lifetime Spend: **₹24,500** (210 pts)\n` +
              `3. **Karthik Subramanian** — Lifetime Spend: **₹12,890** (95 pts)`,
            data: {
              type: 'customer_summary',
              title: 'Customer Directory & Loyalty',
              metrics: {
                'Total Customers': cList.length,
                'New Today': 3,
                'Top Customer': 'Dr. Sundaram Meenakshi',
              },
              aiInsight: 'High customer retention with top loyalty members contributing 38% of monthly repeat billings.',
            },
            source: 'Customer CRM Database & Loyalty Engine',
            sourcesUsed: ['Customer Accounts', 'Loyalty Balance Register', 'Sales Invoices by Customer'],
            generatedAt: now,
            confidence: 1.0,
            toolExecuted: 'getCustomerSummary',
          };
        }

        // 8. Attendance & Staff
        if (
          query.includes('attendance') ||
          query.includes('present') ||
          query.includes('on duty') ||
          query.includes('who is working') ||
          query.includes('staff on floor')
        ) {
          return {
            answer: `### ⏱️ Staff Attendance & On-Duty Summary\n\n` +
              `• **Total Active Staff:** **6**\n` +
              `• **Present On Duty:** **5 staff** (Arun Kumar, Priya Sharma, Rajesh Kumar, Karthik Raja, Anitha Ramesh)\n` +
              `• **Late Arrivals:** **1** (Arun Kumar - 15 mins)\n` +
              `• **On Leave:** **1** (Muthu Vel - Casual Leave)`,
            data: {
              type: 'attendance_summary',
              title: 'Staff On-Duty Attendance',
              metrics: {
                'Active Staff': 6,
                'Present Today': 5,
                'Late Arrivals': 1,
                'On Leave': 1,
              },
              aiInsight: '5 out of 6 store associates are on duty. Sales counter and billing POS are fully staffed.',
            },
            source: 'Biometric & Terminal Staff Attendance Register',
            sourcesUsed: ['Staff Master', 'Attendance Log', 'Shift Schedules'],
            generatedAt: now,
            confidence: 1.0,
            toolExecuted: 'getAttendanceSummary',
          };
        }

        // 9. Forecasting / Future (Anti-Hallucination & Scope protection)
        const isForecast = query.includes('forecast') || query.includes('predict') || query.includes('next month') || query.includes('future') || query.includes('next year');
        if (isForecast) {
          return {
            answer: `🔮 **Demand & Sales Forecasting Notice**\n\n` +
              `I specialize in real-time showroom analytics, live sales performance, stock movements, and staff operational data. ` +
              `For deep predictive replenishment, please explore the **Smart Reorders & Inventory Planning** tab.\n\n` +
              `Right now, I can provide real-time reporting on:\n` +
              `• Today's / Yesterday's sales & transactions\n` +
              `• Top-selling fast movers & categories\n` +
              `• Current low stock & out-of-stock items\n` +
              `• Customer loyalty & on-duty staff attendance`,
            data: {
              type: 'out_of_scope',
              title: 'Assistant Scope Notice',
              aiInsight: 'For forward replenishment models, consult the Inventory Planning module.',
            },
            source: 'Ratna Vilas AI Capability Registry',
            sourcesUsed: ['AI Capability Definition'],
            generatedAt: now,
            confidence: 1.0,
          };
        }

        // Default General Guidance Response
        return {
          answer: `🤖 **ரத்னா விலாஸ் AI அசிஸ்டன்ட் (Ratna Vilas AI)**\n\n` +
            `கடையின் **விற்பனை (Sales), இருப்பு (Inventory), வாடிக்கையாளர் (Customers), பட்டு சேலைகள் (Products)** பற்றிய கேள்விகளை என்னிடம் கேட்கலாம்.\n\n` +
            `Try asking:\n` +
            `• *"How much did we sell today?"*\n` +
            `• *"What are today's top-selling products?"*\n` +
            `• *"Which items are low in stock?"*\n` +
            `• *"இன்னைக்கு sales நிலவரம் என்ன?"*`,
          data: {
            type: 'general_answer',
            title: 'Assistant Help',
          },
          source: 'Ratna Vilas AI Assistant',
          sourcesUsed: ['Textile Business Intelligence Guide'],
          generatedAt: now,
          confidence: 1.0,
        };
      },

      getQuickPrompts: async (userContext?: any) => {
        const rawUser = localStorage.getItem('texora_current_user');
        let user = userContext;
        if (!user && rawUser) {
          try { user = JSON.parse(rawUser); } catch {}
        }
        const role = (user?.roleName || user?.role || 'Cashier').toLowerCase();

        if (role === 'cashier' || role === 'staff') {
          return [
            { id: 'cashier_shift_sales', label: '💳 My Register Total', prompt: 'Show my shift sales and bills processed today.', category: 'sales' },
            { id: 'saree_cross_sell', label: '👗 Cross-Sell Match', prompt: 'What accessories pair best with Bridal Silk Sarees?', category: 'inventory' },
            { id: 'low_stock', label: '🚨 Low Stock Alerts', prompt: 'Which products are low or out of stock?', category: 'inventory' },
            { id: 'attendance_check', label: '⏱️ Staff on Duty', prompt: 'How many staff members are present on duty today?', category: 'staff' },
          ];
        }

        return [
          { id: 'sales_today', label: '📊 Store Sales Today', prompt: 'How much did the store sell today?', category: 'sales' },
          { id: 'top_sellers', label: '🏆 Top Selling Items', prompt: 'What are today’s top-selling products?', category: 'sales' },
          { id: 'low_stock', label: '🚨 Low Stock Alerts', prompt: 'Which products are low or out of stock?', category: 'inventory' },
          { id: 'business_summary', label: '📈 Executive Summary', prompt: 'Give me today’s executive business summary.', category: 'reports' },
          { id: 'inventory_overview', label: '📦 Inventory Overview', prompt: 'What is our total stock and replenishment status?', category: 'inventory' },
          { id: 'top_customers', label: '👥 Customer Loyalty', prompt: 'How many customers purchased today and who are the top patrons?', category: 'customers' },
          { id: 'attendance_check', label: '⏱️ Staff on Duty', prompt: 'How many staff members are present on duty today?', category: 'staff' },
        ];
      },

      getLogs: async () => [],
      getStats: async () => ({
        totalRequests: 1,
        successfulRequests: 1,
        averageLatencyMs: 45,
        rateLimitRule: '30 reqs/min',
      }),

      getSalesInsights: async (timeframe = 'week') => {
        const isToday = timeframe === 'today';
        const isMonth = timeframe === 'month';
        const now = new Date().toISOString();

        const currentSales = isToday ? 84250 : isMonth ? 842000 : 385400;
        const previousSales = isToday ? 75200 : isMonth ? 765000 : 338000;
        const currentTx = isToday ? 126 : isMonth ? 1248 : 584;
        const previousTx = isToday ? 112 : isMonth ? 1160 : 520;
        const growthPct = isToday ? 12 : isMonth ? 10 : 14;

        const payload = {
          timeframe,
          periodLabel: isToday ? 'Today' : isMonth ? 'This Month' : 'Last 7 Days',
          comparisonLabel: isToday ? 'Yesterday' : isMonth ? 'Last Month' : 'Previous 7 Days',
          periodMetrics: {
            currentSales,
            previousSales,
            growthPercentage: growthPct,
            growthDirection: 'higher' as const,
            currentTransactions: currentTx,
            previousTransactions: previousTx,
            transactionGrowthPercentage: 12,
            currentAOV: isToday ? 669 : 660,
            previousAOV: isToday ? 671 : 650,
            aovGrowthPercentage: 2,
            totalUnitsSold: isToday ? 218 : 1120,
            totalDiscounts: isToday ? 4200 : 32000,
            discountRate: 4.8,
            returnRate: 2.1,
          },
          categoryVelocity: [
            { id: 1, categoryName: 'Kanchipuram Silks & Sarees', currentRevenue: Math.round(currentSales * 0.42), previousRevenue: Math.round(previousSales * 0.38), revenueContributionPct: 42, growthPercentage: 24, growthDirection: 'higher' as const, unitsSold: 94 },
            { id: 2, categoryName: 'Men’s Formal & Ethnic Wear', currentRevenue: Math.round(currentSales * 0.26), previousRevenue: Math.round(previousSales * 0.28), revenueContributionPct: 26, growthPercentage: 6, growthDirection: 'lower' as const, unitsSold: 68 },
            { id: 3, categoryName: 'Kids & Festive Wear', currentRevenue: Math.round(currentSales * 0.18), previousRevenue: Math.round(previousSales * 0.16), revenueContributionPct: 18, growthPercentage: 16, growthDirection: 'higher' as const, unitsSold: 46 },
            { id: 4, categoryName: 'Designer Kurtis & Materials', currentRevenue: Math.round(currentSales * 0.14), previousRevenue: Math.round(previousSales * 0.18), revenueContributionPct: 14, growthPercentage: 8, growthDirection: 'higher' as const, unitsSold: 32 },
          ],
          hourlyDistribution: [
            { hour: 10, hourLabel: '10 AM', salesTotal: 8400, transactionCount: 14, isPeakHour: false },
            { hour: 11, hourLabel: '11 AM', salesTotal: 12500, transactionCount: 18, isPeakHour: false },
            { hour: 12, hourLabel: '12 PM', salesTotal: 16200, transactionCount: 22, isPeakHour: false },
            { hour: 13, hourLabel: '1 PM', salesTotal: 9800, transactionCount: 12, isPeakHour: false },
            { hour: 14, hourLabel: '2 PM', salesTotal: 7200, transactionCount: 9, isPeakHour: false },
            { hour: 15, hourLabel: '3 PM', salesTotal: 11400, transactionCount: 15, isPeakHour: false },
            { hour: 16, hourLabel: '4 PM', salesTotal: 15800, transactionCount: 21, isPeakHour: false },
            { hour: 17, hourLabel: '5 PM', salesTotal: 22400, transactionCount: 28, isPeakHour: false },
            { hour: 18, hourLabel: '6 PM', salesTotal: 34500, transactionCount: 42, isPeakHour: true },
            { hour: 19, hourLabel: '7 PM', salesTotal: 41200, transactionCount: 54, isPeakHour: true },
            { hour: 20, hourLabel: '8 PM', salesTotal: 36800, transactionCount: 46, isPeakHour: true },
            { hour: 21, hourLabel: '9 PM', salesTotal: 14200, transactionCount: 18, isPeakHour: false },
          ],
          dayOfWeekDistribution: [
            { dayOfWeek: 0, dayName: 'Sunday', salesTotal: 76000, transactionCount: 115, percentageOfWeeklyTotal: 22.5, isWeekend: true },
            { dayOfWeek: 1, dayName: 'Monday', salesTotal: 42000, transactionCount: 65, percentageOfWeeklyTotal: 12.4, isWeekend: false },
            { dayOfWeek: 2, dayName: 'Tuesday', salesTotal: 45000, transactionCount: 68, percentageOfWeeklyTotal: 13.3, isWeekend: false },
            { dayOfWeek: 3, dayName: 'Wednesday', salesTotal: 41000, transactionCount: 62, percentageOfWeeklyTotal: 12.1, isWeekend: false },
            { dayOfWeek: 4, dayName: 'Thursday', salesTotal: 53000, transactionCount: 78, percentageOfWeeklyTotal: 15.6, isWeekend: false },
            { dayOfWeek: 5, dayName: 'Friday', salesTotal: 58000, transactionCount: 84, percentageOfWeeklyTotal: 17.1, isWeekend: false },
            { dayOfWeek: 6, dayName: 'Saturday', salesTotal: 81000, transactionCount: 124, percentageOfWeeklyTotal: 24.0, isWeekend: true },
          ],
          customerCohorts: {
            totalActiveCustomers: 148,
            newCustomersCount: 56,
            newCustomerRevenue: Math.round(currentSales * 0.38),
            newCustomerRevenuePct: 38,
            returningCustomersCount: 92,
            returningCustomerRevenue: Math.round(currentSales * 0.62),
            returningCustomerRevenuePct: 62,
            repeatPurchaseRate: 62,
          },
          productReturnRates: [
            { productId: 1, productName: 'Premium Egyptian Giza Cotton Shirt', sku: 'MSH-EGY-002-WHT-40', categoryName: 'Men’s Wear', unitsSold: 120, unitsReturned: 14, returnRatePct: 11.7, refundAmount: 34986, commonReason: 'Sizing & collar fit variance', isHighRisk: true },
            { productId: 2, productName: 'Pure Linen Formal Trouser', sku: 'MTR-LIN-005-BEI-32', categoryName: 'Men’s Wear', unitsSold: 85, unitsReturned: 5, returnRatePct: 5.8, refundAmount: 11495, commonReason: 'Waist alteration exchange', isHighRisk: false },
            { productId: 3, productName: 'Bridal Kanchipuram Pure Silk Saree', sku: 'SAR-KAN-001-RED-FS', categoryName: 'Sarees', unitsSold: 64, unitsReturned: 1, returnRatePct: 1.5, refundAmount: 17999, commonReason: 'Color shade exchange', isHighRisk: false },
          ],
          insights: [
            {
              id: 'ins_trend_sales_main',
              type: 'trend',
              title: `Sales Increased by ${growthPct}% (${isToday ? 'Today' : isMonth ? 'This Month' : 'This Week'})`,
              description: `Total revenue reached ₹${currentSales.toLocaleString()} with strong counter billings compared to ₹${previousSales.toLocaleString()} in the prior period.`,
              metricChange: `+${growthPct}%`,
              confidence: 'high',
              actionableRecommendation: 'Maintain fast-moving stock levels and ensure sufficient cash register change for peak volumes.',
              category: 'Sales Growth',
              timestamp: now,
            },
            {
              id: 'ins_opp_top_cat',
              type: 'opportunity',
              title: 'Kanchipuram Silk Sarees Lead Revenue (42% Share)',
              description: 'Bridal silks and heavy brocade sarees are generating the highest gross margin and customer basket size (+24% growth).',
              metricChange: '42% share',
              confidence: 'high',
              actionableRecommendation: 'Ensure premium showcase displays and maintain healthy inventory buffers for festival collections.',
              category: 'Category Velocity',
              timestamp: now,
            },
            {
              id: 'ins_warn_product_return',
              type: 'warning',
              title: 'Men’s Formal Shirts Selling 6% Slower (11.7% Return Rate)',
              description: '14 out of 120 Giza Cotton Shirts were returned for exchange/refund due to collar and shoulder sizing variance.',
              metricChange: '11.7% return',
              confidence: 'medium',
              actionableRecommendation: 'Review batch size chart with your supplier and cross-train sales staff on precise fit consultation.',
              category: 'Quality & Returns',
              timestamp: now,
            },
            {
              id: 'ins_rec_peak_hours',
              type: 'recommendation',
              title: 'Peak Store Rush Between 6:00 PM and 8:30 PM (46% Volume)',
              description: 'Over 46% of daily billing volume is concentrated during the 3-hour evening window.',
              metricChange: '6 PM - 8 PM',
              confidence: 'high',
              actionableRecommendation: 'Align associate dinner breaks and ensure all 3 POS checkout terminals are staffed from 6 PM to 9 PM.',
              category: 'Store Operations',
              timestamp: now,
            },
            {
              id: 'ins_info_loyalty_cohort',
              type: 'information',
              title: 'Returning Patrons Drive 62% of Revenue',
              description: 'Repeat loyalty members generate significantly higher ticket averages compared to first-time walk-ins.',
              metricChange: '62% repeat',
              confidence: 'high',
              actionableRecommendation: 'Instruct cashiers to enroll 100% of walk-in buyers into loyalty rewards at checkout.',
              category: 'Customer Loyalty',
              timestamp: now,
            },
          ],
          generatedAt: now,
        };

        return { success: true, data: payload };
      },

      getDailySummary: async () => {
        return {
          success: true,
          data: {
            date: '2026-08-25',
            dateFormatted: 'Tuesday, August 25, 2026',
            totalRevenue: 84250,
            totalTransactions: 126,
            averageOrderValue: 669,
            topPerformingCategory: 'Kanchipuram Silks & Sarees',
            bestSellingProduct: 'Bridal Kanchipuram Pure Silk Saree',
            growthVsYesterdayPct: 12,
            growthDirection: 'higher',
            criticalAttentionItems: [
              '4 product variants are approaching or below minimum stock threshold.',
              'Giza Cotton Shirts recorded 2 returns today due to collar size variance.',
            ],
            keyHighlights: [
              'Sales are 12% higher than yesterday’s total of ₹75,200.',
              'Silk Sarees generated 42% of today’s turnover.',
              'Evening rush from 6 PM to 8:30 PM contributed 46% of total transactions.',
            ],
            confidence: 'high',
          },
        };
      },

      getInventoryIntelligence: async () => {
        const forecasts = [
          {
            variantId: 1,
            productId: 1,
            productName: 'Bridal Kanchipuram Pure Silk Saree',
            sku: 'SAR-KAN-001-RED-FS',
            categoryName: 'Sarees',
            brandName: 'Nalli Silk Heritage',
            size: 'Free Size',
            color: 'Crimson Red / Gold Zari',
            currentStock: 18,
            minimumStock: 10,
            reorderLevel: 25,
            supplierName: 'Kanchipuram Master Weavers Guild',
            leadTimeDays: 7,
            purchasePrice: 12500,
            sellingPrice: 18999,
            averageDailyDemand: 4.4,
            daysOfSupplyRemaining: 4,
            forecast7Days: 31,
            forecast14Days: 62,
            forecast30Days: 132,
            smartReorderPoint: 42,
            recommendedOrderQuantity: 125,
            stockRiskLevel: 'critical',
            confidence: 'high',
            aiExplanation: 'Reorder urgently recommended. High sales velocity (~4.4 units/day); current inventory (18) will last ~4 days. Supplier delivery requires 7 days.',
            actionableSuggestion: 'Place replenishment order for 125 units with Kanchipuram Weavers Guild to prevent stockout.',
            demandTimeline: [
              { weekLabel: 'Wk -6', dateLabel: '42d ago', actualUnits: 18, isForecast: false },
              { weekLabel: 'Wk -5', dateLabel: '35d ago', actualUnits: 22, isForecast: false },
              { weekLabel: 'Wk -4', dateLabel: '28d ago', actualUnits: 20, isForecast: false },
              { weekLabel: 'Wk -3', dateLabel: '21d ago', actualUnits: 27, isForecast: false },
              { weekLabel: 'Wk -2', dateLabel: '14d ago', actualUnits: 31, isForecast: false },
              { weekLabel: 'Wk -1', dateLabel: '7d ago', actualUnits: 29, isForecast: false },
              { weekLabel: '+Wk 1', dateLabel: 'Next 7d', projectedUnits: 31, isForecast: true },
              { weekLabel: '+Wk 2', dateLabel: 'Next 14d', projectedUnits: 33, isForecast: true },
              { weekLabel: '+Wk 3', dateLabel: 'Next 21d', projectedUnits: 34, isForecast: true },
              { weekLabel: '+Wk 4', dateLabel: 'Next 28d', projectedUnits: 34, isForecast: true },
            ],
          },
          {
            variantId: 2,
            productId: 2,
            productName: 'Soft Handloom Cotton Saree',
            sku: 'SAR-COT-002-BLU-FS',
            categoryName: 'Sarees',
            brandName: 'Coimbatore Cottons',
            size: 'Free Size',
            color: 'Indigo Blue',
            currentStock: 14,
            minimumStock: 8,
            reorderLevel: 20,
            supplierName: 'Coimbatore Handlooms Ltd',
            leadTimeDays: 4,
            purchasePrice: 1200,
            sellingPrice: 2499,
            averageDailyDemand: 2.2,
            daysOfSupplyRemaining: 6,
            forecast7Days: 15,
            forecast14Days: 31,
            forecast30Days: 66,
            smartReorderPoint: 22,
            recommendedOrderQuantity: 60,
            stockRiskLevel: 'critical',
            confidence: 'high',
            aiExplanation: 'Reorder recommended. Selling ~2.2 units/day; current stock (14) will deplete in 6 days. Supplier lead time is 4 days.',
            actionableSuggestion: 'Restock 60 units to cover 30-day forecast.',
            demandTimeline: [
              { weekLabel: 'Wk -6', dateLabel: '42d ago', actualUnits: 12, isForecast: false },
              { weekLabel: 'Wk -5', dateLabel: '35d ago', actualUnits: 14, isForecast: false },
              { weekLabel: 'Wk -4', dateLabel: '28d ago', actualUnits: 15, isForecast: false },
              { weekLabel: 'Wk -3', dateLabel: '21d ago', actualUnits: 16, isForecast: false },
              { weekLabel: 'Wk -2', dateLabel: '14d ago', actualUnits: 15, isForecast: false },
              { weekLabel: 'Wk -1', dateLabel: '7d ago', actualUnits: 16, isForecast: false },
              { weekLabel: '+Wk 1', dateLabel: 'Next 7d', projectedUnits: 16, isForecast: true },
              { weekLabel: '+Wk 2', dateLabel: 'Next 14d', projectedUnits: 16, isForecast: true },
              { weekLabel: '+Wk 3', dateLabel: 'Next 21d', projectedUnits: 17, isForecast: true },
              { weekLabel: '+Wk 4', dateLabel: 'Next 28d', projectedUnits: 17, isForecast: true },
            ],
          },
          {
            variantId: 3,
            productId: 3,
            productName: 'Premium Egyptian Giza Cotton Shirt',
            sku: 'MSH-EGY-002-WHT-40',
            categoryName: 'Men’s Wear',
            brandName: 'Raymond Luxury',
            size: '40 (M)',
            color: 'Classic White',
            currentStock: 48,
            minimumStock: 15,
            reorderLevel: 30,
            supplierName: 'Raymond Textile Mills',
            leadTimeDays: 5,
            purchasePrice: 1450,
            sellingPrice: 2499,
            averageDailyDemand: 1.6,
            daysOfSupplyRemaining: 30,
            forecast7Days: 11,
            forecast14Days: 22,
            forecast30Days: 48,
            smartReorderPoint: 28,
            recommendedOrderQuantity: 0,
            stockRiskLevel: 'healthy',
            confidence: 'medium',
            aiExplanation: 'Stock levels are healthy. 48 units in stock covers expected 30-day demand.',
            actionableSuggestion: 'No reorder required. Monitor return rate.',
            demandTimeline: [
              { weekLabel: 'Wk -6', dateLabel: '42d ago', actualUnits: 14, isForecast: false },
              { weekLabel: 'Wk -5', dateLabel: '35d ago', actualUnits: 12, isForecast: false },
              { weekLabel: 'Wk -4', dateLabel: '28d ago', actualUnits: 11, isForecast: false },
              { weekLabel: 'Wk -3', dateLabel: '21d ago', actualUnits: 10, isForecast: false },
              { weekLabel: 'Wk -2', dateLabel: '14d ago', actualUnits: 11, isForecast: false },
              { weekLabel: 'Wk -1', dateLabel: '7d ago', actualUnits: 11, isForecast: false },
              { weekLabel: '+Wk 1', dateLabel: 'Next 7d', projectedUnits: 11, isForecast: true },
              { weekLabel: '+Wk 2', dateLabel: 'Next 14d', projectedUnits: 11, isForecast: true },
              { weekLabel: '+Wk 3', dateLabel: 'Next 21d', projectedUnits: 12, isForecast: true },
              { weekLabel: '+Wk 4', dateLabel: 'Next 28d', projectedUnits: 12, isForecast: true },
            ],
          },
          {
            variantId: 4,
            productId: 4,
            productName: 'Traditional Raw Silk Men’s Kurta',
            sku: 'MKU-RAW-004-GLD-L',
            categoryName: 'Men’s Wear',
            brandName: 'Manyavar Festive',
            size: 'L (42)',
            color: 'Festive Gold',
            currentStock: 36,
            minimumStock: 10,
            reorderLevel: 20,
            supplierName: 'Ethnic Garment Suppliers',
            leadTimeDays: 6,
            purchasePrice: 1800,
            sellingPrice: 3299,
            averageDailyDemand: 0.15,
            daysOfSupplyRemaining: 240,
            forecast7Days: 1,
            forecast14Days: 2,
            forecast30Days: 5,
            smartReorderPoint: 12,
            recommendedOrderQuantity: 0,
            stockRiskLevel: 'dead_stock',
            confidence: 'high',
            aiExplanation: 'Stagnant inventory: only 1 unit sold in 60 days with 36 units remaining on shelves.',
            actionableSuggestion: 'Bundle with silk dhoti for upcoming wedding season or apply promotional discount.',
            demandTimeline: [
              { weekLabel: 'Wk -6', dateLabel: '42d ago', actualUnits: 0, isForecast: false },
              { weekLabel: 'Wk -5', dateLabel: '35d ago', actualUnits: 1, isForecast: false },
              { weekLabel: 'Wk -4', dateLabel: '28d ago', actualUnits: 0, isForecast: false },
              { weekLabel: 'Wk -3', dateLabel: '21d ago', actualUnits: 0, isForecast: false },
              { weekLabel: 'Wk -2', dateLabel: '14d ago', actualUnits: 0, isForecast: false },
              { weekLabel: 'Wk -1', dateLabel: '7d ago', actualUnits: 0, isForecast: false },
              { weekLabel: '+Wk 1', dateLabel: 'Next 7d', projectedUnits: 1, isForecast: true },
              { weekLabel: '+Wk 2', dateLabel: 'Next 14d', projectedUnits: 1, isForecast: true },
              { weekLabel: '+Wk 3', dateLabel: 'Next 21d', projectedUnits: 1, isForecast: true },
              { weekLabel: '+Wk 4', dateLabel: 'Next 28d', projectedUnits: 1, isForecast: true },
            ],
          },
        ];

        return {
          success: true,
          data: {
            totalVariantsAnalyzed: 165,
            criticalReorderCount: 8,
            monitorCount: 12,
            healthyCount: 141,
            deadStockCount: 4,
            capitalTiedInDeadStock: 64800,
            urgentReordersEstimatedCost: 1634500,
            topReorderRecommendations: [
              {
                variantId: 1,
                productId: 1,
                productName: 'Bridal Kanchipuram Pure Silk Saree',
                sku: 'SAR-KAN-001-RED-FS',
                categoryName: 'Sarees',
                supplierName: 'Kanchipuram Master Weavers Guild',
                currentStock: 18,
                averageDailyDemand: 4.4,
                daysOfSupply: 4,
                leadTimeDays: 7,
                smartReorderPoint: 42,
                suggestedReorderQuantity: 125,
                estimatedCost: 1562500,
                stockRiskLevel: 'critical',
                confidence: 'high',
                aiReasoning: 'Selling ~4.4 units/day; current stock (18) will deplete in 4 days. Supplier delivery requires 7 days.',
              },
              {
                variantId: 2,
                productId: 2,
                productName: 'Soft Handloom Cotton Saree',
                sku: 'SAR-COT-002-BLU-FS',
                categoryName: 'Sarees',
                supplierName: 'Coimbatore Handlooms Ltd',
                currentStock: 14,
                averageDailyDemand: 2.2,
                daysOfSupply: 6,
                leadTimeDays: 4,
                smartReorderPoint: 22,
                suggestedReorderQuantity: 60,
                estimatedCost: 72000,
                stockRiskLevel: 'critical',
                confidence: 'high',
                aiReasoning: 'Selling ~2.2 units/day; current stock (14) will deplete in 6 days. Supplier lead time is 4 days.',
              },
            ],
            deadStockList: [
              {
                variantId: 4,
                productId: 4,
                productName: 'Traditional Raw Silk Men’s Kurta',
                sku: 'MKU-RAW-004-GLD-L',
                categoryName: 'Men’s Wear',
                currentStock: 36,
                stockCostValue: 64800,
                sellingPrice: 3299,
                daysSinceLastSale: 52,
                unitsSoldIn60Days: 1,
                recommendation: 'Bundle as festive combo gift with silk dhotis or apply 15% promotional discount.',
              },
            ],
            allForecasts: forecasts,
            generatedAt: new Date().toISOString(),
          },
        };
      },

      getProductForecast: async (variantId: number) => {
        const res = await (mockApi.ai as any).getInventoryIntelligence();
        const item = res.data?.allForecasts?.find((f: any) => f.variantId === variantId);
        return { success: true, data: item || res.data?.allForecasts?.[0] };
      },

      getDeadStock: async () => {
        const res = await (mockApi.ai as any).getInventoryIntelligence();
        return { success: true, data: res.data?.deadStockList || [] };
      },

      getCartRecommendations: async (request: any) => {
        const cartIds = request?.cartVariantIds || [];
        const customerId = request?.customerId;

        const allCandidates = [
          {
            variantId: 101,
            productId: 101,
            productName: 'Matching Brocade Silk Blouse Piece (1 Meter)',
            sku: 'ACC-BLU-001-RED-1M',
            categoryName: 'Dress Materials',
            sellingPrice: 850,
            currentStock: 42,
            strategy: 'frequently_bought_together',
            strategyLabel: 'Frequently Bought Together',
            confidenceScore: 0.94,
            aiReasoning: '64% of customers buying Bridal Silk Sarees also add this Matching Brocade Blouse piece.',
            triggerProductName: 'Bridal Kanchipuram Pure Silk Saree',
          },
          {
            variantId: 102,
            productId: 102,
            productName: 'Cotton Saree Shapewear / Petticoat',
            sku: 'ACC-PET-003-GLD-FS',
            categoryName: 'Accessories',
            sellingPrice: 450,
            currentStock: 56,
            strategy: 'frequently_bought_together',
            strategyLabel: 'Complementary Accessory',
            confidenceScore: 0.88,
            aiReasoning: 'High co-occurrence with saree purchases (added in 48% of saree bills).',
            triggerProductName: 'Handloom Cotton Saree',
          },
          {
            variantId: 103,
            productId: 103,
            productName: 'Pure Linen Formal Trouser',
            sku: 'MTR-LIN-005-BEI-32',
            categoryName: 'Men’s Wear',
            sellingPrice: 2299,
            currentStock: 28,
            strategy: 'frequently_bought_together',
            strategyLabel: 'Complete The Look',
            confidenceScore: 0.91,
            aiReasoning: 'Frequently paired with Egyptian Giza Cotton Shirts.',
            triggerProductName: 'Giza Cotton Shirt',
          },
          {
            variantId: 104,
            productId: 104,
            productName: 'Pure Silk Dhoti with Gold Zari Border',
            sku: 'DHO-SILK-001-WHT-FS',
            categoryName: 'Men’s Wear',
            sellingPrice: 1899,
            currentStock: 34,
            strategy: 'personalized_affinity',
            strategyLabel: 'Personalized Festive Pick',
            confidenceScore: 0.86,
            aiReasoning: 'Matches customer’s historical affinity for festive traditional wear.',
          },
        ];

        let selected = allCandidates;
        if (cartIds.length > 0) {
          const firstId = cartIds[0];
          if (firstId === 1) {
            selected = [allCandidates[0], allCandidates[1]];
          } else if (firstId === 3) {
            selected = [allCandidates[2]];
          } else if (firstId === 4) {
            selected = [allCandidates[3]];
          }
        } else if (customerId === 1) {
          selected = [allCandidates[3], allCandidates[0]];
        }

        return {
          success: true,
          data: {
            recommendations: selected,
            activeCartItemCount: cartIds.length,
            suggestedBundleSavings: selected.length >= 2 ? 150 : 0,
            generatedAt: new Date().toISOString(),
          },
        };
      },

      getCustomerIntelligence: async (customerId: number) => {
        const isVip = customerId === 1 || customerId === 2;
        return {
          success: true,
          data: {
            customerId,
            customerCode: `CUST-${String(customerId).padStart(4, '0')}`,
            customerName: isVip ? 'Meenakshi Sundaram' : 'Rajesh Kannan',
            segment: isVip ? 'vip_high_value' : 'returning_regular',
            segmentLabel: isVip ? '👑 VIP High-Value Patron' : '🔄 Returning Regular',
            totalLifetimeSpend: isVip ? 78450 : 18200,
            totalVisits: isVip ? 8 : 3,
            averageOrderValue: isVip ? 9800 : 6066,
            preferredCategory: 'Kanchipuram Silks & Sarees',
            categoryAffinities: [
              { categoryId: 1, categoryName: 'Kanchipuram Silks & Sarees', purchaseCount: isVip ? 6 : 2, totalSpent: isVip ? 64000 : 14000, percentageOfSpend: 81.5 },
              { categoryId: 2, categoryName: 'Dress Materials & Blouses', purchaseCount: isVip ? 4 : 1, totalSpent: isVip ? 8450 : 2200, percentageOfSpend: 10.7 },
              { categoryId: 3, categoryName: 'Accessories', purchaseCount: isVip ? 3 : 1, totalSpent: isVip ? 6000 : 2000, percentageOfSpend: 7.8 },
            ],
            frequentlyPurchasedSkus: [
              'Bridal Kanchipuram Pure Silk Saree (SAR-KAN-001-RED-FS)',
              'Matching Brocade Silk Blouse Piece (ACC-BLU-001-RED-1M)',
            ],
            averageDaysBetweenPurchases: 42,
            daysSinceLastPurchase: 38,
            isDueForVisit: true,
            estimatedNextVisitDate: 'Within 4-7 Days (Festive Season)',
            suggestedAction: 'Customer usually visits every ~42 days (last visit was 38 days ago). Introduce newly arrived Wedding Silk Saree collections.',
          },
        };
      },

      getProductRecommendations: async (productId: number) => {
        const res = await (mockApi.ai as any).getCartRecommendations({ cartVariantIds: [productId] });
        return { success: true, data: res.data?.recommendations || [] };
      },

      trackRecommendationFeedback: async () => {
        return { success: true };
      },

      getAnomalies: async (filter?: any) => {
        const list = [
          {
            id: 'AN-DISC-10482',
            type: 'UNUSUAL_DISCOUNT',
            title: 'Unusual 42% Manual Discount on Bridal Silk Saree',
            severity: 'high',
            status: 'open',
            entityType: 'sale',
            entityId: 'INV-10482',
            entityName: 'Invoice #INV-10482 (Cashier Terminal 2)',
            riskScore: 78,
            evidence: {
              metricName: 'Discount Percentage',
              detectedValue: '42% (₹7,980)',
              expectedBaseline: '5% – 15%',
              deviationMultiplier: 3.8,
              additionalContext: 'Item: Bridal Kanchipuram Pure Silk Saree. No promotional code tagged.',
            },
            aiExplanation: 'The 42% discount exceeds the store baseline (5–15%) by 3.8x. This may be an approved special wedding party concession or an unauthorized discount.',
            suggestedAction: 'Verify manager approval signature and customer wedding registration card.',
            detectedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'AN-STK-00912',
            type: 'LARGE_STOCK_ADJUSTMENT',
            title: 'High-Volume Stock Adjustment (-350 units) on Handloom Cotton Sarees',
            severity: 'critical',
            status: 'open',
            entityType: 'stock_adjustment',
            entityId: 'ADJ-00912',
            entityName: 'Soft Handloom Cotton Saree (SAR-COT-002)',
            riskScore: 92,
            evidence: {
              metricName: 'Stock Reduction',
              detectedValue: '-350 units (₹8,74,650 retail value)',
              expectedBaseline: '±5 to ±20 units',
              deviationMultiplier: 17.5,
              additionalContext: 'Adjustment reason logged as "Stock count correction".',
            },
            aiExplanation: 'A sudden stock reduction of -350 units was logged for Handloom Cotton Sarees. Such a major write-off requires physical inventory verification.',
            suggestedAction: 'Immediate physical count in rack section B4 and review warehouse dispatch notes.',
            detectedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          },
          {
            id: 'AN-RET-00411',
            type: 'ABNORMAL_RETURN_VOLUME',
            title: 'Unusual Spike in Return Activity (31 returns vs 4 avg/day)',
            severity: 'medium',
            status: 'open',
            entityType: 'store_day',
            entityId: 'RET-DAY-TODAY',
            entityName: 'Customer Service Counter 1',
            riskScore: 68,
            evidence: {
              metricName: 'Daily Returns Count',
              detectedValue: '31 returns today',
              expectedBaseline: '3 – 8 returns / day',
              deviationMultiplier: 4.8,
              additionalContext: '19 of 31 returns were on Men’s Formal Shirts citing sizing discrepancy.',
            },
            aiExplanation: 'Return volume is 4.8x higher than usual. Analysis shows 61% of returns are concentrated in a single shirt batch, suggesting possible manufacturing tag mislabeling.',
            suggestedAction: 'Inspect supplier batch #B-881 for shirt collar size misprints.',
            detectedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
          },
          {
            id: 'AN-AUTH-00823',
            type: 'AFTER_HOURS_ACTIVITY',
            title: 'After-Hours System Login & Stock Query at 3:18 AM',
            severity: 'medium',
            status: 'under_review',
            entityType: 'auth_log',
            entityId: 'LOG-00823',
            entityName: 'User: manager_ramesh (IP: 192.168.1.45)',
            riskScore: 62,
            evidence: {
              metricName: 'Timestamp of Activity',
              detectedValue: '03:18:42 AM',
              expectedBaseline: '09:00 AM – 09:30 PM (Showroom Hours)',
              additionalContext: 'Manager credentials used from in-store terminal.',
            },
            aiExplanation: 'A system login occurred at 3:18 AM outside normal operating hours. This is flagged to ensure account credentials were not misused.',
            suggestedAction: 'Confirm with store manager whether an authorized after-hours inventory audit was taking place.',
            detectedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
          },
        ];

        let results = list;
        if (filter?.severity) {
          results = results.filter((a) => a.severity === filter.severity);
        }
        if (filter?.status) {
          results = results.filter((a) => a.status === filter.status);
        }

        return { success: true, data: results };
      },

      getAnomalyDetails: async (anomalyId: string) => {
        const res = await (mockApi.ai as any).getAnomalies();
        const found = res.data?.find((a: any) => a.id === anomalyId);
        return { success: true, data: found || res.data?.[0] };
      },

      reviewAnomaly: async (request: any) => {
        return {
          success: true,
          anomaly: {
            id: request?.anomalyId,
            status: request?.action === 'resolve' ? 'resolved' : request?.action === 'dismiss' ? 'dismissed' : 'under_review',
            reviewedBy: request?.reviewerName || 'Store Manager',
            reviewedAt: new Date().toISOString(),
            reviewNotes: request?.notes || 'Reviewed and documented.',
          },
        };
      },

      getRiskSummary: async () => {
        const res = await (mockApi.ai as any).getAnomalies();
        const list = res.data || [];
        return {
          success: true,
          data: {
            overallRiskScore: 38,
            riskLabel: '🟡 Moderate Risk — 2 Critical Items Pending Review',
            criticalCount: list.filter((a: any) => a.severity === 'critical' && a.status !== 'resolved').length,
            highCount: list.filter((a: any) => a.severity === 'high' && a.status !== 'resolved').length,
            mediumCount: list.filter((a: any) => a.severity === 'medium' && a.status !== 'resolved').length,
            lowCount: list.filter((a: any) => a.severity === 'low' && a.status !== 'resolved').length,
            openCount: list.filter((a: any) => a.status === 'open').length,
            resolvedCount: list.filter((a: any) => a.status === 'resolved').length,
            recentAnomalies: list,
            generatedAt: new Date().toISOString(),
          },
        };
      },

      getSmartReport: async (period: string) => {
        const isMonthly = period === 'monthly';
        const isWeekly = period === 'weekly';

        const totalRev = isMonthly ? 2480000 : isWeekly ? 582400 : 84250;
        const prevRev = isMonthly ? 2171600 : isWeekly ? 522800 : 75220;
        const pctChange = isMonthly ? 14.2 : isWeekly ? 11.4 : 12.0;
        const txCount = isMonthly ? 3842 : isWeekly ? 890 : 126;
        const aov = isMonthly ? 645 : isWeekly ? 654 : 669;

        const periodLabel = isMonthly
          ? 'Monthly Management Report — August 2026'
          : isWeekly
          ? 'Weekly Business Report — Aug 17 to Aug 23, 2026'
          : 'Daily Business Summary — August 25, 2026';

        const executiveSummary = isMonthly
          ? 'Monthly showroom performance reached ₹24,80,000 (+14.2% growth) with 3,842 transactions and an Average Order Value of ₹645. Kanchipuram Silks & Sarees was the highest earning category (42% share), whereas Accessories exhibited slower movement (5% share). Working capital of ₹64,800 is currently tied up in 4 dead stock variants. Five operational anomalies require administrative review. Overall business health remains strongly positive with expanding customer retention.'
          : isWeekly
          ? 'Weekly sales performance achieved ₹5,82,400 (+11.4% vs previous week) across 890 transactions. Returning customers generated 71.5% of total revenue, reflecting high loyalty retention. Demand for bridal and festive sarees continues to surge (+15% projected 30d run-rate). Key managerial action items include replenishing 8 depleting SKUs and reviewing open risk alerts.'
          : 'Showroom operations completed today with gross sales of ₹84,250 across 126 transactions (AOV: ₹669). Kanchipuram Silks & Sarees led revenue contribution (42%), while 8 product variants require replenishment attention before upcoming weekend footfall. 2 operational anomaly flags remain open for manager sign-off.';

        return {
          success: true,
          data: {
            id: `REP-${period.toUpperCase()}-20260825`,
            period,
            periodLabel,
            startDate: isMonthly ? '2026-08-01' : isWeekly ? '2026-08-17' : '2026-08-25',
            endDate: isMonthly ? '2026-08-31' : isWeekly ? '2026-08-23' : '2026-08-25',
            executiveSummary,
            overallHealthBadge: 'STRONG_GROWTH',
            overallHealthLabel: '🚀 Strong Growth & Healthy Operations',
            sales: {
              totalRevenue: totalRev,
              revenueComparison: { current: totalRev, previous: prevRev, percentageChange: pctChange, trend: 'up' },
              transactionCount: txCount,
              transactionsComparison: { current: txCount, previous: Math.round(txCount * 0.9), percentageChange: 9.6, trend: 'up' },
              unitsSold: Math.round(txCount * 1.8),
              averageOrderValue: aov,
              aovComparison: { current: aov, previous: Math.round(aov * 0.96), percentageChange: 4.1, trend: 'up' },
              totalDiscountAmount: Math.round(totalRev * 0.08),
              discountRatePercent: 8.0,
              totalReturnAmount: Math.round(totalRev * 0.02),
              returnRatePercent: 2.0,
            },
            topProducts: [
              { variantId: 1, productName: 'Bridal Kanchipuram Pure Silk Saree', sku: 'SAR-KAN-001-RED-FS', categoryName: 'Sarees', unitsSold: isMonthly ? 342 : 42, revenue: isMonthly ? 6497658 : 797958, trend: 'up' },
              { variantId: 2, productName: 'Soft Handloom Cotton Saree', sku: 'SAR-COT-002-BLU-FS', categoryName: 'Sarees', unitsSold: isMonthly ? 298 : 68, revenue: isMonthly ? 744702 : 169932, trend: 'up' },
              { variantId: 3, productName: 'Premium Egyptian Giza Cotton Shirt', sku: 'MSH-EGY-002-WHT-40', categoryName: 'Men’s Wear', unitsSold: isMonthly ? 182 : 35, revenue: isMonthly ? 454818 : 87465, trend: 'stable' },
            ],
            slowProducts: [
              { variantId: 4, productName: 'Traditional Raw Silk Men’s Kurta', sku: 'MKU-RAW-004-GLD-L', categoryName: 'Men’s Wear', unitsSold: 1, revenue: 3299, trend: 'down' },
            ],
            categories: [
              { categoryId: 1, categoryName: 'Kanchipuram Silks & Sarees', revenue: Math.round(totalRev * 0.42), revenueSharePercent: 42.0, trend: 'up' },
              { categoryId: 2, categoryName: 'Men’s Wear & Shirts', revenue: Math.round(totalRev * 0.28), revenueSharePercent: 28.0, trend: 'stable' },
              { categoryId: 3, categoryName: 'Dress Materials & Blouses', revenue: Math.round(totalRev * 0.16), revenueSharePercent: 16.0, trend: 'up' },
              { categoryId: 4, categoryName: 'Traditional Dhotis & Kurtas', revenue: Math.round(totalRev * 0.09), revenueSharePercent: 9.0, trend: 'stable' },
              { categoryId: 5, categoryName: 'Accessories & Shapewear', revenue: Math.round(totalRev * 0.05), revenueSharePercent: 5.0, trend: 'down' },
            ],
            customers: {
              newCustomersCount: Math.round(txCount * 0.38),
              returningCustomersCount: Math.round(txCount * 0.62),
              repeatPurchaseRatePercent: 62.0,
              returningRevenueSharePercent: 71.5,
              averageBuyingIntervalDays: 42,
            },
            inventory: {
              criticalReorderCount: 8,
              monitorBufferCount: 12,
              healthyStockCount: 141,
              deadStockCount: 4,
              capitalTiedInDeadStock: 64800,
              totalStockValuation: 1845000,
            },
            forecast: [
              { categoryName: 'Sarees & Silk Collections', expected30DayDemandUnits: 380, growthPercentage: 15.0, confidence: 'HIGH' },
              { categoryName: 'Men’s Formal & Casual Wear', expected30DayDemandUnits: 210, growthPercentage: 4.5, confidence: 'HIGH' },
              { categoryName: 'Dress Materials & Fabrics', expected30DayDemandUnits: 145, growthPercentage: 8.0, confidence: 'MEDIUM' },
              { categoryName: 'Accessories & Tailoring', expected30DayDemandUnits: 90, growthPercentage: -2.5, confidence: 'MEDIUM' },
            ],
            risk: {
              overallRiskScore: 38,
              criticalAnomalies: 1,
              highAnomalies: 2,
              mediumAnomalies: 1,
              unresolvedCount: 2,
              primaryRiskFactor: 'Large manual stock adjustments & unusual manual discounts',
            },
            actionItems: [
              {
                id: 'ACT-01',
                priority: 'HIGH',
                title: 'Restock 8 Depleting SKUs Approaching Stockout',
                description: 'Bridal Silk Sarees and other top-sellers have supply buffers below supplier lead time (4 days remaining).',
                department: 'Inventory',
                suggestedAction: 'Review AI Suggested Reorders and create draft POs in Inventory Intelligence tab.',
              },
              {
                id: 'ACT-02',
                priority: 'HIGH',
                title: 'Audit & Sign-off on 2 Open Risk Anomalies',
                description: 'Unusual 42% manual discount on Silk Saree and large stock adjustment write-offs require formal manager sign-off.',
                department: 'Risk / Audit',
                suggestedAction: 'Open Anomaly Details Modal on Executive Dashboard and document approval rationale.',
              },
              {
                id: 'ACT-03',
                priority: 'MEDIUM',
                title: 'Liquidate ₹64,800 Dead Stock Capital',
                description: 'Traditional Raw Silk Kurtas and slow-moving fabrics have had no sales in 60 days.',
                department: 'Marketing',
                suggestedAction: 'Launch festive bundle promotions (e.g. Kurta + Silk Dhoti combo gift).',
              },
              {
                id: 'ACT-04',
                priority: 'LOW',
                title: 'Capitalize on 30-Day Bridal Silk Demand Surge (+15%)',
                description: 'AI Forecasting indicates strong upcoming wedding season demand for Kanchipuram Silk Sarees.',
                department: 'Sales',
                suggestedAction: 'Verify supplier pre-orders and prime front-of-store mannequin displays.',
              },
            ],
            generatedAt: new Date().toISOString(),
            generatedBy: 'Texora AI Management Engine',
          },
        };
      },

      getReportHistory: async () => {
        return {
          success: true,
          data: [
            { id: 'rep-m-aug-2026', period: 'monthly', label: 'Monthly Management Report — August 2026', date: '2026-08-25', revenue: 2480000 },
            { id: 'rep-w-aug-w3', period: 'weekly', label: 'Weekly Business Report — Aug 17 to Aug 23, 2026', date: '2026-08-23', revenue: 582400 },
            { id: 'rep-d-aug-25', period: 'daily', label: 'Daily Business Summary — Aug 25, 2026', date: '2026-08-25', revenue: 84250 },
            { id: 'rep-d-aug-24', period: 'daily', label: 'Daily Business Summary — Aug 24, 2026', date: '2026-08-24', revenue: 91400 },
          ],
        };
      },

      biQuery: async (request: any, userContext?: any) => {
        const rawQuery = (request?.message || '').trim();
        const q = rawQuery.toLowerCase();
        const conversationId = request?.conversationId || 'conv_general_today';
        const rawUser = localStorage.getItem('texora_current_user');
        let user = userContext;
        if (!user && rawUser) {
          try { user = JSON.parse(rawUser); } catch {}
        }
        const role = (user?.roleName || user?.role || 'Cashier').toLowerCase();
        const isManagerOrAdmin = role === 'admin' || role === 'owner' || role === 'super_admin' || role === 'manager';
        const now = new Date().toISOString();

        // 1. TAMIL & BILINGUAL DETECTIONS
        const isTamil = /[\u0B80-\u0BFF]/.test(rawQuery) || q.includes('innaiku') || q.includes('sales eppadi');

        // 2. CASHIER PERSONAL REGISTER
        if (
          q.includes('my register') ||
          q.includes('my shift') ||
          q.includes('my sales') ||
          q.includes('my counter') ||
          q.includes('my drawer') ||
          q.includes('my bills')
        ) {
          const msg = {
            id: `msg_a_${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `### 💳 Your Cashier Shift Summary — Tuesday, Aug 25\n\n` +
              `• **Personal Terminal Sales:** **₹18,450**\n` +
              `• **Invoices Billed:** **24 transactions**\n` +
              `• **Average Bill Value:** **₹768**\n` +
              `• **Discounts Applied:** **₹850**\n\n` +
              `*Your register drawer is balanced and ready for shift handover.*`,
            actions: [
              { label: 'Go to POS Billing', route: '/billing', variant: 'primary' },
              { label: 'View Sales History', route: '/sales', variant: 'secondary' },
            ],
            suggestedFollowUps: [
              'What accessories pair with Bridal Silk Saree?',
              'Which products are low in stock?',
              'How many staff are on duty?',
            ],
            source: 'POS Terminal Register Ledger',
            sourcesUsed: ['Cashier Terminal Sales', 'Completed Invoices'],
            timestamp: now,
            confidence: 1.0,
          };
          return { conversationId, message: msg };
        }

        // 3. RBAC RESTRICTION CHECK
        if (
          !isManagerOrAdmin &&
          (q.includes('profit') ||
            q.includes('margin') ||
            q.includes('financial') ||
            q.includes('p&l') ||
            q.includes('salary') ||
            q.includes('store sales') ||
            q.includes('total revenue') ||
            q.includes('executive summary') ||
            q.includes('smart report'))
        ) {
          const msg = {
            id: `msg_a_${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `🔒 **Access Restricted by Security Policy**\n\n` +
              `Viewing storewide financial revenue, profit margins, staff payroll, and executive management reports requires **Store Manager** or **Admin** privileges.\n\n` +
              `As a team member, you can query:\n` +
              `• *"Show my register sales today"*\n` +
              `• *"Check stock for Bridal Silk Saree"*\n` +
              `• *"What products are low in stock?"*\n` +
              `• *"What accessories go with this saree?"*`,
            requiresPermission: 'sales.view',
            suggestedFollowUps: [
              'Show my register sales today',
              'Which products are low in stock?',
              'What accessories pair with Bridal Silk Saree?',
            ],
            source: 'Texora RBAC Security Engine',
            sourcesUsed: ['Role-Based Access Control Rules'],
            timestamp: now,
            confidence: 1.0,
          };
          return { conversationId, message: msg };
        }

        // 4. FAST MOVING WITH < 10 DAYS STOCK
        if (
          (q.includes('fast') && q.includes('stock')) ||
          (q.includes('less than 10') || q.includes('< 10') || q.includes('10 days')) ||
          (q.includes('run out') || q.includes('depleting soon'))
        ) {
          const msg = {
            id: `msg_a_${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `🚨 **Fast-Moving Products with < 10 Days of Stock Remaining**\n\n` +
              `The AI evaluated daily sales velocity against current shelf balances. **2 high-velocity products** are depleting faster than supplier lead time:`,
            table: {
              title: 'Critical Stockout Risk (Supply < 10 Days)',
              columns: [
                { key: 'rank', label: '#' },
                { key: 'productName', label: 'Product' },
                { key: 'currentStock', label: 'Current Stock' },
                { key: 'velocity', label: 'Sales Velocity' },
                { key: 'daysOfSupply', label: 'Days Remaining' },
                { key: 'leadTime', label: 'Supplier Lead Time' },
              ],
              rows: [
                { rank: 1, productName: 'Bridal Kanchipuram Pure Silk Saree', currentStock: '18 units', velocity: '4.4/day', daysOfSupply: '4 days remaining', leadTime: '7d lead time' },
                { rank: 2, productName: 'Soft Handloom Cotton Saree', currentStock: '14 units', velocity: '2.2/day', daysOfSupply: '6 days remaining', leadTime: '4d lead time' },
              ],
            },
            actions: [
              { label: 'Open Inventory Intelligence', route: '/inventory', variant: 'primary' },
              { label: 'Create Supplier Purchase Order', route: '/purchases', variant: 'secondary' },
            ],
            suggestedFollowUps: [
              'What are the suggested reorder quantities?',
              'What will demand be in the next 30 days?',
              'Show sales trend for last 7 days',
            ],
            source: 'Inventory Velocity & ROP Engine',
            sourcesUsed: ['Sales Velocity 30-Day Run Rate', 'Warehouse Stock Matrix', 'Supplier Lead Time Master'],
            timestamp: now,
            confidence: 0.98,
          };
          return { conversationId, message: msg };
        }

        // 5. 7-DAY SALES TREND & CHART
        if (
          q.includes('trend') ||
          q.includes('chart') ||
          q.includes('graph') ||
          q.includes('last 7 days') ||
          q.includes('7 days sales') ||
          q.includes('weekly curve')
        ) {
          const msg = {
            id: `msg_a_${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `📈 **7-Day Sales Trend & Revenue Trajectory**\n\n` +
              `• **Total Past 7 Days Revenue:** **₹3,85,400** (+14% growth)\n` +
              `• **Peak Sales Day:** **Saturday (₹81,000)** driven by festive bridal saree walk-ins\n` +
              `• **Weekend Concentration:** **46.5% of total volume** occurred on Saturday & Sunday`,
            chart: {
              type: 'area',
              title: 'Daily Revenue (Last 7 Days)',
              data: [
                { label: 'Mon', value: 42000 },
                { label: 'Tue', value: 45000 },
                { label: 'Wed', value: 41000 },
                { label: 'Thu', value: 53000 },
                { label: 'Fri', value: 58000 },
                { label: 'Sat', value: 81000 },
                { label: 'Sun', value: 76000 },
              ],
              xAxisKey: 'label',
              dataKey: 'value',
              unitPrefix: '₹',
            },
            actions: [
              { label: 'View Full Sales History', route: '/sales', variant: 'primary' },
              { label: 'View Smart Reports', route: '/reports', variant: 'secondary' },
            ],
            suggestedFollowUps: [
              'Which category generated the most revenue?',
              'Which products sold the most this month?',
              'What is the 30-day demand forecast?',
            ],
            source: 'Sales Analytics Engine',
            sourcesUsed: ['Completed POS Invoices', '7-Day Revenue Aggregate'],
            timestamp: now,
            confidence: 1.0,
          };
          return { conversationId, message: msg };
        }

        // 6. ROOT CAUSE WHY
        if (
          q.includes('why') &&
          (q.includes('decrease') || q.includes('drop') || q.includes('fall') || q.includes('down') || q.includes('decline') || q.includes('low'))
        ) {
          const msg = {
            id: `msg_a_${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `🔍 **Root-Cause Sales Performance Diagnostic**\n\n` +
              `The AI analyzed sales invoices, stockout events, and return records to identify primary contributors to recent volume shifts:\n\n` +
              `1. **Stockouts on High-Demand Fast Movers (Primary Factor):**\n` +
              `   • *Bridal Kanchipuram Silk Sarees* experienced 2 days with shelf stock $< 5$ units during peak weekend hours, leading to estimated uncaptured walk-in sales.\n\n` +
              `2. **Sizing Return Spike in Men’s Formal Shirts:**\n` +
              `   • *Giza Cotton Shirts* recorded an 11.7% return/exchange rate due to collar and sleeve length fit variances.\n\n` +
              `3. **Weekday Morning Footfall Dip:**\n` +
              `   • Tuesday and Wednesday morning traffic (10 AM – 2 PM) was 18% lower than regional seasonal averages.\n\n` +
              `💡 **Recommended Remediation:** Restock critical saree buffers before Friday and cross-train floor associates on precise shirt fit consultation.`,
            actions: [
              { label: 'Review Inventory Buffers', route: '/inventory', variant: 'primary' },
              { label: 'Inspect Return Logs', route: '/returns', variant: 'secondary' },
            ],
            suggestedFollowUps: [
              'Which fast-moving products have less than 10 days of stock?',
              'What is our return rate across categories?',
              'What will sell well next month?',
            ],
            source: 'Multi-Domain Diagnostic Engine',
            sourcesUsed: ['Sales Ledger', 'Stockout Timeline', 'Product Return Logs', 'Footfall Hourly Heatmap'],
            timestamp: now,
            confidence: 0.94,
          };
          return { conversationId, message: msg };
        }

        // 7. TAMIL QUERY
        if (isTamil) {
          const msg = {
            id: `msg_a_${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `### 📊 இன்றைய வியாபார நிலவரம் (Today's Sales Status)\n\n` +
              `• **மொத்த விற்பனை (Total Revenue):** **₹84,250**\n` +
              `• **பில் எண்ணிக்கை (Transactions):** **126 பில்கள்**\n` +
              `• **சராசரி பில் மதிப்பு (Average Ticket):** **₹669**\n` +
              `• **அதிகம் விற்பனையான பிரிவு (Top Category):** **காஞ்சிபுரம் பட்டு சேலைகள் (Kanchipuram Silks)**\n\n` +
              `💡 **AI தகவல்:** நேற்றைய விற்பனையை விட இன்று விற்பனை **12% அதிகமாக** உள்ளது. திருமண பட்டுப் புடவைகள் பிரிவில் அதிக வரவு காணப்படுகிறது.`,
            actions: [
              { label: 'விற்பனை விவரம் பார்க்க (Sales)', route: '/sales', variant: 'primary' },
              { label: 'இருப்பு விவரம் (Inventory)', route: '/inventory', variant: 'secondary' },
            ],
            suggestedFollowUps: [
              'எந்த சேலை அதிகம் விக்குது?',
              'stock குறைவா இருக்கிற பொருட்கள் எவை?',
              'அடுத்த 30 நாள் விற்பனை கணிப்பு என்ன?',
            ],
            source: 'Texora Tamil Retail NLP Engine',
            sourcesUsed: ['Sales Database', 'Inventory Status'],
            timestamp: now,
            confidence: 1.0,
          };
          return { conversationId, message: msg };
        }

        // 8. 30-DAY DEMAND FORECAST
        if (
          q.includes('forecast') ||
          q.includes('next month') ||
          q.includes('30 days') ||
          q.includes('predict') ||
          q.includes('upcoming season') ||
          q.includes('festival')
        ) {
          const msg = {
            id: `msg_a_${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `🔮 **AI 30-Day Category Demand Projections & Festive Outlook**\n\n` +
              `Based on historical seasonal trends, regional festival calendars, and current 30-day velocity, demand projections are:`,
            table: {
              title: '30-Day Forward Demand Projection',
              columns: [
                { key: 'category', label: 'Category' },
                { key: 'projected', label: 'Expected Units' },
                { key: 'growth', label: 'Growth %' },
                { key: 'confidence', label: 'Confidence' },
              ],
              rows: [
                { category: 'Kanchipuram Silk Sarees', projected: '380 units', growth: '+15.0%', confidence: 'HIGH' },
                { category: 'Men’s Wear & Formal Shirts', projected: '210 units', growth: '+4.5%', confidence: 'HIGH' },
                { category: 'Dress Materials & Blouse Pieces', projected: '145 units', growth: '+8.0%', confidence: 'MEDIUM' },
                { category: 'Traditional Dhotis & Kurtas', projected: '110 units', growth: '+2.0%', confidence: 'MEDIUM' },
                { category: 'Accessories & Shapewear', projected: '90 units', growth: '-2.5%', confidence: 'MEDIUM' },
              ],
            },
            actions: [
              { label: 'View Demand Forecasts', route: '/inventory', variant: 'primary' },
              { label: 'Open Smart Reports', route: '/reports', variant: 'secondary' },
            ],
            suggestedFollowUps: [
              'Which fast-moving products have less than 10 days of stock?',
              'What are the top-selling products this month?',
              'What is the dead stock capital tied up?',
            ],
            source: 'Demand Forecasting Engine',
            sourcesUsed: ['Holt-Winters Seasonal Run Rate', 'Festival Calendar Multipliers'],
            timestamp: now,
            confidence: 0.95,
          };
          return { conversationId, message: msg };
        }

        // 9. TOP PRODUCTS
        if (
          q.includes('top selling') ||
          q.includes('top product') ||
          q.includes('best seller') ||
          q.includes('sold the most')
        ) {
          const isLastMonth = q.includes('last month');
          const periodLabel = isLastMonth ? 'Last Month' : 'This Month';
          const msg = {
            id: `msg_a_${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `🏆 **Top-Selling Garments & Velocity Ranking (${periodLabel})**\n\n` +
              `Silk Sarees and Handloom Cotton Sarees dominate the store's revenue contribution. Here is the ranked performance:`,
            table: {
              title: `Product Sales Leaderboard (${periodLabel})`,
              columns: [
                { key: 'rank', label: '#' },
                { key: 'name', label: 'Garment Description' },
                { key: 'units', label: 'Units Sold' },
                { key: 'revenue', label: 'Revenue (₹)' },
                { key: 'trend', label: 'Trend vs Prior' },
              ],
              rows: [
                { rank: 1, name: 'Bridal Kanchipuram Pure Silk Saree', units: isLastMonth ? 312 : 342, revenue: isLastMonth ? '₹59,27,688' : '₹64,97,658', trend: '↑ +9.6%' },
                { rank: 2, name: 'Soft Handloom Cotton Saree', units: isLastMonth ? 270 : 298, revenue: isLastMonth ? '₹6,74,730' : '₹7,44,702', trend: '↑ +10.3%' },
                { rank: 3, name: 'Premium Egyptian Giza Cotton Shirt', units: isLastMonth ? 195 : 182, revenue: isLastMonth ? '₹4,87,305' : '₹4,54,818', trend: '↓ -6.6%' },
                { rank: 4, name: 'Pure Linen Formal Trouser', units: isLastMonth ? 138 : 156, revenue: isLastMonth ? '₹3,17,262' : '₹3,58,644', trend: '↑ +13.0%' },
                { rank: 5, name: 'Traditional Raw Silk Men’s Kurta', units: isLastMonth ? 4 : 1, revenue: isLastMonth ? '₹13,196' : '₹3,299', trend: '↓ -75.0%' },
              ],
            },
            actions: [
              { label: 'View Products Catalog', route: '/products', variant: 'primary' },
              { label: 'View Inventory Health', route: '/inventory', variant: 'secondary' },
            ],
            suggestedFollowUps: isLastMonth
              ? ['Which fast-moving products have less than 10 days of stock?', 'What is our top category this month?']
              : ['What about last month?', 'Which of those need restocking now?', 'Show 7-day sales trend'],
            source: 'Sales Item Velocity Database',
            sourcesUsed: ['Completed Invoices Ledger', 'Product Variant Velocity Table'],
            timestamp: now,
            confidence: 1.0,
          };
          return { conversationId, message: msg };
        }

        // 10. DEFAULT SUMMARY
        const msg = {
          id: `msg_a_${Date.now()}`,
          conversationId,
          role: 'assistant',
          content: `📊 **Store Business Overview — Today**\n\n` +
            `• **Gross Sales Today:** **₹84,250** (+12% vs yesterday)\n` +
            `• **Transactions Completed:** **126 invoices** (AOV: ₹669)\n` +
            `• **Top Category:** **Kanchipuram Silks & Sarees**\n\n` +
            `Ask me for specific deep-dives like *"Which fast-moving products have less than 10 days of stock?"*, *"Show 7-day sales trend"*, or *"Why did sales decrease last week?"*.`,
          actions: [
            { label: 'Open POS Billing', route: '/billing', variant: 'primary' },
            { label: 'View Full Dashboard', route: '/dashboard', variant: 'secondary' },
          ],
          suggestedFollowUps: [
            'Which fast-moving products have less than 10 days of stock?',
            'Show sales trend for last 7 days',
            'Compare this month with last month',
            'Is there anything unusual today?',
          ],
          source: 'Texora Business Intelligence Layer',
          sourcesUsed: ['Sales Database', 'Inventory Engine', 'Forecasting Matrix'],
          timestamp: now,
          confidence: 1.0,
        };
        return { conversationId, message: msg };
      },

      getBiConversations: async () => {
        return {
          success: true,
          data: [
            {
              id: 'conv_general_today',
              title: 'Executive Store Intelligence',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastMessageSnippet: 'How can I assist your showroom management today?',
              messageCount: 1,
            },
          ],
        };
      },

      getBiConversationMessages: async (conversationId: string) => {
        const welcome = {
          id: 'msg_welcome',
          conversationId: conversationId || 'conv_general_today',
          role: 'assistant',
          content: `👋 **வணக்கம்! Welcome to ரத்னா விலாஸ் Business AI!**\n\nநான் உங்கள் ஸ்டோர் அசிஸ்டன்ட். விற்பனை நிலவரம் (**Sales performance**), குறைந்த இருப்பு (**Inventory restocking**), தேவை முன்னறிவிப்பு (**Demand forecasts**), அல்லது இடர் எச்சரிக்கைகள் (**Operational risk alerts**) பற்றி என்னிடம் தமிழில் அல்லது ஆங்கிலத்தில் கேட்கலாம்.\n\nTry asking:\n• *"How are sales today compared to yesterday?"*\n• *"Which fast-moving products have less than 10 days of stock?"*\n• *"Show sales trend for the last 7 days"*\n• *"இன்னைக்கு sales எப்படி இருக்கு?"*`,
          timestamp: new Date().toISOString(),
          suggestedFollowUps: [
            'How much did we sell today?',
            'Which products need restocking?',
            'Show 7-day sales trend',
            'Is there anything unusual today?',
          ],
        };
        return { success: true, data: [welcome] };
      },

      clearBiConversation: async () => {
        return { success: true };
      },

      getDashboardConfig: async (userContext?: any) => {
        const rawUser = localStorage.getItem('texora_current_user');
        let user = userContext;
        if (!user && rawUser) {
          try { user = JSON.parse(rawUser); } catch {}
        }
        const role = (user?.roleName || user?.role || 'Cashier').toLowerCase().trim();
        const isOwnerOrAdmin = role === 'owner' || role === 'admin' || role === 'super_admin';
        const isManager = role === 'manager';
        const isSupervisor = role === 'supervisor';
        const isCashier = role === 'cashier';

        const canViewFinancials = isOwnerOrAdmin || isManager;
        const canViewAnomalies = isOwnerOrAdmin || isManager;
        const canViewRiskMonitor = isOwnerOrAdmin || isManager;
        const canViewForecast = isOwnerOrAdmin || isManager;
        const canViewReorders = isOwnerOrAdmin || isManager || isSupervisor;
        const canViewSmartReports = isOwnerOrAdmin || isManager;
        const canViewSalesInsights = isOwnerOrAdmin || isManager || isSupervisor;
        const canUseCrossSell = isOwnerOrAdmin || isManager || isSupervisor || isCashier;
        const canUseChat = true;

        const widgets: string[] = [];
        const kpiCards: string[] = [];

        if (canViewFinancials) {
          kpiCards.push(
            'kpi_today_sales',
            'kpi_net_revenue',
            'kpi_gross_profit',
            'kpi_operating_expenses',
            'kpi_inventory_value',
            'kpi_total_products',
            'kpi_active_customers',
            'kpi_active_suppliers'
          );
        } else if (isSupervisor) {
          kpiCards.push(
            'kpi_today_sales',
            'kpi_inventory_units',
            'kpi_total_products',
            'kpi_low_stock_count'
          );
        } else if (isCashier) {
          kpiCards.push(
            'kpi_cashier_shift_sales',
            'kpi_cashier_bills_count',
            'kpi_cashier_avg_ticket',
            'kpi_cashier_shift_discounts'
          );
        } else {
          kpiCards.push(
            'kpi_assigned_tasks',
            'kpi_shift_hours',
            'kpi_store_inventory_status'
          );
        }

        if (canViewSmartReports) widgets.push('widget_ai_daily_summary');
        if (canViewSalesInsights) widgets.push('widget_ai_sales_insights');
        if (canViewRiskMonitor && canViewAnomalies) widgets.push('widget_ai_risk_monitor');
        if (canViewForecast) widgets.push('widget_ai_forecast');
        if (canViewReorders) widgets.push('widget_ai_reorders');
        if (canUseCrossSell && isCashier) widgets.push('widget_ai_pos_cross_sell');
        widgets.push('panel_sales_trend_chart', 'panel_low_stock_alerts');

        return {
          success: true,
          data: {
            role,
            isExecutive: isOwnerOrAdmin || isManager,
            canViewFinancials,
            canViewAnomalies,
            canViewRiskMonitor,
            canViewForecast,
            canViewReorders,
            canViewSmartReports,
            canViewSalesInsights,
            canUseCrossSell,
            canUseChat,
            widgets,
            kpiCards,
          },
        };
      },
    },
  };

  // Helper for mock staff profiles
  function getMockStaffProfile(user: any) {
    const username = (user?.username || 'admin').toLowerCase();
    const custom = loadStorage<any>('texora_profile_custom', {});
    const baseMap: Record<string, any> = {
      admin: {
        id: 1,
        staff_code: 'ADM-0001',
        first_name: 'Store',
        last_name: 'Administrator',
        email: 'admin@texora.shop',
        phone: '+91 98765 00001',
        department_name: 'Store Management',
        designation_name: 'Store Administrator & Owner',
        work_location: 'Main Textile Store',
        joining_date: '2025-01-01',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        address_line_1: '123 Bazaar Main St',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641001',
        manager_name: 'Executive Board',
      },
      manager: {
        id: 2,
        staff_code: 'STF-0001',
        first_name: 'Rajesh',
        last_name: 'Kumar',
        email: 'rajesh.manager@texora.shop',
        phone: '+91 98765 11001',
        department_name: 'Store Management',
        designation_name: 'Store Manager',
        work_location: 'Main Textile Store',
        joining_date: '2025-06-01',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        address_line_1: '45 Raja Street',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641002',
        manager_name: 'Store Administrator',
      },
      'priya.sales': {
        id: 3,
        staff_code: 'STF-0003',
        first_name: 'Priya',
        last_name: 'Sharma',
        email: 'priya.sales@texora.shop',
        phone: '+91 98765 33003',
        department_name: 'Storefront Sales',
        designation_name: 'Sales Executive',
        work_location: 'Main Textile Store',
        joining_date: '2026-01-10',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        address_line_1: '78 Gandhi Road',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641001',
        manager_name: 'Rajesh Kumar (Manager)',
      },
      'arun.cashier': {
        id: 4,
        staff_code: 'STF-0002',
        first_name: 'Arun',
        last_name: 'Kumar',
        email: 'arun.cashier@texora.shop',
        phone: '+91 98765 22002',
        department_name: 'Accounts & Billing',
        designation_name: 'Head Cashier',
        work_location: 'Main Textile Store',
        joining_date: '2026-01-05',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        address_line_1: '12 Temple View Apt',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641004',
        manager_name: 'Rajesh Kumar (Manager)',
      },
      'karthik.inventory': {
        id: 5,
        staff_code: 'STF-0004',
        first_name: 'Karthik',
        last_name: 'Raja',
        email: 'karthik.stock@texora.shop',
        phone: '+91 98765 44004',
        department_name: 'Inventory & Stock',
        designation_name: 'Stock Specialist',
        work_location: 'Warehouse Hub',
        joining_date: '2026-02-01',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        address_line_1: '56 Mill Road',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641006',
        manager_name: 'Rajesh Kumar (Manager)',
      },
      'anitha.hr': {
        id: 6,
        staff_code: 'STF-0005',
        first_name: 'Anitha',
        last_name: 'Ramesh',
        email: 'anitha.hr@texora.shop',
        phone: '+91 98765 55005',
        department_name: 'HR & Administration',
        designation_name: 'HR Specialist',
        work_location: 'Main Textile Store',
        joining_date: '2026-01-01',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        address_line_1: '89 Cross Cut Road',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641012',
        manager_name: 'Store Administrator',
      },
    };

    const base = baseMap[username] || {
      id: user?.userId || 99,
      staff_code: `STF-${String(user?.userId || 99).padStart(4, '0')}`,
      first_name: user?.displayName?.split(' ')[0] || user?.username || 'Staff',
      last_name: user?.displayName?.split(' ').slice(1).join(' ') || '',
      email: `${user?.username || 'staff'}@texora.shop`,
      phone: '+91 98765 00000',
      department_name: 'Store Operations',
      designation_name: user?.roleName || 'Store Staff',
      work_location: 'Main Textile Store',
      joining_date: '2026-01-01',
      employment_type: 'FULL_TIME',
      status: 'ACTIVE',
      address_line_1: '123 Bazaar Main St',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001',
      manager_name: 'Rajesh Kumar (Manager)',
    };

    return { ...base, ...custom };
  }

  // Attach mock to window
  (window as any).api = mockApi;
  console.log('⚡ [BrowserMockApi] Texora Demo Mock Services initialized on window.api with rich textile catalog & POS billing.');
}
