/**
 * is-cron - Check if a string is a valid cron expression
 *
 * Supports standard 5-field cron expressions:
 *   minute hour day-of-month month day-of-week
 *
 * And extended 6-field cron expressions (with seconds):
 *   second minute hour day-of-month month day-of-week
 *
 * @license Apache-2.0
 */

/** Options for cron validation */
export interface IsCronOptions {
  /**
   * Enable 6-field cron format with seconds as the first field.
   * @default false
   */
  seconds?: boolean;

  /**
   * Allow month and day-of-week aliases (JAN-DEC, SUN-SAT).
   * @default true
   */
  alias?: boolean;
}

/** Valid cron expression string (branded type for stricter typing) */
export type CronExpression = string & { readonly __brand: unique symbol };

// Regex patterns for cron field validation
// All patterns support optional leading zeros for better compatibility
const MINUTE_SECOND_PATTERN = /^(\*|[0-5]?\d)(-([0-5]?\d))?(\/([1-9]\d*))?$/;
const HOUR_PATTERN = /^(\*|[01]?\d|2[0-3])(-([01]?\d|2[0-3]))?(\/([1-9]\d*))?$/;
const DAY_OF_MONTH_PATTERN = /^(\*|0?[1-9]|[12]\d|3[01])(-([0-9]|0?[1-9]|[12]\d|3[01]))?(\/([1-9]\d*))?$|^\?$/;
const MONTH_PATTERN = /^(\*|0?[1-9]|1[0-2])(-(0?[1-9]|1[0-2]))?(\/([1-9]\d*))?$/;
const DAY_OF_WEEK_PATTERN = /^(\*|0?[0-7])(-0?[0-7])?(\/([1-9]\d*))?$|^\?$/;

// Alias patterns for months and days of week
const MONTH_ALIASES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;
const DAY_ALIASES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/**
 * Validates a single cron field value (handles comma-separated lists)
 */
function isValidField(
  value: string,
  pattern: RegExp,
  min: number,
  max: number,
  aliases?: readonly string[],
  allowAlias?: boolean
): boolean {
  // Handle comma-separated lists
  const parts = value.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed === '') return false;

    // Check for alias
    if (allowAlias && aliases) {
      const upperPart = trimmed.toUpperCase();
      // Handle alias ranges like JAN-MAR
      const aliasRangeMatch = upperPart.match(/^([A-Z]{3})(-([A-Z]{3}))?$/);
      if (aliasRangeMatch) {
        const startAlias = aliasRangeMatch[1];
        const endAlias = aliasRangeMatch[3];

        if (startAlias && !aliases.includes(startAlias as typeof aliases[number])) {
          return false;
        }
        if (endAlias && !aliases.includes(endAlias as typeof aliases[number])) {
          return false;
        }
        if (startAlias && aliases.includes(startAlias as typeof aliases[number])) {
          if (!endAlias || aliases.includes(endAlias as typeof aliases[number])) {
            continue;
          }
        }
      }
    }

    // Check standard pattern
    if (!pattern.test(trimmed)) {
      return false;
    }

    // Validate range boundaries
    const rangeMatch = trimmed.match(/^(\*|\?|\d+)(-(\d+))?(\/(\d+))?$/);
    if (rangeMatch) {
      const start: string | undefined = rangeMatch[1];
      const end: string | undefined = rangeMatch[3];
      const step: string | undefined = rangeMatch[5];

      // Validate start value
      if (start !== undefined && start !== '*' && start !== '?') {
        const startNum = parseInt(start, 10);
        if (startNum < min || startNum > max) return false;
      }

      // Validate end value
      if (end !== undefined) {
        const endNum = parseInt(end, 10);
        if (endNum < min || endNum > max) return false;

        // End must be >= start
        if (start !== undefined && start !== '*' && start !== '?') {
          const startNum = parseInt(start, 10);
          if (endNum < startNum) return false;
        }
      }

      // Validate step value
      if (step !== undefined) {
        const stepNum = parseInt(step, 10);
        if (stepNum < 1 || stepNum > max) return false;
      }
    }
  }

  return true;
}

/**
 * Validates minute field (0-59)
 */
function isValidMinute(value: string): boolean {
  return isValidField(value, MINUTE_SECOND_PATTERN, 0, 59);
}

/**
 * Validates second field (0-59)
 */
function isValidSecond(value: string): boolean {
  return isValidField(value, MINUTE_SECOND_PATTERN, 0, 59);
}

/**
 * Validates hour field (0-23)
 */
function isValidHour(value: string): boolean {
  return isValidField(value, HOUR_PATTERN, 0, 23);
}

/**
 * Validates day of month field (1-31)
 */
function isValidDayOfMonth(value: string): boolean {
  return isValidField(value, DAY_OF_MONTH_PATTERN, 1, 31);
}

/**
 * Validates month field (1-12 or JAN-DEC)
 */
function isValidMonth(value: string, allowAlias: boolean): boolean {
  return isValidField(value, MONTH_PATTERN, 1, 12, MONTH_ALIASES, allowAlias);
}

/**
 * Validates day of week field (0-7, where 0 and 7 are Sunday, or SUN-SAT)
 */
function isValidDayOfWeek(value: string, allowAlias: boolean): boolean {
  return isValidField(value, DAY_OF_WEEK_PATTERN, 0, 7, DAY_ALIASES, allowAlias);
}

/**
 * Check if a string is a valid cron expression.
 *
 * @param value - The value to check
 * @param options - Validation options
 * @returns `true` if the value is a valid cron expression, `false` otherwise
 */
export function isCron(value: unknown, options: IsCronOptions = {}): value is CronExpression {
  // Must be a string
  if (typeof value !== 'string') {
    return false;
  }

  // Trim and normalize whitespace
  const trimmed = value.trim();
  if (trimmed === '') {
    return false;
  }

  // Split into fields
  const fields = trimmed.split(/\s+/);

  const { seconds = false, alias = true } = options;

  // Validate field count
  const expectedFields = seconds ? 6 : 5;
  if (fields.length !== expectedFields) {
    return false;
  }

  // Destructure fields based on format
  let second: string | undefined;
  let minute: string;
  let hour: string;
  let dayOfMonth: string;
  let month: string;
  let dayOfWeek: string;

  if (seconds) {
    [second, minute, hour, dayOfMonth, month, dayOfWeek] = fields as [string, string, string, string, string, string];
  } else {
    [minute, hour, dayOfMonth, month, dayOfWeek] = fields as [string, string, string, string, string];
  }

  // Validate each field
  if (seconds && second !== undefined && !isValidSecond(second)) {
    return false;
  }

  if (!isValidMinute(minute)) {
    return false;
  }

  if (!isValidHour(hour)) {
    return false;
  }

  if (!isValidDayOfMonth(dayOfMonth)) {
    return false;
  }

  if (!isValidMonth(month, alias)) {
    return false;
  }

  if (!isValidDayOfWeek(dayOfWeek, alias)) {
    return false;
  }

  return true;
}

/**
 * Check if a string is a valid standard 5-field cron expression.
 * Alias for `isCron(value, { seconds: false })`
 */
export function isStandardCron(value: unknown): value is CronExpression {
  return isCron(value, { seconds: false });
}

/**
 * Check if a string is a valid 6-field cron expression with seconds.
 * Alias for `isCron(value, { seconds: true })`
 */
export function isExtendedCron(value: unknown): value is CronExpression {
  return isCron(value, { seconds: true });
}

// Default export
export default isCron;
