import { describe, it, expect } from 'vitest';
import isCron, { isStandardCron, isExtendedCron, type CronExpression, type IsCronOptions } from '../src/index.js';

describe('isCron', () => {
  describe('basic validation', () => {
    it('should return false for non-string values', () => {
      expect(isCron(null)).toBe(false);
      expect(isCron(undefined)).toBe(false);
      expect(isCron(123)).toBe(false);
      expect(isCron({})).toBe(false);
      expect(isCron([])).toBe(false);
      expect(isCron(true)).toBe(false);
      expect(isCron(false)).toBe(false);
      expect(isCron(() => {})).toBe(false);
      expect(isCron(Symbol('cron'))).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(isCron('')).toBe(false);
      expect(isCron('   ')).toBe(false);
      expect(isCron('\t')).toBe(false);
      expect(isCron('\n')).toBe(false);
    });

    it('should return false for invalid field count', () => {
      expect(isCron('*')).toBe(false);
      expect(isCron('* *')).toBe(false);
      expect(isCron('* * *')).toBe(false);
      expect(isCron('* * * *')).toBe(false);
      expect(isCron('* * * * * *')).toBe(false); // 6 fields without seconds option
      expect(isCron('* * * * * * *')).toBe(false);
    });

    it('should handle extra whitespace', () => {
      expect(isCron('  * * * * *  ')).toBe(true);
      expect(isCron('*  *  *  *  *')).toBe(true);
      expect(isCron('\t*\t*\t*\t*\t*\t')).toBe(true);
    });
  });

  describe('standard 5-field cron expressions', () => {
    it('should validate wildcard expressions', () => {
      expect(isCron('* * * * *')).toBe(true);
    });

    it('should validate specific values', () => {
      expect(isCron('0 0 1 1 0')).toBe(true);
      expect(isCron('59 23 31 12 6')).toBe(true);
      expect(isCron('30 12 15 6 3')).toBe(true);
    });

    it('should validate common cron patterns', () => {
      // Every minute
      expect(isCron('* * * * *')).toBe(true);

      // Every hour at minute 0
      expect(isCron('0 * * * *')).toBe(true);

      // Daily at midnight
      expect(isCron('0 0 * * *')).toBe(true);

      // Weekly on Sunday at midnight
      expect(isCron('0 0 * * 0')).toBe(true);

      // Monthly on the 1st at midnight
      expect(isCron('0 0 1 * *')).toBe(true);

      // Yearly on Jan 1st at midnight
      expect(isCron('0 0 1 1 *')).toBe(true);
    });
  });

  describe('minute field (0-59)', () => {
    it('should accept valid minute values', () => {
      expect(isCron('0 * * * *')).toBe(true);
      expect(isCron('30 * * * *')).toBe(true);
      expect(isCron('59 * * * *')).toBe(true);
    });

    it('should reject invalid minute values', () => {
      expect(isCron('60 * * * *')).toBe(false);
      expect(isCron('100 * * * *')).toBe(false);
      expect(isCron('-1 * * * *')).toBe(false);
    });

    it('should accept minute ranges', () => {
      expect(isCron('0-30 * * * *')).toBe(true);
      expect(isCron('15-45 * * * *')).toBe(true);
      expect(isCron('0-59 * * * *')).toBe(true);
    });

    it('should reject invalid minute ranges', () => {
      expect(isCron('30-15 * * * *')).toBe(false); // end < start
      expect(isCron('0-60 * * * *')).toBe(false);
    });

    it('should accept minute steps', () => {
      expect(isCron('*/5 * * * *')).toBe(true);
      expect(isCron('*/15 * * * *')).toBe(true);
      expect(isCron('0/10 * * * *')).toBe(true);
      expect(isCron('0-30/5 * * * *')).toBe(true);
    });

    it('should reject invalid minute steps', () => {
      expect(isCron('*/0 * * * *')).toBe(false);
      expect(isCron('*/-1 * * * *')).toBe(false);
    });

    it('should accept comma-separated minutes', () => {
      expect(isCron('0,15,30,45 * * * *')).toBe(true);
      expect(isCron('0,30 * * * *')).toBe(true);
    });
  });

  describe('hour field (0-23)', () => {
    it('should accept valid hour values', () => {
      expect(isCron('* 0 * * *')).toBe(true);
      expect(isCron('* 12 * * *')).toBe(true);
      expect(isCron('* 23 * * *')).toBe(true);
    });

    it('should reject invalid hour values', () => {
      expect(isCron('* 24 * * *')).toBe(false);
      expect(isCron('* 100 * * *')).toBe(false);
      expect(isCron('* -1 * * *')).toBe(false);
    });

    it('should accept hour ranges', () => {
      expect(isCron('* 9-17 * * *')).toBe(true);
      expect(isCron('* 0-23 * * *')).toBe(true);
    });

    it('should accept comma-separated hours', () => {
      expect(isCron('* 9,12,18 * * *')).toBe(true);
    });

    it('should accept hour steps', () => {
      expect(isCron('* */2 * * *')).toBe(true);
      expect(isCron('* */6 * * *')).toBe(true);
    });
  });

  describe('day of month field (1-31)', () => {
    it('should accept valid day values', () => {
      expect(isCron('* * 1 * *')).toBe(true);
      expect(isCron('* * 15 * *')).toBe(true);
      expect(isCron('* * 31 * *')).toBe(true);
    });

    it('should reject invalid day values', () => {
      expect(isCron('* * 0 * *')).toBe(false);
      expect(isCron('* * 32 * *')).toBe(false);
      expect(isCron('* * 100 * *')).toBe(false);
    });

    it('should accept ? (no specific value)', () => {
      expect(isCron('* * ? * *')).toBe(true);
    });

    it('should accept day ranges', () => {
      expect(isCron('* * 1-15 * *')).toBe(true);
      expect(isCron('* * 15-31 * *')).toBe(true);
    });

    it('should accept comma-separated days', () => {
      expect(isCron('* * 1,15 * *')).toBe(true);
    });

    it('should accept day steps', () => {
      expect(isCron('* * */5 * *')).toBe(true);
      expect(isCron('* * 1/7 * *')).toBe(true);
    });
  });

  describe('month field (1-12)', () => {
    it('should accept valid month values', () => {
      expect(isCron('* * * 1 *')).toBe(true);
      expect(isCron('* * * 6 *')).toBe(true);
      expect(isCron('* * * 12 *')).toBe(true);
    });

    it('should reject invalid month values', () => {
      expect(isCron('* * * 0 *')).toBe(false);
      expect(isCron('* * * 13 *')).toBe(false);
      expect(isCron('* * * 100 *')).toBe(false);
    });

    it('should accept month aliases by default', () => {
      expect(isCron('* * * JAN *')).toBe(true);
      expect(isCron('* * * FEB *')).toBe(true);
      expect(isCron('* * * MAR *')).toBe(true);
      expect(isCron('* * * APR *')).toBe(true);
      expect(isCron('* * * MAY *')).toBe(true);
      expect(isCron('* * * JUN *')).toBe(true);
      expect(isCron('* * * JUL *')).toBe(true);
      expect(isCron('* * * AUG *')).toBe(true);
      expect(isCron('* * * SEP *')).toBe(true);
      expect(isCron('* * * OCT *')).toBe(true);
      expect(isCron('* * * NOV *')).toBe(true);
      expect(isCron('* * * DEC *')).toBe(true);
    });

    it('should accept lowercase month aliases', () => {
      expect(isCron('* * * jan *')).toBe(true);
      expect(isCron('* * * Jun *')).toBe(true);
    });

    it('should reject month aliases when disabled', () => {
      expect(isCron('* * * JAN *', { alias: false })).toBe(false);
    });

    it('should accept month alias ranges', () => {
      expect(isCron('* * * JAN-MAR *')).toBe(true);
      expect(isCron('* * * APR-SEP *')).toBe(true);
    });

    it('should accept month ranges', () => {
      expect(isCron('* * * 1-6 *')).toBe(true);
      expect(isCron('* * * 6-12 *')).toBe(true);
    });

    it('should accept comma-separated months', () => {
      expect(isCron('* * * 1,6,12 *')).toBe(true);
    });

    it('should accept month steps', () => {
      expect(isCron('* * * */3 *')).toBe(true);
      expect(isCron('* * * 1/2 *')).toBe(true);
    });
  });

  describe('day of week field (0-7)', () => {
    it('should accept valid day of week values', () => {
      expect(isCron('* * * * 0')).toBe(true); // Sunday
      expect(isCron('* * * * 3')).toBe(true); // Wednesday
      expect(isCron('* * * * 6')).toBe(true); // Saturday
      expect(isCron('* * * * 7')).toBe(true); // Sunday (alternative)
    });

    it('should reject invalid day of week values', () => {
      expect(isCron('* * * * 8')).toBe(false);
      expect(isCron('* * * * 100')).toBe(false);
    });

    it('should accept ? (no specific value)', () => {
      expect(isCron('* * * * ?')).toBe(true);
    });

    it('should accept day of week aliases by default', () => {
      expect(isCron('* * * * SUN')).toBe(true);
      expect(isCron('* * * * MON')).toBe(true);
      expect(isCron('* * * * TUE')).toBe(true);
      expect(isCron('* * * * WED')).toBe(true);
      expect(isCron('* * * * THU')).toBe(true);
      expect(isCron('* * * * FRI')).toBe(true);
      expect(isCron('* * * * SAT')).toBe(true);
    });

    it('should accept lowercase day aliases', () => {
      expect(isCron('* * * * sun')).toBe(true);
      expect(isCron('* * * * Mon')).toBe(true);
    });

    it('should reject day aliases when disabled', () => {
      expect(isCron('* * * * SUN', { alias: false })).toBe(false);
    });

    it('should accept day of week alias ranges', () => {
      expect(isCron('* * * * MON-FRI')).toBe(true);
      expect(isCron('* * * * SUN-SAT')).toBe(true);
    });

    it('should accept day of week ranges', () => {
      expect(isCron('* * * * 1-5')).toBe(true);
      expect(isCron('* * * * 0-6')).toBe(true);
    });

    it('should accept comma-separated days of week', () => {
      expect(isCron('* * * * 1,3,5')).toBe(true);
      expect(isCron('* * * * MON,WED,FRI')).toBe(true);
    });

    it('should accept day of week steps', () => {
      expect(isCron('* * * * */2')).toBe(true);
    });
  });

  describe('6-field cron with seconds', () => {
    it('should accept 6-field expressions with seconds option', () => {
      expect(isCron('* * * * * *', { seconds: true })).toBe(true);
      expect(isCron('0 * * * * *', { seconds: true })).toBe(true);
      expect(isCron('*/5 * * * * *', { seconds: true })).toBe(true);
    });

    it('should accept valid second values', () => {
      expect(isCron('0 * * * * *', { seconds: true })).toBe(true);
      expect(isCron('30 * * * * *', { seconds: true })).toBe(true);
      expect(isCron('59 * * * * *', { seconds: true })).toBe(true);
    });

    it('should reject invalid second values', () => {
      expect(isCron('60 * * * * *', { seconds: true })).toBe(false);
      expect(isCron('-1 * * * * *', { seconds: true })).toBe(false);
    });

    it('should accept second ranges and steps', () => {
      expect(isCron('0-30 * * * * *', { seconds: true })).toBe(true);
      expect(isCron('*/10 * * * * *', { seconds: true })).toBe(true);
      expect(isCron('0,15,30,45 * * * * *', { seconds: true })).toBe(true);
    });

    it('should reject 5-field expressions when seconds option is true', () => {
      expect(isCron('* * * * *', { seconds: true })).toBe(false);
    });

    it('should reject 6-field expressions when seconds option is false', () => {
      expect(isCron('* * * * * *', { seconds: false })).toBe(false);
      expect(isCron('* * * * * *')).toBe(false);
    });
  });

  describe('real-world cron expressions', () => {
    it('should validate common scheduling patterns', () => {
      // Every 5 minutes
      expect(isCron('*/5 * * * *')).toBe(true);

      // Every 15 minutes
      expect(isCron('*/15 * * * *')).toBe(true);

      // Every hour at minute 30
      expect(isCron('30 * * * *')).toBe(true);

      // Every day at 6:30 AM
      expect(isCron('30 6 * * *')).toBe(true);

      // Every Monday at 9 AM
      expect(isCron('0 9 * * 1')).toBe(true);

      // Every weekday at 9 AM
      expect(isCron('0 9 * * 1-5')).toBe(true);

      // First day of every month at midnight
      expect(isCron('0 0 1 * *')).toBe(true);

      // Every quarter (Jan, Apr, Jul, Oct) on the 1st
      expect(isCron('0 0 1 1,4,7,10 *')).toBe(true);

      // Christmas at noon
      expect(isCron('0 12 25 12 *')).toBe(true);

      // Every Sunday at 3 AM
      expect(isCron('0 3 * * 0')).toBe(true);

      // Twice daily at 6 AM and 6 PM
      expect(isCron('0 6,18 * * *')).toBe(true);

      // Business hours (9-5) every 30 mins on weekdays
      expect(isCron('0,30 9-17 * * 1-5')).toBe(true);
    });

    it('should validate expressions with aliases', () => {
      // Every January 1st at midnight
      expect(isCron('0 0 1 JAN *')).toBe(true);

      // Every Friday at 5 PM
      expect(isCron('0 17 * * FRI')).toBe(true);

      // Every weekday in summer months
      expect(isCron('0 9 * JUN-AUG MON-FRI')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle mixed case aliases', () => {
      expect(isCron('* * * Jan *')).toBe(true);
      expect(isCron('* * * JAN *')).toBe(true);
      expect(isCron('* * * jan *')).toBe(true);
    });

    it('should reject invalid aliases', () => {
      expect(isCron('* * * JANUARY *')).toBe(false);
      expect(isCron('* * * MONDAY *')).toBe(false);
      expect(isCron('* * * XYZ *')).toBe(false);
    });

    it('should handle leading zeros', () => {
      expect(isCron('00 00 01 01 00')).toBe(true);
      expect(isCron('05 09 15 06 03')).toBe(true);
    });

    it('should reject expressions with invalid characters', () => {
      expect(isCron('a * * * *')).toBe(false);
      expect(isCron('* b * * *')).toBe(false);
      expect(isCron('* * c * *')).toBe(false);
      expect(isCron('* * * @ *')).toBe(false);
      expect(isCron('* * * * #')).toBe(false);
    });

    it('should reject expressions with special characters in wrong positions', () => {
      expect(isCron('? * * * *')).toBe(false); // ? not valid for minute
      expect(isCron('* ? * * *')).toBe(false); // ? not valid for hour
    });

    it('should handle boundary values', () => {
      // Maximum valid values
      expect(isCron('59 23 31 12 7')).toBe(true);

      // Minimum valid values
      expect(isCron('0 0 1 1 0')).toBe(true);
    });
  });
});

describe('isStandardCron', () => {
  it('should validate 5-field expressions', () => {
    expect(isStandardCron('* * * * *')).toBe(true);
    expect(isStandardCron('0 0 * * *')).toBe(true);
  });

  it('should reject 6-field expressions', () => {
    expect(isStandardCron('* * * * * *')).toBe(false);
  });

  it('should reject non-string values', () => {
    expect(isStandardCron(null)).toBe(false);
    expect(isStandardCron(undefined)).toBe(false);
  });
});

describe('isExtendedCron', () => {
  it('should validate 6-field expressions with seconds', () => {
    expect(isExtendedCron('* * * * * *')).toBe(true);
    expect(isExtendedCron('0 0 0 * * *')).toBe(true);
  });

  it('should reject 5-field expressions', () => {
    expect(isExtendedCron('* * * * *')).toBe(false);
  });

  it('should reject non-string values', () => {
    expect(isExtendedCron(null)).toBe(false);
    expect(isExtendedCron(undefined)).toBe(false);
  });
});

describe('TypeScript type guard', () => {
  it('should narrow type correctly', () => {
    const value: unknown = '* * * * *';

    if (isCron(value)) {
      // TypeScript should recognize value as CronExpression (string)
      const cron: CronExpression = value;
      expect(typeof cron).toBe('string');
    }
  });
});

describe('options interface', () => {
  it('should accept valid options', () => {
    const options1: IsCronOptions = { seconds: true };
    const options2: IsCronOptions = { alias: false };
    const options3: IsCronOptions = { seconds: true, alias: false };
    const options4: IsCronOptions = {};

    expect(isCron('* * * * * *', options1)).toBe(true);
    expect(isCron('* * * * *', options2)).toBe(true);
    expect(isCron('* * * * * *', options3)).toBe(true);
    expect(isCron('* * * * *', options4)).toBe(true);
  });
});

// Additional edge case tests from cron-validate and cron-validator
describe('edge cases from other libraries', () => {
  describe('invalid syntax patterns', () => {
    it('should reject decimal numbers', () => {
      expect(isCron('0.1 1 1 1 1')).toBe(false);
      expect(isCron('1,1.5,2,2.5 1 1 1 1')).toBe(false);
      expect(isCron('*/1.5 * * * *')).toBe(false);
    });

    it('should reject negative step values', () => {
      expect(isCron('*/-1 * * * *')).toBe(false);
      expect(isCron('*/-5 * * * *')).toBe(false);
      expect(isCron('*/-1.5 * * * *')).toBe(false);
    });

    it('should reject invalid range syntax', () => {
      expect(isCron('7-5 * * * *')).toBe(false); // inverted range
      expect(isCron('1-2-3 * * * *')).toBe(false); // multiple dashes
      expect(isCron('1-* * * * *')).toBe(false); // wildcard in range
      expect(isCron('1- * * * *')).toBe(false); // incomplete range
      expect(isCron('* - * * *')).toBe(false); // isolated dash
    });

    it('should reject invalid step syntax', () => {
      expect(isCron('1/2/3 * * * *')).toBe(false); // multiple slashes
      expect(isCron('1/* * * * *')).toBe(false); // wildcard as step
      expect(isCron('1/0 * * * *')).toBe(false); // zero step
      expect(isCron('1/ * * * *')).toBe(false); // incomplete step
      expect(isCron('20-30/ * * * *')).toBe(false); // incomplete step after range
      expect(isCron('*/ * * * *')).toBe(false); // incomplete wildcard step
    });

    it('should reject wildcards mixed with numbers incorrectly', () => {
      expect(isCron('1* * * * *')).toBe(false);
      expect(isCron('*1 * * * *')).toBe(false);
      expect(isCron('* 1* * * *')).toBe(false);
      expect(isCron('* *1 * * *')).toBe(false);
    });

    it('should reject inverted ranges in all fields', () => {
      expect(isCron('10-1 * * * *')).toBe(false); // minute
      expect(isCron('* 20-11 * * *')).toBe(false); // hour
      expect(isCron('* * 30-21 * *')).toBe(false); // day of month
      expect(isCron('* * * 6-5 *')).toBe(false); // month
      expect(isCron('* * * * 4-3')).toBe(false); // day of week
    });

    it('should reject inverted ranges in seconds field', () => {
      expect(isCron('10-1 * * * * *', { seconds: true })).toBe(false);
      expect(isCron('20-11 * * * * *', { seconds: true })).toBe(false);
    });
  });

  describe('boundary values', () => {
    it('should reject out-of-range seconds', () => {
      expect(isCron('60 * * * * *', { seconds: true })).toBe(false);
    });

    it('should reject out-of-range minutes', () => {
      expect(isCron('60 * * * *')).toBe(false);
      expect(isCron('* 60 * * * *', { seconds: true })).toBe(false);
    });

    it('should reject out-of-range hours', () => {
      expect(isCron('* 24 * * *')).toBe(false);
    });

    it('should reject out-of-range days', () => {
      expect(isCron('* * 0 * *')).toBe(false);
      expect(isCron('* * 32 * *')).toBe(false);
    });

    it('should reject out-of-range months', () => {
      expect(isCron('* * * 0 *')).toBe(false);
      expect(isCron('* * * 13 *')).toBe(false);
    });

    it('should reject out-of-range weekdays', () => {
      expect(isCron('* * * * 8')).toBe(false);
    });

    it('should accept boundary values', () => {
      // Minimum values
      expect(isCron('0 0 1 1 0')).toBe(true);
      expect(isCron('0 0 0 1 1 0', { seconds: true })).toBe(true);

      // Maximum values
      expect(isCron('59 23 31 12 7')).toBe(true);
      expect(isCron('59 59 23 31 12 7', { seconds: true })).toBe(true);
    });
  });

  describe('complex expressions', () => {
    it('should validate complex range and step combinations', () => {
      expect(isCron('5-7 2-4/2 1,2-4,5-8,10-20/3,20-30/4 * *')).toBe(true);
      expect(isCron('5-7,8-9,10-20,21-23 * * * *')).toBe(true);
      expect(isCron('01,02,03 04,05,06 01 01 01')).toBe(true);
      expect(isCron('1,2,3 4,5,6 1 1 1')).toBe(true);
    });

    it('should validate multiple ranges', () => {
      expect(isCron('1-10,11-20,21-30 * * * *')).toBe(true);
      expect(isCron('* 1-10,11-20,21-23 * * *')).toBe(true);
      expect(isCron('* * 1-10,11-20,21-31 * *')).toBe(true);
      expect(isCron('* * * 1-2,3-4,5-6 *')).toBe(true);
      expect(isCron('* * * * 0-2,3-4,5-6')).toBe(true);
    });

    it('should validate ranges with steps', () => {
      expect(isCron('1-10/2,21-30/2 * * * *')).toBe(true);
      expect(isCron('* 1-10/2,11-20/2 * * *')).toBe(true);
      expect(isCron('* * 1-10/2,11-20/2 * *')).toBe(true);
      expect(isCron('* * * 1-2/2,3-4/2 *')).toBe(true);
      expect(isCron('* * * * 0-2/2,3-4/2')).toBe(true);
    });

    it('should validate mixed range and wildcard steps', () => {
      expect(isCron('1-10,*/2 * * * *')).toBe(true);
      expect(isCron('* 1-10,*/2 * * *')).toBe(true);
      expect(isCron('* * 1-10,*/2 * *')).toBe(true);
      expect(isCron('* * * 1-2,*/2 *')).toBe(true);
      expect(isCron('* * * * 0-2,*/2')).toBe(true);
    });

    it('should validate complex 6-field expressions', () => {
      expect(isCron('1-10,11-20,21-30 * * * * *', { seconds: true })).toBe(true);
      expect(isCron('1-10/2,21-30/2 * * * * *', { seconds: true })).toBe(true);
      expect(isCron('1-10,*/2 * * * * *', { seconds: true })).toBe(true);
      expect(isCron('2 0 */4 * 1 6', { seconds: true })).toBe(true);
    });
  });

  describe('alias edge cases', () => {
    it('should handle comma-separated aliases', () => {
      expect(isCron('* * * jan,JAN *')).toBe(true);
      expect(isCron('* * * feb,FEB *')).toBe(true);
      expect(isCron('* * * * sun,SUN')).toBe(true);
      expect(isCron('* * * * mon,MON')).toBe(true);
    });

    it('should reject invalid full month names', () => {
      expect(isCron('* * * january *')).toBe(false);
      expect(isCron('* * * february *')).toBe(false);
    });

    it('should reject invalid full day names', () => {
      expect(isCron('* * * * sunday')).toBe(false);
      expect(isCron('* * * * monday')).toBe(false);
    });

    it('should reject aliases used as step values', () => {
      expect(isCron('* * * */jan *')).toBe(false);
      expect(isCron('* * * * */sun')).toBe(false);
    });
  });

  describe('whitespace handling', () => {
    it('should handle various whitespace patterns', () => {
      expect(isCron(' * * * * * ')).toBe(true);
      expect(isCron('  *  *  *  *  *  ')).toBe(true);
      expect(isCron('\t* * * * *')).toBe(true);
      expect(isCron('* * * * *\t')).toBe(true);
    });
  });

  describe('question mark usage', () => {
    it('should accept question marks in day fields', () => {
      expect(isCron('* * ? * *')).toBe(true);
      expect(isCron('* * * * ?')).toBe(true);
    });

    it('should reject question marks in non-day fields', () => {
      expect(isCron('? * * * *')).toBe(false); // minute
      expect(isCron('* ? * * *')).toBe(false); // hour
      expect(isCron('* * * ? *')).toBe(false); // month
    });

    it('should accept question marks in 6-field format', () => {
      expect(isCron('* * * ? * *', { seconds: true })).toBe(true);
      expect(isCron('* * * * * ?', { seconds: true })).toBe(true);
    });
  });

  describe('numbers with leading zeros', () => {
    it('should accept various leading zero patterns', () => {
      expect(isCron('05 05 * * *')).toBe(true);
      expect(isCron('00 00 01 01 00')).toBe(true);
      expect(isCron('01 02 03 04 05')).toBe(true);
    });
  });

  describe('Sunday representation (0 and 7)', () => {
    it('should accept both 0 and 7 as Sunday', () => {
      expect(isCron('* * * * 0')).toBe(true);
      expect(isCron('* * * * 7')).toBe(true);
    });

    it('should accept ranges including 7', () => {
      expect(isCron('* * * * 0-6')).toBe(true);
      expect(isCron('* * * * 1-7')).toBe(true);
      expect(isCron('* * * * 0-7')).toBe(true);
    });
  });

  describe('malformed expressions from other libraries', () => {
    it('should reject expressions with invalid characters', () => {
      expect(isCron('A 1 2 3 4')).toBe(false);
      expect(isCron('990 14 * * mon-fri0345345')).toBe(false);
    });

    it('should reject expressions with too few fields', () => {
      expect(isCron('* * * 1')).toBe(false); // only 4 fields
    });

    it('should reject invalid hour 24', () => {
      expect(isCron('0 24 1 12 0')).toBe(false);
    });

    it('should reject invalid second 90', () => {
      expect(isCron('90 * * * * *', { seconds: true })).toBe(false);
    });
  });

  describe('ranges with steps in different fields', () => {
    it('should validate step ranges in minute field', () => {
      expect(isCron('0-12/4 * * * *')).toBe(true);
      expect(isCron('4-59/2 * * * *')).toBe(true);
      expect(isCron('4-59/3 * * * *')).toBe(true);
    });

    it('should validate step ranges in hour field', () => {
      expect(isCron('* 0-12/2 * * *')).toBe(true);
      expect(isCron('* 8-18/2 * * *')).toBe(true);
    });

    it('should validate step ranges in day of month field', () => {
      expect(isCron('* * 1-15/3 * *')).toBe(true);
      expect(isCron('* * 1-31/5 * *')).toBe(true);
    });

    it('should validate step ranges in month field', () => {
      expect(isCron('* * * 1-12/2 *')).toBe(true);
      expect(isCron('* * * 1-6/2 *')).toBe(true);
    });

    it('should validate step ranges in day of week field', () => {
      expect(isCron('* * * * 0-6/2')).toBe(true);
      expect(isCron('* * * * 1-5/2')).toBe(true);
    });
  });

  describe('mixed numeric values and CSV patterns', () => {
    it('should validate multiple specific hours', () => {
      expect(isCron('* 20,21,22 * * *')).toBe(true);
      expect(isCron('* 20,22 * * *')).toBe(true);
      expect(isCron('* 0,6,12,18 * * *')).toBe(true);
    });

    it('should validate mixed ranges and specific values', () => {
      expect(isCron('0,15,30,45 9-17 * * 1-5')).toBe(true);
      expect(isCron('*/15 9,12,15,18 * * *')).toBe(true);
    });
  });

  describe('empty and whitespace edge cases', () => {
    it('should reject fields with only separators', () => {
      expect(isCron(', * * * *')).toBe(false);
      expect(isCron('* , * * *')).toBe(false);
      expect(isCron('* * , * *')).toBe(false);
    });

    it('should reject trailing/leading commas', () => {
      expect(isCron(',1 * * * *')).toBe(false);
      expect(isCron('1, * * * *')).toBe(false);
      expect(isCron('1,,2 * * * *')).toBe(false);
    });
  });

  describe('special number edge cases', () => {
    it('should handle single digit vs double digit consistency', () => {
      expect(isCron('1 1 1 1 1')).toBe(true);
      expect(isCron('01 01 01 01 01')).toBe(true);
      expect(isCron('9 9 9 9 0')).toBe(true);
      expect(isCron('09 09 09 09 00')).toBe(true);
    });

    it('should reject numbers with invalid leading characters', () => {
      expect(isCron('+1 * * * *')).toBe(false);
      expect(isCron('* * * * +0')).toBe(false);
    });
  });
});
