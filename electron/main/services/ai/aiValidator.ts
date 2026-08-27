import { AiChatResponse, AiStructuredData } from './aiConfig';

export class AiValidator {
  /**
   * Generates a structured, validated response for Sales Summary
   */
  public static formatSalesResponse(toolData: any): AiChatResponse {
    const formattedSales = `₹${toolData.totalSales.toLocaleString()}`;
    const formattedAvg = `₹${toolData.averageBill.toLocaleString()}`;
    const formattedDisc = `₹${toolData.totalDiscount.toLocaleString()}`;

    let growthNarrative = '';
    if (toolData.previousSales > 0) {
      if (toolData.growthDirection === 'higher') {
        growthNarrative = ` (📈 **+${toolData.growthPercent}%** higher than yesterday's ₹${toolData.previousSales.toLocaleString()})`;
      } else if (toolData.growthDirection === 'lower') {
        growthNarrative = ` (📉 **-${toolData.growthPercent}%** lower than yesterday's ₹${toolData.previousSales.toLocaleString()})`;
      }
    }

    const answer = `### 📊 ${toolData.periodLabel}'s Sales Summary\n\n` +
      `• **Total Revenue:** **${formattedSales}**${growthNarrative}\n` +
      `• **Completed Invoices:** **${toolData.transactions}** transactions\n` +
      `• **Average Bill Value:** **${formattedAvg}**\n` +
      `• **Discounts Given:** **${formattedDisc}**\n` +
      `• **Top Category:** **${toolData.topCategory}**`;

    const structuredData: AiStructuredData = {
      type: 'sales_summary',
      title: `${toolData.periodLabel}'s Sales`,
      metrics: {
        'Total Revenue': formattedSales,
        'Transactions': toolData.transactions,
        'Average Ticket': formattedAvg,
        'Total Discounts': formattedDisc,
        'Leading Category': toolData.topCategory,
      },
      aiInsight: toolData.growthPercent > 0
        ? `Sales are ${toolData.growthDirection} by ${toolData.growthPercent}% compared to prior period.`
        : 'Steady counter billing flow recorded across active cash registers.',
      raw: toolData,
    };

    return {
      answer,
      data: structuredData,
      source: 'Sales Engine & POS Billing Invoices',
      sourcesUsed: ['Sales Records', `${toolData.periodLabel} POS Invoices`, 'Register Balances'],
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      toolExecuted: 'getSalesSummary',
    };
  }

  /**
   * Generates a structured, validated response for Top Selling Products
   */
  public static formatTopProductsResponse(toolData: any): AiChatResponse {
    if (!toolData.topProducts || toolData.topProducts.length === 0) {
      return {
        answer: 'No product sales recorded yet for the selected period.',
        source: 'Sales Inventory Aggregates',
        sourcesUsed: ['Sale Item History'],
        generatedAt: new Date().toISOString(),
        confidence: 1.0,
        toolExecuted: 'getTopSellingProducts',
      };
    }

    let answer = `### 🏆 Top Selling Products & Fast Movers\n\n`;
    toolData.topProducts.forEach((p: any) => {
      answer += `${p.rank}. **${p.name}** (${p.category})\n` +
        `   • Units Sold: **${p.unitsSold} units** | Revenue: **₹${p.revenue.toLocaleString()}**\n` +
        `   • Variant: \`${p.sku}\` (${p.variantInfo})\n\n`;
    });

    const structuredData: AiStructuredData = {
      type: 'top_products',
      title: 'Top Fast-Moving Products',
      items: toolData.topProducts,
      aiInsight: `${toolData.topProducts[0]?.name || 'Top items'} lead overall volume contribution.`,
      raw: toolData,
    };

    return {
      answer,
      data: structuredData,
      source: 'Product Variant & Sales Item Aggregates',
      sourcesUsed: ['Sale Items Database', 'Barcode Records', 'Inventory Movement Register'],
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      toolExecuted: 'getTopSellingProducts',
    };
  }

  /**
   * Generates a structured response for Low Stock Products
   */
  public static formatLowStockResponse(toolData: any): AiChatResponse {
    let answer = `### 🚨 Inventory Stock Alerts\n\n` +
      `• **Low Stock Warnings:** **${toolData.lowStockCount} items**\n` +
      `• **Out of Stock Items:** **${toolData.outOfStockCount} items**\n\n`;

    if (toolData.outOfStockItems && toolData.outOfStockItems.length > 0) {
      answer += `#### ⛔ Out of Stock (Urgent Re-order Required):\n`;
      toolData.outOfStockItems.slice(0, 5).forEach((item: any) => {
        answer += `• **${item.product}** (\`${item.sku}\`) — ${item.color}, ${item.size} (Min threshold: ${item.minThreshold})\n`;
      });
      answer += '\n';
    }

    if (toolData.lowStockItems && toolData.lowStockItems.length > 0) {
      answer += `#### ⚠️ Low Stock (Below Minimum Threshold):\n`;
      toolData.lowStockItems.slice(0, 5).forEach((item: any) => {
        answer += `• **${item.product}** (\`${item.sku}\`) — **${item.currentStock} units left** (Min: ${item.minThreshold})\n`;
      });
    }

    const structuredData: AiStructuredData = {
      type: 'low_stock',
      title: 'Stock Re-order Alerts',
      metrics: {
        'Low Stock Items': toolData.lowStockCount,
        'Out of Stock': toolData.outOfStockCount,
        'Total Alerts': toolData.totalLowStockAlerts,
      },
      items: [...toolData.outOfStockItems, ...toolData.lowStockItems],
      aiInsight: toolData.outOfStockCount > 0
        ? `Immediate purchase order recommended for ${toolData.outOfStockCount} critical out-of-stock items.`
        : 'Stock levels are manageable with minimal re-order requirements.',
      raw: toolData,
    };

    return {
      answer,
      data: structuredData,
      source: 'Warehouse Inventory & Variant Threshold Engine',
      sourcesUsed: ['Product Variants Ledger', 'Minimum Stock Rules', 'Warehouse Stock Matrix'],
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      toolExecuted: 'getLowStockProducts',
    };
  }

