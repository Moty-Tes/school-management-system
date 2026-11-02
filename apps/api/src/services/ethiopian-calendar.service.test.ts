import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { EthiopianCalendarService, ETHIOPIC_MONTHS } from './ethiopian-calendar.service.js';

describe('Ethiopian Calendar Engine Test Suite', () => {
  describe('Month Catalog & Structure', () => {
    test('contains exactly 13 months with accurate Amharic and Oromo names', () => {
      assert.strictEqual(ETHIOPIC_MONTHS.length, 13);
      assert.strictEqual(ETHIOPIC_MONTHS[0].amharic, 'መስከረም');
      assert.strictEqual(ETHIOPIC_MONTHS[0].english, 'Meskerem');
      assert.strictEqual(ETHIOPIC_MONTHS[12].amharic, 'ጳጉሜ');
      assert.strictEqual(ETHIOPIC_MONTHS[12].english, 'Pagume');
    });
  });

  describe('Leap Year Calculations', () => {
    test('accurately identifies Ethiopian leap years (year % 4 === 3)', () => {
      // 2011 % 4 = 3 (Leap year)
      assert.strictEqual(EthiopianCalendarService.isEthiopicLeapYear(2011), true);
      // 2015 % 4 = 3 (Leap year)
      assert.strictEqual(EthiopianCalendarService.isEthiopicLeapYear(2015), true);
      // 2016 % 4 = 0 (Standard year)
      assert.strictEqual(EthiopianCalendarService.isEthiopicLeapYear(2016), false);
      // 2017 % 4 = 1 (Standard year)
      assert.strictEqual(EthiopianCalendarService.isEthiopicLeapYear(2017), false);
    });
  });

  describe('Gregorian to Ethiopic Date Conversion', () => {
    test('converts September 11, 2024 to Meskerem 1, 2017 (Ethiopian New Year)', () => {
      const gDate = new Date(Date.UTC(2024, 8, 11)); // Month index 8 is September
      const ethDate = EthiopianCalendarService.gregorianToEthiopic(gDate);

      assert.strictEqual(ethDate.year, 2017);
      assert.strictEqual(ethDate.month, 1);
      assert.strictEqual(ethDate.day, 1);
      assert.strictEqual(ethDate.monthNameAmharic, 'መስከረም');
      assert.strictEqual(ethDate.academicTerm, 'TERM_1');
    });

    test('converts January 7, 2025 to Tahsas 29, 2017 (Ethiopian Christmas / Genna)', () => {
      const gDate = new Date(Date.UTC(2025, 0, 7)); // January 7, 2025
      const ethDate = EthiopianCalendarService.gregorianToEthiopic(gDate);

      assert.strictEqual(ethDate.year, 2017);
      assert.strictEqual(ethDate.month, 4); // Tahsas
      assert.strictEqual(ethDate.day, 29);
      assert.strictEqual(ethDate.monthNameAmharic, 'ታኅሣሥ');
      assert.strictEqual(ethDate.academicTerm, 'TERM_2');
    });

    test('accurately maps academic terms across the school year', () => {
      // Month 1-4: TERM_1
      const octDate = new Date(Date.UTC(2024, 9, 15));
      assert.strictEqual(EthiopianCalendarService.gregorianToEthiopic(octDate).academicTerm, 'TERM_1');

      // Month 5-8: TERM_2
      const febDate = new Date(Date.UTC(2025, 1, 15));
      assert.strictEqual(EthiopianCalendarService.gregorianToEthiopic(febDate).academicTerm, 'TERM_2');

      // Month 9-10: TERM_3
      const mayDate = new Date(Date.UTC(2025, 4, 15));
      assert.strictEqual(EthiopianCalendarService.gregorianToEthiopic(mayDate).academicTerm, 'TERM_3');

      // Month 11-13 (Summer): SUMMER_BREAK
      const julDate = new Date(Date.UTC(2025, 6, 25));
      assert.strictEqual(EthiopianCalendarService.gregorianToEthiopic(julDate).academicTerm, 'SUMMER_BREAK');
    });
  });
});
