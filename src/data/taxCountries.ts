export type TaxSystem = 'GST' | 'VAT' | 'SALES_TAX' | 'NONE';

export interface CountryTaxConfig {
  countryCode: string;
  countryName: string;
  flag: string;
  taxSystem: TaxSystem;
  taxName: string;
  taxIdLabel: string;
  taxIdPlaceholder: string;
  currencyCode: string;
  currencySymbol: string;
  standardTaxRate: number;
  taxRates: number[];
  hasSubTaxes: boolean;
  subTaxLabels?: { intraState: string[]; interState: string };
  description: string;
}

export const TAX_COUNTRIES: CountryTaxConfig[] = [
  {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    taxSystem: 'GST',
    taxName: 'GST',
    taxIdLabel: 'GSTIN',
    taxIdPlaceholder: '15-digit GSTIN (e.g. 29ABCDE1234F1Z5)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    standardTaxRate: 18,
    taxRates: [0, 5, 12, 18, 28],
    hasSubTaxes: true,
    subTaxLabels: { intraState: ['CGST', 'SGST'], interState: 'IGST' },
    description: 'Goods and Services Tax (Dual GST with CGST/SGST for intra-state and IGST for inter-state)'
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'VAT Reg No',
    taxIdPlaceholder: 'GB 123 4567 89 (9 or 12 digits)',
    currencyCode: 'GBP',
    currencySymbol: '£',
    standardTaxRate: 20,
    taxRates: [0, 5, 20],
    hasSubTaxes: false,
    description: 'UK Value Added Tax (HMRC standard 20%, reduced 5%, zero-rated 0%)'
  },
  {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'TRN (Tax Reg No)',
    taxIdPlaceholder: '15-digit TRN (e.g. 100xxxxxxxxxx03)',
    currencyCode: 'AED',
    currencySymbol: 'AED',
    standardTaxRate: 5,
    taxRates: [0, 5],
    hasSubTaxes: false,
    description: 'UAE Federal Tax Authority (FTA standard 5% VAT, zero-rated 0%)'
  },
  {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    flag: '🇸🇦',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'VAT / TRN No',
    taxIdPlaceholder: '15-digit ZATCA VAT (e.g. 300xxxxxxxxxx03)',
    currencyCode: 'SAR',
    currencySymbol: 'SAR',
    standardTaxRate: 15,
    taxRates: [0, 15],
    hasSubTaxes: false,
    description: 'ZATCA Value Added Tax (Standard 15% VAT)'
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    taxSystem: 'SALES_TAX',
    taxName: 'Sales Tax',
    taxIdLabel: 'Tax ID / EIN',
    taxIdPlaceholder: 'XX-XXXXXXX (9-digit Federal EIN)',
    currencyCode: 'USD',
    currencySymbol: '$',
    standardTaxRate: 8.25,
    taxRates: [0, 4, 6, 7.5, 8.25, 10],
    hasSubTaxes: false,
    description: 'US State & Local Sales Tax'
  },
  {
    countryCode: 'SG',
    countryName: 'Singapore',
    flag: '🇸🇬',
    taxSystem: 'GST',
    taxName: 'GST',
    taxIdLabel: 'GST Reg No',
    taxIdPlaceholder: 'e.g. M90000000X',
    currencyCode: 'SGD',
    currencySymbol: 'S$',
    standardTaxRate: 9,
    taxRates: [0, 9],
    hasSubTaxes: false,
    description: 'Inland Revenue Authority of Singapore (IRAS standard 9% GST)'
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    taxSystem: 'GST',
    taxName: 'GST',
    taxIdLabel: 'ABN / GST No',
    taxIdPlaceholder: '11-digit ABN (e.g. 12 345 678 901)',
    currencyCode: 'AUD',
    currencySymbol: 'A$',
    standardTaxRate: 10,
    taxRates: [0, 10],
    hasSubTaxes: false,
    description: 'Australian Taxation Office (ATO standard 10% GST)'
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    taxSystem: 'GST',
    taxName: 'GST / HST',
    taxIdLabel: 'GST / HST No',
    taxIdPlaceholder: '9-digit BN + RT0001 (e.g. 123456789 RT0001)',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    standardTaxRate: 13,
    taxRates: [0, 5, 13, 15],
    hasSubTaxes: false,
    description: 'Canada Revenue Agency (CRA 5% GST, or 13-15% Harmonized Sales Tax HST)'
  },
  {
    countryCode: 'DE',
    countryName: 'Germany',
    flag: '🇩🇪',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'USt-IdNr / VAT ID',
    taxIdPlaceholder: 'DE 123456789',
    currencyCode: 'EUR',
    currencySymbol: '€',
    standardTaxRate: 19,
    taxRates: [0, 7, 19],
    hasSubTaxes: false,
    description: 'German Value Added Tax (Umsatzsteuer / MwSt standard 19%, reduced 7%)'
  },
  {
    countryCode: 'FR',
    countryName: 'France',
    flag: '🇫🇷',
    taxSystem: 'VAT',
    taxName: 'TVA (VAT)',
    taxIdLabel: 'Numéro de TVA',
    taxIdPlaceholder: 'FR XX 123456789',
    currencyCode: 'EUR',
    currencySymbol: '€',
    standardTaxRate: 20,
    taxRates: [0, 5.5, 10, 20],
    hasSubTaxes: false,
    description: 'French Value Added Tax (TVA standard 20%, intermediate 10%, reduced 5.5%)'
  },
  {
    countryCode: 'QA',
    countryName: 'Qatar',
    flag: '🇶🇦',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'Tax Identification No (TIN)',
    taxIdPlaceholder: '10-digit TIN',
    currencyCode: 'QAR',
    currencySymbol: 'QAR',
    standardTaxRate: 5,
    taxRates: [0, 5],
    hasSubTaxes: false,
    description: 'General Tax Authority (Standard 5% VAT)'
  },
  {
    countryCode: 'KW',
    countryName: 'Kuwait',
    flag: '🇰🇼',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'Tax Registration No',
    taxIdPlaceholder: 'Tax ID Number',
    currencyCode: 'KWD',
    currencySymbol: 'KD',
    standardTaxRate: 5,
    taxRates: [0, 5],
    hasSubTaxes: false,
    description: 'Kuwait Ministry of Finance Tax Authority'
  },
  {
    countryCode: 'OM',
    countryName: 'Oman',
    flag: '🇴🇲',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'VAT Identification No',
    taxIdPlaceholder: 'OM 12345678',
    currencyCode: 'OMR',
    currencySymbol: 'OMR',
    standardTaxRate: 5,
    taxRates: [0, 5],
    hasSubTaxes: false,
    description: 'Oman Tax Authority (Standard 5% VAT)'
  },
  {
    countryCode: 'BH',
    countryName: 'Bahrain',
    flag: '🇧🇭',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'VAT Account No',
    taxIdPlaceholder: '15-digit VAT Account (e.g. 200xxxxxxxxxx00)',
    currencyCode: 'BHD',
    currencySymbol: 'BD',
    standardTaxRate: 10,
    taxRates: [0, 5, 10],
    hasSubTaxes: false,
    description: 'National Bureau for Revenue (NBR standard 10% VAT, reduced 5%)'
  },
  {
    countryCode: 'NP',
    countryName: 'Nepal',
    flag: '🇳🇵',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'PAN / VAT No',
    taxIdPlaceholder: '9-digit PAN (e.g. 123456789)',
    currencyCode: 'NPR',
    currencySymbol: 'NPR',
    standardTaxRate: 13,
    taxRates: [0, 13],
    hasSubTaxes: false,
    description: 'Inland Revenue Department of Nepal (Standard 13% VAT)'
  },
  {
    countryCode: 'BD',
    countryName: 'Bangladesh',
    flag: '🇧🇩',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'BIN / VAT Reg No',
    taxIdPlaceholder: '9-digit BIN (e.g. 000123456-0101)',
    currencyCode: 'BDT',
    currencySymbol: '৳',
    standardTaxRate: 15,
    taxRates: [0, 5, 7.5, 10, 15],
    hasSubTaxes: false,
    description: 'National Board of Revenue (NBR standard 15% VAT)'
  },
  {
    countryCode: 'MY',
    countryName: 'Malaysia',
    flag: '🇲🇾',
    taxSystem: 'SALES_TAX',
    taxName: 'SST (Sales & Service Tax)',
    taxIdLabel: 'SST Reg No',
    taxIdPlaceholder: 'e.g. W10-1808-12345678',
    currencyCode: 'MYR',
    currencySymbol: 'RM',
    standardTaxRate: 8,
    taxRates: [0, 6, 8, 10],
    hasSubTaxes: false,
    description: 'Royal Malaysian Customs (SST standard rates 6% / 8% / 10%)'
  },
  {
    countryCode: 'ZA',
    countryName: 'South Africa',
    flag: '🇿🇦',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'VAT Reg No',
    taxIdPlaceholder: '10-digit VAT number (e.g. 4123456789)',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    standardTaxRate: 15,
    taxRates: [0, 15],
    hasSubTaxes: false,
    description: 'South African Revenue Service (SARS standard 15% VAT)'
  },
  {
    countryCode: 'PK',
    countryName: 'Pakistan',
    flag: '🇵🇰',
    taxSystem: 'SALES_TAX',
    taxName: 'Sales Tax',
    taxIdLabel: 'STRN / NTN',
    taxIdPlaceholder: '13-digit STRN (e.g. 12-34-5678-901-23)',
    currencyCode: 'PKR',
    currencySymbol: '₨',
    standardTaxRate: 18,
    taxRates: [0, 5, 10, 18],
    hasSubTaxes: false,
    description: 'Federal Board of Revenue (FBR standard 18% Sales Tax / Federal Excise)'
  },
  {
    countryCode: 'LK',
    countryName: 'Sri Lanka',
    flag: '🇱🇰',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'VAT Reg No / TIN',
    taxIdPlaceholder: '9-digit TIN / VAT',
    currencyCode: 'LKR',
    currencySymbol: 'Rs',
    standardTaxRate: 18,
    taxRates: [0, 18],
    hasSubTaxes: false,
    description: 'Inland Revenue Department (IRD standard 18% VAT)'
  },
  {
    countryCode: 'IT',
    countryName: 'Italy',
    flag: '🇮🇹',
    taxSystem: 'VAT',
    taxName: 'IVA (VAT)',
    taxIdLabel: 'Partita IVA',
    taxIdPlaceholder: 'IT 12345678901 (11 digits)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    standardTaxRate: 22,
    taxRates: [0, 4, 5, 10, 22],
    hasSubTaxes: false,
    description: 'Italian Value Added Tax (IVA standard 22%, reduced 10% / 5% / 4%)'
  },
  {
    countryCode: 'ES',
    countryName: 'Spain',
    flag: '🇪🇸',
    taxSystem: 'VAT',
    taxName: 'IVA (VAT)',
    taxIdLabel: 'NIF / CIF (VAT No)',
    taxIdPlaceholder: 'ES X1234567X',
    currencyCode: 'EUR',
    currencySymbol: '€',
    standardTaxRate: 21,
    taxRates: [0, 4, 10, 21],
    hasSubTaxes: false,
    description: 'Agencia Tributaria (IVA standard 21%, reduced 10%, super-reduced 4%)'
  },
  {
    countryCode: 'NL',
    countryName: 'Netherlands',
    flag: '🇳🇱',
    taxSystem: 'VAT',
    taxName: 'BTW (VAT)',
    taxIdLabel: 'BTW-identificatienummer',
    taxIdPlaceholder: 'NL 123456789B01',
    currencyCode: 'EUR',
    currencySymbol: '€',
    standardTaxRate: 21,
    taxRates: [0, 9, 21],
    hasSubTaxes: false,
    description: 'Belastingdienst (BTW standard 21%, reduced 9%)'
  },
  {
    countryCode: 'IE',
    countryName: 'Ireland',
    flag: '🇮🇪',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'VAT Number',
    taxIdPlaceholder: 'IE 1234567T',
    currencyCode: 'EUR',
    currencySymbol: '€',
    standardTaxRate: 23,
    taxRates: [0, 9, 13.5, 23],
    hasSubTaxes: false,
    description: 'Revenue Commissioners (Standard 23%, reduced 13.5% / 9%)'
  },
  {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    flag: '🇳🇿',
    taxSystem: 'GST',
    taxName: 'GST',
    taxIdLabel: 'GST / IRD Number',
    taxIdPlaceholder: '8 or 9 digit IRD (e.g. 123-456-789)',
    currencyCode: 'NZD',
    currencySymbol: 'NZ$',
    standardTaxRate: 15,
    taxRates: [0, 15],
    hasSubTaxes: false,
    description: 'Inland Revenue (IRD standard 15% GST)'
  },
  {
    countryCode: 'JP',
    countryName: 'Japan',
    flag: '🇯🇵',
    taxSystem: 'VAT',
    taxName: 'JCT (Consumption Tax)',
    taxIdLabel: 'JCT Invoice Reg No',
    taxIdPlaceholder: 'T1234567890123 (13 digits)',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    standardTaxRate: 10,
    taxRates: [0, 8, 10],
    hasSubTaxes: false,
    description: 'National Tax Agency (Standard 10% JCT, reduced 8%)'
  },
  {
    countryCode: 'NG',
    countryName: 'Nigeria',
    flag: '🇳🇬',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'Tax Identification Number (TIN)',
    taxIdPlaceholder: '10-digit TIN',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    standardTaxRate: 7.5,
    taxRates: [0, 7.5],
    hasSubTaxes: false,
    description: 'Federal Inland Revenue Service (FIRS standard 7.5% VAT)'
  },
  {
    countryCode: 'KE',
    countryName: 'Kenya',
    flag: '🇰🇪',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'KRA PIN',
    taxIdPlaceholder: '11-character PIN (e.g. A012345678X)',
    currencyCode: 'KES',
    currencySymbol: 'KSh',
    standardTaxRate: 16,
    taxRates: [0, 8, 16],
    hasSubTaxes: false,
    description: 'Kenya Revenue Authority (Standard 16% VAT, petroleum 8%)'
  },
  {
    countryCode: 'EG',
    countryName: 'Egypt',
    flag: '🇪🇬',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'Tax Registration No (TRN)',
    taxIdPlaceholder: '9-digit TRN (e.g. 123-456-789)',
    currencyCode: 'EGP',
    currencySymbol: 'E£',
    standardTaxRate: 14,
    taxRates: [0, 5, 14],
    hasSubTaxes: false,
    description: 'Egyptian Tax Authority (Standard 14% VAT)'
  },
  {
    countryCode: 'PH',
    countryName: 'Philippines',
    flag: '🇵🇭',
    taxSystem: 'VAT',
    taxName: 'VAT',
    taxIdLabel: 'TIN (Taxpayer Identification No)',
    taxIdPlaceholder: '9 to 12 digit TIN (e.g. 123-456-789-000)',
    currencyCode: 'PHP',
    currencySymbol: '₱',
    standardTaxRate: 12,
    taxRates: [0, 12],
    hasSubTaxes: false,
    description: 'Bureau of Internal Revenue (BIR standard 12% VAT)'
  },
  {
    countryCode: 'ID',
    countryName: 'Indonesia',
    flag: '🇮🇩',
    taxSystem: 'VAT',
    taxName: 'PPN (VAT)',
    taxIdLabel: 'NPWP (Tax ID Number)',
    taxIdPlaceholder: '16-digit NPWP (e.g. 01.234.567.8-901.000)',
    currencyCode: 'IDR',
    currencySymbol: 'Rp',
    standardTaxRate: 11,
    taxRates: [0, 11],
    hasSubTaxes: false,
    description: 'Directorate General of Taxes (PPN standard 11% VAT)'
  },
  {
    countryCode: 'TR',
    countryName: 'Turkey',
    flag: '🇹🇷',
    taxSystem: 'VAT',
    taxName: 'KDV (VAT)',
    taxIdLabel: 'VKN / Vergi Kimlik No',
    taxIdPlaceholder: '10-digit VKN',
    currencyCode: 'TRY',
    currencySymbol: '₺',
    standardTaxRate: 20,
    taxRates: [0, 1, 10, 20],
    hasSubTaxes: false,
    description: 'Revenue Administration (KDV standard 20%, reduced 10% / 1%)'
  },
  {
    countryCode: 'CH',
    countryName: 'Switzerland',
    flag: '🇨🇭',
    taxSystem: 'VAT',
    taxName: 'MWST / TVA (VAT)',
    taxIdLabel: 'UID / MWST Number',
    taxIdPlaceholder: 'CHE-123.456.789 MWST',
    currencyCode: 'CHF',
    currencySymbol: 'CHF',
    standardTaxRate: 8.1,
    taxRates: [0, 2.6, 3.8, 8.1],
    hasSubTaxes: false,
    description: 'Federal Tax Administration (Standard 8.1%, special 3.8%, reduced 2.6%)'
  },
  {
    countryCode: 'GLOBAL',
    countryName: 'International / Other',
    flag: '🌐',
    taxSystem: 'VAT',
    taxName: 'VAT / Tax',
    taxIdLabel: 'Tax Registration ID',
    taxIdPlaceholder: 'Official Tax Identification Number',
    currencyCode: 'USD',
    currencySymbol: '$',
    standardTaxRate: 10,
    taxRates: [0, 5, 10, 15, 20],
    hasSubTaxes: false,
    description: 'Standard International Value Added Tax'
  }
];

