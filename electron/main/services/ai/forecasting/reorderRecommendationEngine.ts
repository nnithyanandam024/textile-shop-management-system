import { getDatabase } from '../../../database';
import {
  ProductForecastItem,
  ReorderRecommendation,
  StockRiskLevel,
  InventoryIntelligenceSummary,
} from './forecastingTypes';
import { ForecastingEngine } from './forecastingEngine';
import { DeadStockDetector } from './deadStockDetector';

export class ReorderRecommendationEngine {
  /**
   * Evaluates all active variants and generates the full Inventory Intelligence Summary
   */
  public static generateInventoryIntelligence(): InventoryIntelligenceSummary {
    const db = getDatabase();

    const variants = db.prepare(`
      SELECT 
        pv.id as variant_id,
        pv.product_id,
        p.name as product_name,
        pv.sku,
        c.name as category_name,
        b.name as brand_name,
        pv.size,
        pv.color,
        pv.current_stock,
        pv.minimum_stock,
        pv.reorder_level,
        pv.purchase_price,
        pv.selling_price,
        sup.name as supplier_name,
        COALESCE(sup.lead_time_days, 5) as lead_time_days
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN suppliers sup ON sup.id = p.supplier_id
      WHERE pv.is_active = 1 AND p.is_active = 1
      ORDER BY pv.current_stock ASC
    `).all() as any[];

    const allForecasts: ProductForecastItem[] = [];
    const topReorderRecommendations: ReorderRecommendation[] = [];

    let criticalCount = 0;
    let monitorCount = 0;
    let healthyCount = 0;
    let urgentReordersCost = 0;

    for (const v of variants) {
      const currentStock = Number(v.current_stock) || 0;
      const minStock = Number(v.minimum_stock) || 5;
      const configuredRop = Number(v.reorder_level) || minStock;
      const leadTime = Number(v.lead_time_days) || 5;
      const purchasePrice = Number(v.purchase_price) || 0;

      // 1. Calculate Average Daily Demand (ADD)
      const { add, totalSold60d, daysSinceLastSale } = ForecastingEngine.calculateAverageDailyDemand(v.variant_id);

      // 2. Projected Demand
      const forecast7 = ForecastingEngine.projectDemand(add, 7);
      const forecast14 = ForecastingEngine.projectDemand(add, 14);
      const forecast30 = ForecastingEngine.projectDemand(add, 30);

      // 3. Days of Supply Remaining
      let daysOfSupply = 999;
      if (add > 0) {
        daysOfSupply = Math.round(currentStock / add);
      } else if (currentStock === 0) {
        daysOfSupply = 0;
      }

      // 4. Smart Reorder Point (ROP = Lead Time Demand + Safety Stock)
      const leadTimeDemand = Math.ceil(add * leadTime);
      const safetyStock = Math.max(minStock, Math.ceil(add * 3));
      const smartRop = Math.max(configuredRop, leadTimeDemand + safetyStock);

      // 5. Recommended Order Quantity (Target 30-Day buffer)
      const roq = Math.max(0, forecast30 - currentStock + safetyStock);

      // 6. Assess Confidence
      const confidence = ForecastingEngine.assessConfidence(totalSold60d, daysSinceLastSale);

      // 7. Classify Stock Risk Level
      let stockRiskLevel: StockRiskLevel = 'healthy';
      if (currentStock === 0 || currentStock <= smartRop || daysOfSupply <= leadTime) {
        stockRiskLevel = 'critical';
        criticalCount++;
      } else if (currentStock <= smartRop * 1.5 || daysOfSupply <= 14) {
        stockRiskLevel = 'monitor';
        monitorCount++;
      } else if (totalSold60d < 2 && daysSinceLastSale >= 45 && currentStock >= 15) {
        stockRiskLevel = 'dead_stock';
      } else if (add < 0.2 && currentStock >= 25) {
        stockRiskLevel = 'slow_moving';
      } else {
        stockRiskLevel = 'healthy';
        healthyCount++;
      }

      // 8. AI Explanations & Suggestions
      let aiExplanation = '';
      let actionableSuggestion = '';

      if (stockRiskLevel === 'critical') {
        if (currentStock === 0) {
          aiExplanation = `Product is completely OUT OF STOCK with active expected demand of ~${forecast7} units over the next 7 days.`;
          actionableSuggestion = `Urgent PO required immediately. Suggested restock quantity is ${roq} units.`;
        } else {
          aiExplanation = `Reorder strongly recommended. Selling approximately ${add} units/day; current stock (${currentStock}) will deplete in ~${daysOfSupply} days. Supplier delivery requires ${leadTime} days.`;
          actionableSuggestion = `Place replenishment order of ${roq} units with ${v.supplier_name || 'supplier'} to avoid a stockout.`;
        }
      } else if (stockRiskLevel === 'monitor') {
        aiExplanation = `Inventory is sufficient for ~${daysOfSupply} days. Expected 14-day demand is ${forecast14} units.`;
        actionableSuggestion = `Monitor sales velocity over the coming weekend and prepare replenishment draft.`;
      } else if (stockRiskLevel === 'dead_stock') {
        aiExplanation = `Stagnant inventory: only ${totalSold60d} units sold in 60 days with ${currentStock} units remaining on shelves.`;
        actionableSuggestion = `Consider festive combo bundling or clearance display to free up working capital.`;
      } else if (stockRiskLevel === 'slow_moving') {
        aiExplanation = `Low velocity product selling ${add} units/day. Current stock will last ${daysOfSupply} days.`;
        actionableSuggestion = `Pause further procurement until stock dips below ${minStock} units.`;
      } else {
        aiExplanation = `Stock levels are healthy. Current inventory (${currentStock} units) covers expected 30-day demand (${forecast30} units).`;
        actionableSuggestion = `Maintain regular floor display and monitoring.`;
      }

      // Generate demand timeline (Past 6 weeks + Next 4 projected weeks)
      const demandTimeline = ForecastingEngine.generateDemandTimeline(v.variant_id, add);

      const forecastItem: ProductForecastItem = {
        variantId: v.variant_id,
        productId: v.product_id,
        productName: v.product_name,
        sku: v.sku,
        categoryName: v.category_name || 'General',
        brandName: v.brand_name,
        size: v.size,
        color: v.color,
        currentStock,
        minimumStock: minStock,
        reorderLevel: configuredRop,
        supplierName: v.supplier_name || 'Primary Supplier',
        leadTimeDays: leadTime,
        purchasePrice,
        sellingPrice: Number(v.selling_price) || 0,
        averageDailyDemand: add,
        daysOfSupplyRemaining: daysOfSupply,
        forecast7Days: forecast7,
        forecast14Days: forecast14,
        forecast30Days: forecast30,
        smartReorderPoint: smartRop,
        recommendedOrderQuantity: roq,
        stockRiskLevel,
        confidence,
        aiExplanation,
        actionableSuggestion,
        demandTimeline,
      };

      allForecasts.push(forecastItem);

      // Collect top urgent reorder recommendations
      if (stockRiskLevel === 'critical' && roq > 0) {
        const estCost = roq * purchasePrice;
        urgentReordersCost += estCost;

        topReorderRecommendations.push({
          variantId: v.variant_id,
          productId: v.product_id,
          productName: v.product_name,
          sku: v.sku,
          categoryName: v.category_name || 'General',
          supplierName: v.supplier_name || 'Primary Supplier',
          currentStock,
          averageDailyDemand: add,
          daysOfSupply,
          leadTimeDays: leadTime,
          smartReorderPoint: smartRop,
          suggestedReorderQuantity: roq,
          estimatedCost: estCost,
          stockRiskLevel: 'critical',
          confidence,
          aiReasoning: aiExplanation,
        });
      }
    }

    // Sort reorders by most urgent (lowest days of supply first)
    topReorderRecommendations.sort((a, b) => a.daysOfSupply - b.daysOfSupply);

    // Dead stock analysis
    const deadStockList = DeadStockDetector.detectDeadStock(variants);

    return {
      totalVariantsAnalyzed: variants.length,
      criticalReorderCount: criticalCount,
      monitorCount: monitorCount,
      healthyCount: healthyCount,
      deadStockCount: deadStockList.length,
      capitalTiedInDeadStock: deadStockList.reduce((acc, d) => acc + d.stockCostValue, 0),
      urgentReordersEstimatedCost: urgentReordersCost,
      topReorderRecommendations,
      deadStockList,
      allForecasts,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieves single product detailed forecast
   */
  public static getProductForecast(variantId: number): ProductForecastItem | null {
    const summary = this.generateInventoryIntelligence();
    return summary.allForecasts.find((f) => f.variantId === variantId) || null;
  }
}
