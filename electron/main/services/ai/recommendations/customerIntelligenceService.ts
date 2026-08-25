import { getDatabase } from '../../../database';
import {
  CustomerIntelligenceProfile,
  CustomerSegment,
  CategoryAffinityItem,
} from './recommendationTypes';

export class CustomerIntelligenceService {
  /**
   * Generates a rich, privacy-preserved customer intelligence profile
   */
  public static getCustomerProfile(customerId: number): CustomerIntelligenceProfile | null {
    const db = getDatabase();

    const customer = db.prepare(`
      SELECT id, customer_code, name, created_at
      FROM customers
      WHERE id = ?
    `).get(customerId) as any;

    if (!customer) return null;

    // Aggregate completed sales
    const salesSummary = db.prepare(`
      SELECT 
        COUNT(id) as total_visits,
        COALESCE(SUM(total), 0) as total_spent,
        COALESCE(AVG(total), 0) as aov,
        MAX(sale_date) as last_sale_date,
        MIN(sale_date) as first_sale_date
      FROM sales
      WHERE customer_id = ? AND status = 'COMPLETED'
    `).get(customerId) as any;

    const totalVisits = Number(salesSummary?.total_visits) || 0;
    const totalSpent = Math.round(Number(salesSummary?.total_spent) || 0);
    const aov = Math.round(Number(salesSummary?.aov) || 0);

    // Days since last purchase
    let daysSinceLastPurchase = 999;
    if (salesSummary?.last_sale_date) {
      const lastDate = new Date(salesSummary.last_sale_date);
      const now = new Date();
      const diffMs = now.getTime() - lastDate.getTime();
      daysSinceLastPurchase = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Average days between purchases
    let averageDaysBetweenPurchases = 45; // default benchmark
    if (totalVisits >= 2 && salesSummary?.first_sale_date && salesSummary?.last_sale_date) {
      const firstDate = new Date(salesSummary.first_sale_date);
      const lastDate = new Date(salesSummary.last_sale_date);
      const totalSpanDays = Math.max(1, Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
      averageDaysBetweenPurchases = Math.max(7, Math.round(totalSpanDays / (totalVisits - 1)));
    }

    // Category affinity breakdown
    const catRows = db.prepare(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(si.id) as purchase_count,
        COALESCE(SUM(si.total), 0) as total_spent
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN product_variants pv ON pv.id = si.product_variant_id
      JOIN products p ON p.id = pv.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE s.customer_id = ? AND s.status = 'COMPLETED'
      GROUP BY c.id, c.name
      ORDER BY total_spent DESC
    `).all(customerId) as any[];

    const categoryAffinities: CategoryAffinityItem[] = catRows.map((r) => {
      const catSpent = Math.round(Number(r.total_spent) || 0);
      const pct = totalSpent > 0 ? Number(((catSpent / totalSpent) * 100).toFixed(1)) : 0;
      return {
        categoryId: r.category_id,
        categoryName: r.category_name,
        purchaseCount: Number(r.purchase_count) || 0,
        totalSpent: catSpent,
        percentageOfSpend: pct,
      };
    });

    const preferredCategory = categoryAffinities[0]?.categoryName || 'General Textiles';

    // Frequently purchased SKUs
    const topSkus = db.prepare(`
      SELECT pv.sku, p.name
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN product_variants pv ON pv.id = si.product_variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE s.customer_id = ? AND s.status = 'COMPLETED'
      GROUP BY pv.sku
      ORDER BY COUNT(si.id) DESC
      LIMIT 3
    `).all(customerId) as any[];

    const frequentlyPurchasedSkus = topSkus.map((t) => `${t.name} (${t.sku})`);

    // Customer Segment Classification
    let segment: CustomerSegment = 'new_customer';
    let segmentLabel = 'New Customer';
    let isDueForVisit = false;
    let suggestedAction = 'Welcome customer with enrollment in Texora Loyalty Rewards.';

    if (totalSpent >= 40000 || (totalVisits >= 4 && aov >= 3500)) {
      segment = 'vip_high_value';
      segmentLabel = '👑 VIP High-Value Patron';
      suggestedAction = 'Showcase exclusive festive silk arrivals and premium designer collections.';
    } else if (totalVisits >= 3) {
      segment = 'returning_regular';
      segmentLabel = '🔄 Returning Regular';
      suggestedAction = 'Suggest complementary accessories or matching fabrics based on preferred categories.';
    } else if (totalVisits === 2) {
      segment = 'frequent_shopper';
      segmentLabel = '🛍️ Frequent Shopper';
      suggestedAction = 'Offer seasonal discount coupons to build repeat store habit.';
    } else {
      segment = 'new_customer';
      segmentLabel = '🆕 First-Time Walk-in';
      suggestedAction = 'Present store best-sellers and standard warranty/exchange policies.';
    }

    if (totalVisits >= 2 && daysSinceLastPurchase >= averageDaysBetweenPurchases * 1.2) {
      isDueForVisit = true;
      if (segment !== 'vip_high_value') {
        segment = 'at_risk_due';
        segmentLabel = '⏳ Due for Re-visit';
      }
      suggestedAction = `Customer usually visits every ~${averageDaysBetweenPurchases} days (last visit was ${daysSinceLastPurchase} days ago). Introduce newly arrived ${preferredCategory} collections.`;
    }

    return {
      customerId: customer.id,
      customerCode: customer.customer_code,
      customerName: customer.name,
      segment,
      segmentLabel,
      totalLifetimeSpend: totalSpent,
      totalVisits,
      averageOrderValue: aov,
      preferredCategory,
      categoryAffinities,
      frequentlyPurchasedSkus,
      averageDaysBetweenPurchases,
      daysSinceLastPurchase,
      isDueForVisit,
      suggestedAction,
    };
  }
}