  /**
   * Generates a structured response for Inventory Overview
   */
  public static formatInventorySummaryResponse(toolData: any): AiChatResponse {
    const costVal = `₹${toolData.costValuation.toLocaleString()}`;
    const retailVal = `₹${toolData.retailValuation.toLocaleString()}`;
    const margin = `₹${toolData.potentialMargin.toLocaleString()}`;

    const answer = `### 📦 Warehouse & Inventory Overview\n\n` +
      `• **Active Products:** **${toolData.totalProducts} products** (${toolData.totalVariants} SKUs)\n` +
      `• **Total Stock in Store:** **${toolData.totalUnits.toLocaleString()} units**\n` +
      `• **Stock Valuation (Cost):** **${costVal}**\n` +
      `• **Estimated Retail Value:** **${retailVal}** (Potential Gross Margin: **${margin}**)\n` +
      `• **Alerts:** ${toolData.lowStockCount} Low Stock, ${toolData.outOfStockCount} Out of Stock`;

    const structuredData: AiStructuredData = {
      type: 'inventory_summary',
      title: 'Inventory Valuation & Metrics',
      metrics: {
        'Total Products': toolData.totalProducts,
        'Total SKUs': toolData.totalVariants,
        'In-Stock Units': toolData.totalUnits.toLocaleString(),
        'Cost Valuation': costVal,
        'Retail Valuation': retailVal,
        'Gross Margin': margin,
      },
      aiInsight: `Total store inventory health is strong across ${toolData.totalUnits.toLocaleString()} units.`,
      raw: toolData,
    };

    return {
      answer,
      data: structuredData,
      source: 'Master Warehouse Stock Balance & Costing Registry',
      sourcesUsed: ['Product Variants Table', 'Purchase Cost Master', 'Active SKU Inventory'],
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      toolExecuted: 'getInventorySummary',
    };
  }

  /**
   * Generates a structured response for Customer Summary
   */
  public static formatCustomerResponse(toolData: any): AiChatResponse {
    let answer = `### 👥 Customer CRM & Loyalty Insights\n\n` +
      `• **Total Registered Customers:** **${toolData.totalCustomers}**\n` +
      `• **New Customers Today:** **+${toolData.newCustomersToday}**\n\n`;

    if (toolData.topCustomers && toolData.topCustomers.length > 0) {
      answer += `#### 🌟 Top Loyalty Customers:\n`;
      toolData.topCustomers.forEach((c: any) => {
        answer += `${c.rank}. **${c.name}** — Lifetime Spend: **₹${c.lifetimeSpend.toLocaleString()}** (${c.orderCount} visits, **${c.loyaltyPoints} pts**)\n`;
      });
    }

    const structuredData: AiStructuredData = {
      type: 'customer_summary',
      title: 'Customer Directory & Loyalty',
      metrics: {
        'Total Customers': toolData.totalCustomers,
        'New Today': toolData.newCustomersToday,
        'Top Customer': toolData.topCustomers[0]?.name || 'N/A',
      },
      items: toolData.topCustomers,
      aiInsight: `${toolData.newCustomersToday} new customer(s) registered today. Top patrons show strong repeat visits.`,
      raw: toolData,
    };

    return {
      answer,
      data: structuredData,
      source: 'Customer CRM Database & Loyalty Engine',
      sourcesUsed: ['Customer Accounts', 'Loyalty Balance Register', 'Sales Invoices by Customer'],
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      toolExecuted: 'getCustomerSummary',
    };
  }

