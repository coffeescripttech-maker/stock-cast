export interface GeneralSettings {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  timezone: string;
  dateFormat: string;
  currencyLocale: string;
}

export interface BrandingSettings {
  storeLogo: string | null;
  favicon: string | null;
  primaryBrandColor: string;
  secondaryBrandColor: string;
  loginPageBackground: string | null;
}

export interface AppearanceSettings {
  defaultTheme: 'light' | 'dark';
  sidebarCollapsedDefault: boolean;
  fontSize: 'small' | 'normal' | 'large';
  denseMode: boolean;
  animationsEnabled: boolean;
}

export interface PosSettings {
  defaultSaleType: 'rt' | 'ws';
  autoPrintReceipt: boolean;
  soundOnScan: boolean;
  quickAddMode: boolean;
  defaultQuantity: number;
  decimalPlaces: number;
  customerRequired: boolean;
  enableRewards: boolean;
}

export interface InventorySettings {
  lowStockThresholdRt: number;
  lowStockThresholdWs: number;
  outOfStockThreshold: number;
  autoGenerateBarcodes: boolean;
  barcodePrefix: string;
  enableNegativeStock: boolean;
  defaultSupplier: string;
}

export interface ReceiptSettings {
  headerText: string;
  footerText: string;
  showLogoOnReceipt: boolean;
  showCustomerInfo: boolean;
  showBarcodeOnReceipt: boolean;
  showQrCodeOnReceipt: boolean;
  paperSize: '58mm' | '80mm';
  taxLabel: string;
  discountLabel: string;
  returnPolicyText: string;
}

export interface TaxSettings {
  enabled: boolean;
  label: string;
  rate: number;
  inclusivePricing: boolean;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimalSeparator: string;
  thousandSeparator: string;
}

export interface BarcodeSettings {
  type: 'CODE128' | 'EAN13' | 'UPC';
  width: number;
  height: number;
  showPriceBelow: boolean;
  showNameBelow: boolean;
}

export interface SecuritySettings {
  passwordMinLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  requireStrongPassword: boolean;
  enable2fa: boolean;
  lockoutDuration: number;
}

export interface NotificationSettings {
  lowStockAlert: boolean;
  dailySalesReportTime: string;
  newCustomerAlert: boolean;
  largeTransactionThreshold: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface EmailSmsSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  senderEmail: string;
  smsProvider: 'none' | 'twilio' | 'chikka' | 'vonage';
  smsApiKey: string;
  smsSenderId: string;
}

export interface BackupSettings {
  autoBackupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetentionDays: number;
  lastBackup: string | null;
  backupLocation: string;
  enableAutoBackup: boolean;
}

export interface IntegrationSettings {
  enableQrPayments: boolean;
  paymentGatewayApiKey: string;
  webhookUrl: string;
  enableAccountingSync: boolean;
  accountingProvider: 'none' | 'xero' | 'quickbooks';
}

export interface AboutSettings {
  appVersion: string;
  lastUpdated: string | null;
  developerInfo: string;
  licenseType: string;
  footerCredits: string;
  privacyPolicyUrl: string;
  termsUrl: string;
}

export interface SystemSettings {
  general: GeneralSettings;
  branding: BrandingSettings;
  appearance: AppearanceSettings;
  pos: PosSettings;
  inventory: InventorySettings;
  receipt: ReceiptSettings;
  tax: TaxSettings;
  barcode: BarcodeSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  emailSms: EmailSmsSettings;
  backup: BackupSettings;
  integrations: IntegrationSettings;
  about: AboutSettings;
}

export type SettingsSection = keyof SystemSettings;

export const defaultSettings: SystemSettings = {
  general: {
    storeName: 'Ruiz Store',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    timezone: 'Asia/Manila',
    dateFormat: 'MM/DD/YYYY',
    currencyLocale: 'en-PH',
  },
  branding: {
    storeLogo: null,
    favicon: null,
    primaryBrandColor: '#4f46e5',
    secondaryBrandColor: '#818cf8',
    loginPageBackground: null,
  },
  appearance: {
    defaultTheme: 'light',
    sidebarCollapsedDefault: false,
    fontSize: 'normal',
    denseMode: false,
    animationsEnabled: true,
  },
  pos: {
    defaultSaleType: 'rt',
    autoPrintReceipt: false,
    soundOnScan: true,
    quickAddMode: false,
    defaultQuantity: 1,
    decimalPlaces: 2,
    customerRequired: false,
    enableRewards: true,
  },
  inventory: {
    lowStockThresholdRt: 10,
    lowStockThresholdWs: 30,
    outOfStockThreshold: 0,
    autoGenerateBarcodes: false,
    barcodePrefix: '22',
    enableNegativeStock: false,
    defaultSupplier: '',
  },
  receipt: {
    headerText: 'RUIZ STORE',
    footerText: 'Thank you for shopping at Ruiz Store!',
    showLogoOnReceipt: false,
    showCustomerInfo: true,
    showBarcodeOnReceipt: false,
    showQrCodeOnReceipt: false,
    paperSize: '58mm',
    taxLabel: 'Tax',
    discountLabel: 'Discount',
    returnPolicyText: '',
  },
  tax: {
    enabled: false,
    label: 'VAT',
    rate: 0,
    inclusivePricing: false,
    currencySymbol: '₱',
    currencyPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  barcode: {
    type: 'CODE128',
    width: 2,
    height: 50,
    showPriceBelow: false,
    showNameBelow: false,
  },
  security: {
    passwordMinLength: 6,
    sessionTimeout: 480,
    maxLoginAttempts: 5,
    requireStrongPassword: false,
    enable2fa: false,
    lockoutDuration: 30,
  },
  notifications: {
    lowStockAlert: true,
    dailySalesReportTime: '17:00',
    newCustomerAlert: false,
    largeTransactionThreshold: 10000,
    emailNotifications: false,
    pushNotifications: false,
  },
  emailSms: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    senderEmail: '',
    smsProvider: 'none',
    smsApiKey: '',
    smsSenderId: '',
  },
  backup: {
    autoBackupFrequency: 'daily',
    backupRetentionDays: 30,
    lastBackup: null,
    backupLocation: '',
    enableAutoBackup: false,
  },
  integrations: {
    enableQrPayments: false,
    paymentGatewayApiKey: '',
    webhookUrl: '',
    enableAccountingSync: false,
    accountingProvider: 'none',
  },
  about: {
    appVersion: '1.0.0',
    lastUpdated: null,
    developerInfo: 'Ruiz POS Development Team',
    licenseType: 'Proprietary',
    footerCredits: 'Ruiz POS System',
    privacyPolicyUrl: '',
    termsUrl: '',
  },
};
