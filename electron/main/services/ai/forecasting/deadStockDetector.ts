import { getDatabase } from '../../../database';
import { DeadStockItem } from './forecastingTypes';

export class DeadStockDetector {
  /**
   * Identifies products with high remaining stock and negligible movement over 60 days
   */
  public static detectDeadStock(variantsList?: any[]): DeadStockItem[] {
    const db = getDatabase();

    const deadItems: DeadStockItem[] = [];

    const queryRows = db.prepare(`
      SELECT 
        pv.id as variant_id,
        pv.product_id,
        p.name as product_name,
        pv.sku,
        c.name as category_name,
        pv.current_stock,
        pv.purchase_price,
        pv.selling_price,
        COALESCE(
          (SELECT SUM(si.quantity) 
           FROM sale_items si 
           JOIN sales s ON s.id = si.sale_id 
           WHERE si.product_variant_id = pv.id 
             AND date(s.sale_date, 'localtime') >= date('now', '-60 days', 'localtime') 
             AND s.status = 'COMPLETED'), 0
        ) as sold_60d,
        COALESCE(
          (SELECT CAST(julianday('now', 'localtime') - julianday(MAX(s.sale_date), 'localtime') AS INTEGER)
           FROM sale_items si 
           JOIN sales s ON s.id = si.sale_id 
           WHERE si.product_variant_id = pv.id AND s.status = 'COMPLETED'), 99
        ) as days_since_last_sale
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE pv.is_active = 1 AND p.is_active = 1 AND pv.current_stock >= 15
      ORDER BY pv.current_stock DESC
    `).all() as any[];

    for (const r of queryRows) {
      const sold60d = Number(r.sold_60d) || 0;
      const daysSince = Number(r.days_since_last_sale) || 99;
      const stock = Number(r.current_stock) || 0;
      const purchasePrice = Number(r.purchase_price) || 0;

      // Condition for Dead Stock: Stock >= 15 AND (Sold in 60d <= 1 OR Days since last sale >= 45)
      if (sold60d <= 1 || daysSince >= 45) {
        const capitalTied = stock * purchasePrice;
        let rec = 'Bundle as promotional gift with fast-moving sarees or offer a seasonal 15-20% discount.';
        if (daysSince >= 60) {
          rec = 'Liquidate through clearance counter to recover tied-up working capital.';
        }

        deadItems.push({
          variantId: r.variant_id,
          productId: r.product_id,
          productName: r.product_name,
          sku: r.sku,
          categoryName: r.category_name || 'General',
          currentStock: stock,
          stockCostValue: capitalTied,
          sellingPrice: Number(r.selling_price) || 0,
          daysSinceLastSale: daysSince,
          unitsSoldIn60Days: sold60d,
          recommendation: rec,
        });
      }
    }

    return deadItems;
  }
}
