/**
 * World-Class Ethiopian (Ge'ez) Calendar Engine
 * Provides mathematically accurate bidirectional conversion between Gregorian and Ethiopian Calendars,
 * accounting for 13-month structures, Pagume leap calculations, and school academic term mapping.
 */

export interface EthiopicDate {
  year: number;
  month: number; // 1 to 13
  day: number;   // 1 to 30 (or 1 to 5/6 for Pagume)
  monthNameAmharic: string;
  monthNameOromo: string;
  formattedDateAmharic: string;
  academicTerm: 'TERM_1' | 'TERM_2' | 'TERM_3' | 'SUMMER_BREAK';
}

export const ETHIOPIC_MONTHS = [
  { index: 1, amharic: 'መስከረም', oromo: 'Fulbaana', english: 'Meskerem' },
  { index: 2, amharic: 'ጥቅምት', oromo: 'Onkololeessa', english: 'Tikimt' },
  { index: 3, amharic: 'ኅዳር', oromo: 'Sadaasa', english: 'Hidar' },
  { index: 4, amharic: 'ታኅሣሥ', oromo: 'Muddee', english: 'Tahsas' },
  { index: 5, amharic: 'ጥር', oromo: 'Amajjii', english: 'Tir' },
  { index: 6, amharic: 'የካቲት', oromo: 'Guraandhala', english: 'Yakatit' },
  { index: 7, amharic: 'መጋቢት', oromo: 'Bitooteessa', english: 'Magabit' },
  { index: 8, amharic: 'ሚያዝያ', oromo: 'Ebla', english: 'Miazia' },
  { index: 9, amharic: 'ግንቦት', oromo: 'Caamsaa', english: 'Ginbot' },
  { index: 10, amharic: 'ሰኔ', oromo: 'Waxabajjii', english: 'Sene' },
  { index: 11, amharic: 'ሐምሌ', oromo: 'Adooleessa', english: 'Hamle' },
  { index: 12, amharic: 'ነሐሴ', oromo: 'Hagayya', english: 'Nehase' },
  { index: 13, amharic: 'ጳጉሜ', oromo: 'Qammee', english: 'Pagume' },
];

export class EthiopianCalendarService {
  /**
   * Determine if an Ethiopian year is a leap year (Pagume has 6 days instead of 5)
   * The Ethiopian leap year occurs every 4 years when (year % 4 === 3).
   */
  static isEthiopicLeapYear(year: number): boolean {
    return (year % 4) === 3;
  }

  /**
   * Convert Gregorian Date to Ethiopian (Ge'ez) Calendar Date
   * Uses astronomical Julian Day Number (JDN) offset algorithm for exact accuracy.
   */
  static gregorianToEthiopic(date: Date): EthiopicDate {
    const gy = date.getUTCFullYear();
    const gm = date.getUTCMonth() + 1;
    const gd = date.getUTCDate();

    // 1. Calculate Julian Day Number from Gregorian
    const a = Math.floor((14 - gm) / 12);
    const y = gy + 4800 - a;
    const m = gm + 12 * a - 3;
    const jdn = gd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

    // 2. Convert JDN to Ethiopic Date
    // Ethiopian Calendar epoch in JDN = 1723856 (August 29, 8 AD Julian)
    const ethiopicEpoch = 1723856;
    const r = (jdn - ethiopicEpoch) % 1461;
    const n = (r % 365) + 365 * Math.floor(r / 1460);

    const year = 4 * Math.floor((jdn - ethiopicEpoch) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
    const month = Math.floor(n / 30) + 1;
    const day = (n % 30) + 1;

    const monthObj = ETHIOPIC_MONTHS[Math.min(12, month - 1)];

    // 3. Determine Academic Term in Ethiopian School System
    let academicTerm: EthiopicDate['academicTerm'] = 'TERM_1';
    if (month >= 1 && month <= 3) {
      academicTerm = 'TERM_1'; // Meskerem - Hidar
    } else if (month >= 4 && month <= 7) {
      academicTerm = 'TERM_2'; // Tahsas - Magabit
    } else if (month >= 8 && month <= 10) {
      academicTerm = 'TERM_3'; // Miazia - Sene
    } else {
      academicTerm = 'SUMMER_BREAK'; // Hamle - Pagume
    }

    return {
      year,
      month,
      day,
      monthNameAmharic: monthObj.amharic,
      monthNameOromo: monthObj.oromo,
      formattedDateAmharic: `${monthObj.amharic} ${day} ቀን ${year} ዓ.ም`,
      academicTerm,
    };
  }

  /**
   * Convert Ethiopian (Ge'ez) Date to Gregorian Date
   */
  static ethiopicToGregorian(year: number, month: number, day: number): Date {
    const ethiopicEpoch = 1723856;
    const jdn = (ethiopicEpoch + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day) - 1;

    // Convert JDN to Gregorian
    const l = jdn + 68569;
    const n = Math.floor((4 * l) / 146097);
    const l2 = l - Math.floor((146097 * n + 3) / 4);
    const i = Math.floor((4000 * (l2 + 1)) / 1461001);
    const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
    const j = Math.floor((80 * l3) / 2447);
    const gd = l3 - Math.floor((2447 * j) / 80);
    const l4 = Math.floor(j / 11);
    const gm = j + 2 - 12 * l4;
    const gy = 100 * (n - 49) + i + l4;

    return new Date(Date.UTC(gy, gm - 1, gd));
  }
}
