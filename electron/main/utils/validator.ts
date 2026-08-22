/**
 * Phase 17 — Reusable Server-Side Input Validators & Error Sanitizer
 * Ensures all IPC inputs meet business constraints and sensitive server paths/queries are not leaked.
 */

export class ValidationError extends Error {
  public field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export const Validators = {
  /**
   * Validate non-empty string with length bounds
   */
  string(val: unknown, fieldName: string, minLength: number = 1, maxLength: number = 255): string {
    if (typeof val !== 'string' || val.trim().length < minLength) {
      throw new ValidationError(`${fieldName} is required and must be at least ${minLength} characters.`, fieldName);
    }
    const clean = val.trim();
    if (clean.length > maxLength) {
      throw new ValidationError(`${fieldName} exceeds maximum length of ${maxLength} characters.`, fieldName);
    }
    return clean;
  },

  /**
   * Validate positive number
   */
  number(val: unknown, fieldName: string, allowZero: boolean = false, min?: number, max?: number): number {
    const num = typeof val === 'number' ? val : Number(val);
    if (isNaN(num)) {
      throw new ValidationError(`${fieldName} must be a valid number.`, fieldName);
    }
    if (!allowZero && num <= 0) {
      throw new ValidationError(`${fieldName} must be greater than zero.`, fieldName);
    }
    if (allowZero && num < 0) {
      throw new ValidationError(`${fieldName} cannot be negative.`, fieldName);
    }
    if (min !== undefined && num < min) {
      throw new ValidationError(`${fieldName} cannot be less than ${min}.`, fieldName);
    }
    if (max !== undefined && num > max) {
      throw new ValidationError(`${fieldName} cannot exceed ${max}.`, fieldName);
    }
    return num;
  },

  /**
   * Validate Indian Mobile Number (10 digits)
   */
  phone(val: unknown, fieldName: string = 'Mobile number'): string {
    if (typeof val !== 'string') {
      throw new ValidationError(`${fieldName} is required.`, fieldName);
    }
    const clean = val.replace(/[\s\-+()]/g, '');
    const norm = clean.startsWith('91') && clean.length > 10 ? clean.slice(2) : clean;
    if (!/^\d{10}$/.test(norm)) {
      throw new ValidationError(`${fieldName} must be a valid 10-digit phone number.`, fieldName);
    }
    return norm;
  },

  /**
   * Validate Email format
   */
  email(val: unknown, fieldName: string = 'Email address'): string | undefined {
    if (!val || typeof val !== 'string' || val.trim() === '') return undefined;
    const clean = val.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(clean)) {
      throw new ValidationError(`Invalid email address format for ${fieldName}.`, fieldName);
    }
    return clean;
  },

  /**
   * Validate POS Cart Items
   */
  cartItems(items: unknown): Array<{ variantId: number; quantity: number; unitPrice: number; discount?: number }> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Cart cannot be empty. Please select at least one item.', 'items');
    }

    return items.map((item, idx) => {
      if (!item || typeof item !== 'object') {
        throw new ValidationError(`Invalid item format at position ${idx + 1}.`, `items[${idx}]`);
      }
      const variantId = Validators.number(item.variantId, `Item #${idx + 1} Variant ID`);
      const quantity = Validators.number(item.quantity, `Item #${idx + 1} Quantity`);
      const unitPrice = Validators.number(item.unitPrice, `Item #${idx + 1} Unit Price`, true);
      const discount = item.discount !== undefined ? Validators.number(item.discount, `Item #${idx + 1} Discount`, true) : 0;

      return { variantId, quantity, unitPrice, discount };
    });
  },

  /**
   * Validate POS Discount
   */
  discount(type?: string, value?: number): { discountType: 'PERCENT' | 'FLAT' | 'NONE'; discountValue: number } {
    if (!type || type === 'NONE' || !value || value === 0) {
      return { discountType: 'NONE', discountValue: 0 };
    }
    const cleanType = type.toUpperCase() as 'PERCENT' | 'FLAT';
    if (!['PERCENT', 'FLAT'].includes(cleanType)) {
      throw new ValidationError("Invalid discount type. Must be 'PERCENT' or 'FLAT'.", 'discountType');
    }
    const cleanVal = Validators.number(value, 'Discount value', true, 0, cleanType === 'PERCENT' ? 100 : 1000000);
    return { discountType: cleanType, discountValue: cleanVal };
  },
};

/**
 * Sanitize error message for UI presentation
 */
export function sanitizeErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  
  let rawMsg = typeof err === 'string' ? err : (err as Error).message || String(err);

  // If it's a known ValidationError, return directly
  if (err instanceof ValidationError) {
    return rawMsg;
  }

  // Strip file paths (C:\..., /Users/..., etc.)
  rawMsg = rawMsg.replace(/([A-Za-z]:)?(\\|\/)[^:\n\r]+/g, '[Internal Path]');

  // Strip SQL statements
  rawMsg = rawMsg.replace(/SELECT\s+.+?FROM/gi, 'SQL Query');
  rawMsg = rawMsg.replace(/INSERT\s+INTO.+?VALUES/gi, 'SQL Insert');
  rawMsg = rawMsg.replace(/UPDATE\s+.+?SET/gi, 'SQL Update');

  // Strip stack trace frames
  if (rawMsg.includes('at ') && rawMsg.includes('.ts:')) {
    rawMsg = rawMsg.split('\n')[0];
  }

  // Friendly fallbacks for standard SQLite error codes
  if (rawMsg.includes('SQLITE_BUSY')) {
    return 'Database is busy processing another transaction. Please retry in a moment.';
  }
  if (rawMsg.includes('SQLITE_CONSTRAINT_UNIQUE')) {
    return 'A record with this identifier or code already exists.';
  }
  if (rawMsg.includes('SQLITE_CONSTRAINT_FOREIGNKEY')) {
    return 'Cannot complete operation: referenced related record was not found.';
  }

  return rawMsg;
}
