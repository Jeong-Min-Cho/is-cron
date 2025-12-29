# is-cron

> Check if a string is a valid cron expression

[![npm version](https://img.shields.io/npm/v/is-cron.svg)](https://www.npmjs.com/package/is-cron)
[![npm downloads](https://img.shields.io/npm/dm/is-cron.svg)](https://www.npmjs.com/package/is-cron)
[![bundle size](https://img.shields.io/bundlephobia/minzip/is-cron)](https://bundlephobia.com/package/is-cron)
[![license](https://img.shields.io/npm/l/is-cron.svg)](https://github.com/Jeong-Min-Cho/is-cron/blob/main/LICENSE)

A tiny, zero-dependency cron expression validator with TypeScript support.

## Features

- **Zero dependencies** - No bloat, no security risks
- **Tiny bundle** - Less than 1KB minified + gzipped
- **TypeScript first** - Full type definitions with type guards
- **ESM & CJS** - Works everywhere
- **Standard & extended cron** - Supports 5-field and 6-field (with seconds) formats
- **Aliases** - Supports month (JAN-DEC) and day (SUN-SAT) aliases
- **Well tested** - 100+ test cases covering edge cases from popular cron libraries

## Installation

```bash
npm install is-cron
```

```bash
yarn add is-cron
```

```bash
pnpm add is-cron
```

## Usage

```typescript
import isCron from 'is-cron';

// Standard 5-field cron expressions
isCron('* * * * *');           // true - every minute
isCron('0 0 * * *');           // true - daily at midnight
isCron('*/15 * * * *');        // true - every 15 minutes
isCron('0 9-17 * * 1-5');      // true - hourly 9-5 on weekdays
isCron('0 0 1 JAN *');         // true - midnight on January 1st
isCron('0 17 * * FRI');        // true - every Friday at 5 PM

// Invalid expressions
isCron('invalid');             // false
isCron('60 * * * *');          // false - minute out of range
isCron('* * * * * *');         // false - 6 fields without seconds option
```

### With Seconds (6-field format)

```typescript
import isCron from 'is-cron';

// Enable 6-field format with seconds
isCron('* * * * * *', { seconds: true });     // true
isCron('0 * * * * *', { seconds: true });     // true - every minute at second 0
isCron('*/5 * * * * *', { seconds: true });   // true - every 5 seconds
```

### Disable Aliases

```typescript
import isCron from 'is-cron';

// Aliases enabled by default
isCron('0 0 * JAN *');                   // true
isCron('0 0 * * MON');                   // true

// Disable aliases for stricter validation
isCron('0 0 * JAN *', { alias: false }); // false
isCron('0 0 * 1 *', { alias: false });   // true
```

### Helper Functions

```typescript
import { isStandardCron, isExtendedCron } from 'is-cron';

// Standard 5-field cron
isStandardCron('* * * * *');     // true
isStandardCron('* * * * * *');   // false

// Extended 6-field cron with seconds
isExtendedCron('* * * * * *');   // true
isExtendedCron('* * * * *');     // false
```

### TypeScript Type Guard

```typescript
import isCron, { type CronExpression } from 'is-cron';

function scheduleJob(cron: CronExpression) {
  // ...
}

const userInput: unknown = getUserInput();

if (isCron(userInput)) {
  // TypeScript knows userInput is a valid CronExpression
  scheduleJob(userInput);
}
```

## API

### `isCron(value, options?)`

Check if a value is a valid cron expression.

#### Parameters

- `value` - The value to check (any type)
- `options` - Optional configuration object
  - `seconds` (boolean, default: `false`) - Enable 6-field format with seconds
  - `alias` (boolean, default: `true`) - Allow month/day aliases (JAN-DEC, SUN-SAT)

#### Returns

`boolean` - `true` if the value is a valid cron expression

### `isStandardCron(value)`

Check if a value is a valid standard 5-field cron expression.

### `isExtendedCron(value)`

Check if a value is a valid 6-field cron expression with seconds.

## Cron Expression Format

### Standard 5-field format

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12 or JAN-DEC)
│ │ │ │ ┌───────────── day of week (0-7 or SUN-SAT, 0 and 7 are Sunday)
│ │ │ │ │
* * * * *
```

### Extended 6-field format (with seconds)

```
┌───────────── second (0-59)
│ ┌───────────── minute (0-59)
│ │ ┌───────────── hour (0-23)
│ │ │ ┌───────────── day of month (1-31)
│ │ │ │ ┌───────────── month (1-12 or JAN-DEC)
│ │ │ │ │ ┌───────────── day of week (0-7 or SUN-SAT)
│ │ │ │ │ │
* * * * * *
```

### Supported syntax

| Syntax | Description | Example |
|--------|-------------|---------|
| `*` | Any value | `* * * * *` |
| `,` | List separator | `1,15 * * * *` |
| `-` | Range | `1-5 * * * *` |
| `/` | Step | `*/15 * * * *` |
| `?` | No specific value (day of month/week only) | `0 0 ? * MON` |

## License

Apache-2.0
