import { getDatabase } from '../../../database';

export interface CoOccurrenceCandidate {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  sellingPrice: number;
  currentStock: number;
  coOccurrenceCount: number;
  triggerProductId: number;
  triggerProductName: string;
  confidenceScore: number;
}

export class CoOccurrenceEngine {
  /**
   * Finds products frequently bought in the same transaction as the given cart variant IDs
   */
  public static findFrequentlyBoughtTogether(cartVariantIds: number[], limit = 4): CoOccurrenceCandidate[] {
    if (!cartVariantIds || cartVariantIds.length === 0) return [];

    const db = getDatabase();
    const placeholders = cartVariantIds.map(() => '?').join(',');

    const query = `
      SELECT 
        target_pv.id as target_variant_id,
        target_p.id as target_product_id,
        target_p.name as target_product_name,
        target_pv.sku as target_sku,
        c.name as target_category_name,
        target_pv.selling_price,
        target_pv.current_stock,
        source_p.id as source_product_id,
        source_p.name as source_product_name,
        COUNT(DISTINCT s.id) as co_occurrence_count
      FROM sale_items source_si
      JOIN sales s ON s.id = source_si.sale_id
      JOIN product_variants source_pv ON source_pv.id = source_si.product_variant_id
      JOIN products source_p ON source_p.id = source_pv.product_id

      -- Find other items in the same sale
      JOIN sale_items target_si ON target_si.sale_id = s.id AND target_si.product_variant_id != source_si.product_variant_id
      JOIN product_variants target_pv ON target_pv.id = target_si.product_variant_id
      JOIN products target_p ON target_p.id = target_pv.product_id
      LEFT JOIN categories c ON c.id = target_p.category_id

      WHERE source_si.product_variant_id IN (${placeholders})
        AND target_pv.id NOT IN (${placeholders})
        AND target_pv.current_stock > 0
        AND target_pv.is_active = 1
        AND s.status = 'COMPLETED'
      GROUP BY target_pv.id
      ORDER BY co_occurrence_count DESC, target_pv.current_stock DESC
      LIMIT ?
    `;

    try {
      const rows = db.prepare(query).all(...cartVariantIds, ...cartVariantIds, limit) as any[];
      return rows.map((r) => ({
        variantId: r.target_variant_id,
        productId: r.target_product_id,
        productName: r.target_product_name,
        sku: r.target_sku,
        categoryName: r.target_category_name || 'General',
        sellingPrice: Number(r.selling_price) || 0,
        currentStock: Number(r.current_stock) || 0,
        coOccurrenceCount: Number(r.co_occurrence_count) || 1,
        triggerProductId: r.source_product_id,
        triggerProductName: r.source_product_name,
        confidenceScore: Math.min(0.95, 0.65 + (Number(r.co_occurrence_count) * 0.05)),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fallback rule-based category associations for textile showrooms
   * (e.g. Sarees -> Blouse / Accessories; Shirts -> Trousers; Kurtas -> Dhotis)
   */
  public static getRuleBasedComplementaryItems(cartVariantIds: number[], limit = 4): CoOccurrenceCandidate[] {
    const db = getDatabase();
    if (!cartVariantIds || cartVariantIds.length === 0) return [];

    const placeholders = cartVariantIds.map(() => '?').join(',');

    // Get categories of cart items
    const cartCategories = db.prepare(`
      SELECT DISTINCT c.id, c.name, p.name as product_name, p.id as product_id
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE pv.id IN (${placeholders})
    `).all(...cartVariantIds) as any[];

    if (cartCategories.length === 0) return [];

    const triggerCategory = cartCategories[0];
    const catName = triggerCategory.name?.toLowerCase() || '';

    let targetSearchCategory = 'Accessories';
    if (catName.includes('saree') || catName.includes('silk')) {
      targetSearchCategory = 'Dress Materials';
    } else if (catName.includes('shirt') || catName.includes('men')) {
      targetSearchCategory = 'Men’s Wear';
    } else if (catName.includes('kurta')) {
      targetSearchCategory = 'Men’s Wear';
    }

    const rows = db.prepare(`
      SELECT 
        pv.id as target_variant_id,
        p.id as target_product_id,
        p.name as target_product_name,
        pv.sku as target_sku,
        c.name as target_category_name,
        pv.selling_price,
        pv.current_stock
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE pv.id NOT IN (${placeholders})
        AND pv.current_stock > 0
        AND pv.is_active = 1
        AND (c.name LIKE ? OR c.name LIKE '%Accessories%')
      ORDER BY pv.current_stock DESC
      LIMIT ?
    `).all(...cartVariantIds, `%${targetSearchCategory}%`, limit) as any[];

    return rows.map((r) => ({
      variantId: r.target_variant_id,
      productId: r.target_product_id,
      productName: r.target_product_name,
      sku: r.target_sku,
      categoryName: r.target_category_name || 'Accessories',
      sellingPrice: Number(r.selling_price) || 0,
      currentStock: Number(r.current_stock) || 0,
      coOccurrenceCount: 1,
      triggerProductId: triggerCategory.product_id,
      triggerProductName: triggerCategory.product_name,
      confidenceScore: 0.75,
    }));
  }
}