export function getCountryTaxConfig(codeOrName?: string | null): CountryTaxConfig {
  if (!codeOrName) {
    return TAX_COUNTRIES[0]; // Default to India (IN)
  }

  const query = codeOrName.trim().toUpperCase();

  // 1. Direct match by country code
  let match = TAX_COUNTRIES.find((c) => c.countryCode.toUpperCase() === query);
  if (match) return match;

  // 2. Direct match by country name
  match = TAX_COUNTRIES.find((c) => c.countryName.toUpperCase() === query);
  if (match) return match;

  // 3. Direct match by currency code (e.g. 'KWD', 'USD', 'GBP', 'EUR', 'AED', 'SAR', 'INR')
  match = TAX_COUNTRIES.find((c) => c.currencyCode.toUpperCase() === query);
  if (match) return match;

  // 4. Common aliases & alternate spellings
  if (query === 'UK' || query === 'BRITAIN' || query === 'ENGLAND' || query === 'GREAT BRITAIN') {
    return TAX_COUNTRIES.find((c) => c.countryCode === 'GB') || TAX_COUNTRIES[0];
  }
  if (query === 'USA' || query === 'AMERICA' || query === 'UNITED STATES OF AMERICA') {
    return TAX_COUNTRIES.find((c) => c.countryCode === 'US') || TAX_COUNTRIES[0];
  }
  if (query === 'UAE' || query === 'DUBAI' || query === 'EMIRATES' || query === 'UNITED ARAB EMIRATES') {
    return TAX_COUNTRIES.find((c) => c.countryCode === 'AE') || TAX_COUNTRIES[0];
  }
  if (query === 'KSA' || query === 'SAUDI' || query === 'SAUDI ARABIA') {
    return TAX_COUNTRIES.find((c) => c.countryCode === 'SA') || TAX_COUNTRIES[0];
  }
  if (query === 'BHARAT' || query === 'HINDUSTAN') {
    return TAX_COUNTRIES.find((c) => c.countryCode === 'IN') || TAX_COUNTRIES[0];
  }

  // 5. Partial / contains match
  match = TAX_COUNTRIES.find((c) =>
    c.countryName.toUpperCase().includes(query) || query.includes(c.countryName.toUpperCase())
  );
  if (match) return match;

  return TAX_COUNTRIES[0];
}

export function isVatCountry(codeOrName?: string | null): boolean {
  const config = getCountryTaxConfig(codeOrName);
  return config.taxSystem === 'VAT';
}

export function isGstCountry(codeOrName?: string | null): boolean {
  const config = getCountryTaxConfig(codeOrName);
  return config.taxSystem === 'GST';
}