  /**
   * Generates a structured response for Attendance Summary
   */
  public static formatAttendanceResponse(toolData: any): AiChatResponse {
    const answer = `### ⏱️ Staff Attendance & On-Duty Summary (${toolData.date})\n\n` +
      `• **Total Active Staff:** **${toolData.totalActiveStaff}**\n` +
      `• **Present On Duty:** **${toolData.presentCount} staff**\n` +
      `• **Late Arrivals:** **${toolData.lateArrivalsCount}**\n` +
      `• **Absent / Unaccounted:** **${toolData.absentCount}**\n` +
      `• **Approved Leaves:** **${toolData.onLeaveCount}**`;

    const structuredData: AiStructuredData = {
      type: 'attendance_summary',
      title: 'Staff On-Duty Attendance',
      metrics: {
        'Active Staff': toolData.totalActiveStaff,
        'Present Today': toolData.presentCount,
        'Late Arrivals': toolData.lateArrivalsCount,
        'On Leave': toolData.onLeaveCount,
      },
      aiInsight: `${toolData.presentCount} out of ${toolData.totalActiveStaff} employees are currently on store floor.`,
      raw: toolData,
    };

    return {
      answer,
      data: structuredData,
      source: 'Biometric & Terminal Staff Attendance Register',
      sourcesUsed: ['Staff Master', 'Attendance Log', 'Shift Schedules'],
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      toolExecuted: 'getAttendanceSummary',
    };
  }

  /**
   * Generates a structured response for Daily Business Executive Report
   */
  public static formatDailyBusinessReport(toolData: any): AiChatResponse {
    const salesFormatted = `₹${toolData.salesTotal.toLocaleString()}`;
    const avgBillFormatted = `₹${toolData.averageBillValue.toLocaleString()}`;

    const answer = `### 📊 Today's Business Summary\n\n` +
      `**Sales:** **${salesFormatted}**  \n` +
      `**Transactions:** **${toolData.transactionCount}**  \n` +
      `**Average Bill:** **${avgBillFormatted}**  \n` +
      `**Top Category:** **${toolData.topCategory}**  \n` +
      `**Low Stock Alerts:** **${toolData.lowStockAlertCount} products** (${toolData.outOfStockCount} out of stock)  \n` +
      `**Staff On Duty:** **${toolData.staffPresent} / ${toolData.totalActiveStaff} present**  \n\n` +
      `💡 **AI Insight:** ${toolData.aiInsight}`;

    const structuredData: AiStructuredData = {
      type: 'daily_business_report',
      title: "Today's Business Summary",
      metrics: {
        'Sales': salesFormatted,
        'Transactions': toolData.transactionCount,
        'Average Bill': avgBillFormatted,
        'Top Category': toolData.topCategory,
        'Low Stock': `${toolData.lowStockAlertCount} products`,
        'Staff Present': `${toolData.staffPresent}/${toolData.totalActiveStaff}`,
      },
      aiInsight: toolData.aiInsight,
      raw: toolData,
    };

    return {
      answer,
      data: structuredData,
      source: 'Consolidated Executive Business Intelligence Register',
      sourcesUsed: ['Sales Records', 'Warehouse Stock Matrix', 'Customer CRM', 'Staff Attendance Terminal'],
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      toolExecuted: 'getDailyReport',
    };
  }

  /**
   * Generates a permission-denied response
   */
  public static formatPermissionDenied(reason?: string): AiChatResponse {
    const answer = `🔒 **Access Restricted**\n\n${reason || "You don't have permission to access this information."}\n\n*If you require access, please contact your store administrator.*`;

    return {
      answer,
      data: {
        type: 'permission_denied',
        title: 'Access Restricted',
        aiInsight: 'Request rejected by RBAC security guard.',
      },
      source: 'Texora Security & RBAC Guard',
      sourcesUsed: ['Role Permission Matrix'],
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      requiresPermission: 'Restricted',
    };
  }

  /**
   * Generates a clear out-of-scope response (e.g. predictive forecasting reserved for Phase 2)
   */
  public static formatOutOfScopeResponse(query: string): AiChatResponse {
    const isForecast = query.toLowerCase().includes('forecast') ||
      query.toLowerCase().includes('predict') ||
      query.toLowerCase().includes('next month') ||
      query.toLowerCase().includes('next year') ||
      query.toLowerCase().includes('future');

    const answer = isForecast
      ? `🔮 **Demand & Sales Forecasting Notice**\n\n` +
        `I specialize in real-time showroom analytics, live sales performance, stock movements, and staff operational data. ` +
        `For deep predictive replenishment, please explore the **Smart Reorders & Inventory Planning** tab.\n\n` +
        `Right now, I can provide real-time reporting on:\n` +
        `• Today's / Yesterday's sales & transactions\n` +
        `• Top-selling fast movers & categories\n` +
        `• Current low stock & out-of-stock items\n` +
        `• Customer loyalty & on-duty staff attendance`
      : `🤖 **Texora Business Assistant**\n\n` +
        `I specialize in answering questions about your textile store's **Sales, Inventory, Customers, Products, and Staff Attendance**.\n\n` +
        `Try asking:\n` +
        `• *"How much did we sell today?"*\n` +
        `• *"What are today's top-selling products?"*\n` +
        `• *"Which items are low in stock?"*\n` +
        `• *"Give me today's business summary"*`;

    return {
      answer,
      data: {
        type: 'out_of_scope',
        title: 'Assistant Scope Notice',
        aiInsight: 'For forward replenishment models, consult the Inventory Planning module.',
      },
      source: 'Texora AI Capability Registry',
      sourcesUsed: ['AI Capability Definition'],
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
    };
  }
}
