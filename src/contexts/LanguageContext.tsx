import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi' | 'gu';

const fullTranslations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Sidebar Links
    modules: 'Modules',
    features: 'Features',
    pricing: 'Pricing',
    reviews: 'Reviews',
    login: 'Login',
    dashboard: 'Dashboard',
    admin: 'Admin Portal',
    shuruKaro: 'Get Started',
    logout: 'Sign Out',
    settings: 'Settings',
    search: 'Search...',
    active: 'Active',
    locked: 'Locked',
    free: 'Free',
    
    // Modules Keys
    payroll: 'Payroll',
    ledger: 'Account Ledger',
    billing: 'Billing & Invoices',
    hisab: 'Daily Calculation',
    inventory: 'Inventory',
    crm: 'CRM',
    
    // Module Descriptions
    payrollDesc: 'Employee management, attendance, and payroll.',
    ledgerDesc: 'Financial accounts and transaction ledger.',
    billingDesc: 'Invoices, clients, and vendor management.',
    hisabDesc: 'Daily calculation lists and summaries.',
    inventoryDesc: 'Track stock, products, and sales history.',
    crmDesc: 'Manage leads, tasks, and team communications.',
    
    // Landing Hero
    heroBadge: 'All-in-One Business Suite • Made for India',
    heroTitlePre: 'Your entire business,',
    heroTitleHighlight: 'on one platform',
    heroSubtitle: 'Payroll, Billing, CRM, Inventory, Account Ledger, and Daily Calculation — everything in one place. Completely free.',
    ctaStart: 'Create Free Account',
    ctaDashboard: 'Open Dashboard',
    viewModules: 'View Modules',
    
    // Landing Sections
    modulesTitle: 'Run your business seamlessly',
    modulesSub: 'Click on any active module to open it. Add more as your business grows.',
    featuresTitle: 'Why Escrow BMS?',
    pricingTitle: 'Transparent Pricing Plans',
    pricingSub: 'Only pay for what you need. Upgrade or downgrade anytime.',
    reviewsTitle: 'What do our users say?',
    ctaBoxTitle: 'Organize your business today',
    ctaBoxSub: 'Sign up, enter your business data, and run operations smoothly.',
    ctaBoxBadge: '100% Free — No hidden charges',
    featuresHeaderTitle: 'Simple. Fast. Reliable.',
    includedModules: 'Included Modules',
    landingFooterCopyright: 'Escrow BMS. Data stored locally on your device. No cloud sync.',
    
    // Features Row Landing
    fPrivacyTitle: 'Data Privacy',
    fPrivacyDesc: 'Your data stays with you. No server uploads.',
    fSetupTitle: 'Instant Setup',
    fSetupDesc: 'Ready in 2 minutes. No training required.',
    fStatsTitle: 'Real-time Stats',
    fStatsDesc: 'See everything at a glance on the live dashboard.',
    fGrowthTitle: 'Business Growth',
    fGrowthDesc: 'Make data-driven decisions. Track sales, profit, and expenses.',
    
    // Stats Landing
    stat1Label: 'Businesses using',
    stat2Label: 'Invoices processed',
    stat3Label: 'Data reliability',
    stat4Label: 'Powerful modules',
    
    // Testimonials
    testimonial1Name: 'Ravi Kapoor',
    testimonial1Role: 'Textile Merchant, Surat',
    testimonial1Text: 'We used to use 3 different apps. Now everything is in one place. Saves both time and money!',
    testimonial2Name: 'Priya Singh',
    testimonial2Role: 'CA, Delhi',
    testimonial2Text: 'The best tool for my clients. Everything from billing to ledger is seamless. Highly recommend.',
    testimonial3Name: 'Mohammed Asif',
    testimonial3Role: 'Garment Exporter, Ludhiana',
    testimonial3Text: 'The CRM and payroll modules have completely transformed our business. The support is also great.',
    
    // Pricing Plan details
    planStarterName: 'Starter',
    planStarterDesc: 'Perfect for small businesses',
    planGrowthName: 'Growth',
    planGrowthDesc: 'Perfect for growing businesses',
    planEnterpriseName: 'Enterprise',
    planEnterpriseDesc: 'Perfect for large teams — everything included',
    planPeriod: '/month',
    mostPopular: 'Most Popular',
    
    // Pricing Extra Row
    pSecureTitle: 'Secure',
    pSecureDesc: 'Powered by Supabase — your data is safe.',
    pNoLockTitle: 'No Lock-in',
    pNoLockDesc: 'Upgrade or downgrade anytime.',
    pSupportTitle: 'Dedicated Support',
    pSupportDesc: 'Our helpdesk is always active.',
    
    // Dashboard Portal
    welcomeBack: 'Welcome back',
    welcomeSub: 'Welcome to Escrow BMS',
    activeCountLabel: 'Active Modules',
    lockedCountLabel: 'Locked Modules',
    totalCountLabel: 'Total Modules',
    unlockMore: 'Unlock more →',
    openModule: 'Open Module',
    upgradeToUnlock: 'Upgrade to Unlock',
    yourModules: 'Your Modules',
    
    // Auth Page translations
    authWelcomeTitle: 'All your business tools in one place',
    authWelcomeSub: 'From Payroll and Invoices to Daily Calculation and CRM — Escrow BMS has everything you need to run operations smoothly.',
    authCardTitleLogin: 'Welcome Back!',
    authCardTitleSignup: 'Create Free Account',
    authCardSubLogin: 'Log in to your account',
    authCardSubSignup: 'Get started for free',
    authFooterCopyright: '© 2026 Escrow BMS. All rights reserved.',
    authFooterLinks: 'Privacy Policy · Terms of Service · Help Center',
    backToHome: '← Back to Home',
    
    // Settings Page translations
    settingsSub: 'Update your profile and company details.',
    settingsSaved: 'Saved!',
    settingsSaveBtn: 'Save Changes',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'Your name',
    companyNameLabel: 'Company Name',
    companyNamePlaceholder: 'Your company name',
    phoneLabel: 'Phone number',
    
    // Dynamic Sub-website Switcher
    backToHub: '← Back to BMS Hub',
    productSwitcher: 'Switch Website',
    productSwitcherDesc: 'Jump to another Escrow product',
    payrollSubtitle: 'Payroll App',
    ledgerSubtitle: 'Ledger App',
    billingSubtitle: 'Billing App',
    hisabSubtitle: 'Calculation App',
    inventorySubtitle: 'Inventory App',
    crmSubtitle: 'CRM App',
    bmsSubtitle: 'BMS Suite',

    // Sub-menus
    employees: 'Employees',
    payrollSalary: 'Salary & Run',
    attendance: 'Attendance',
    leave: 'Leaves',
    payslips: 'Payslips',
    reports: 'Reports',
    ledgerParty: 'Party Ledgers',
    transferEntry: 'Transfer Entry',
    createParty: 'Create Party',
    balanceSheet: 'Balance Sheet',
    profitLoss: 'Profit & Loss',
    partiesReport: 'Parties Report',
    transactionsReport: 'Transactions',
    companySettings: 'Company Settings',
    profile: 'Profile',
    salesInvoices: 'Sales Invoices',
    createInvoice: 'Create Invoice',
    purchaseInvoices: 'Purchase Bills',
    clients: 'Clients',
    vendors: 'Vendors',
    payments: 'Payments',
    expenses: 'Expenses',
    products: 'Products',
    eInvoice: 'E-Invoicing',
    hisabHistory: 'Calculation History',
    productsStock: 'Products & Stock',
    scanBarcode: 'Scan Barcode',
    stockHistory: 'Stock History',
    usersStaff: 'Users & Staff',
    leads: 'Leads',
    contacts: 'Contacts',
    taskBoard: 'Task Board',
    analytics: 'Analytics',
    teamMembers: 'Team Members'
  },
  hi: {
    // Nav & Sidebar Links
    modules: 'मॉड्यूल',
    features: 'विशेषताएं',
    pricing: 'कीमतें',
    reviews: 'समीक्षाएं',
    login: 'लॉगिन',
    dashboard: 'डैशबोर्ड',
    admin: 'एडमिन पोर्टल',
    shuruKaro: 'शुरू करें',
    logout: 'साइन आउट',
    settings: 'सेटिंग्स',
    search: 'खोजें...',
    active: 'सक्रिय',
    locked: 'लॉक किया गया',
    free: 'मुफ्त',
    
    // Modules Keys
    payroll: 'पेरोल',
    ledger: 'खाता बही',
    billing: 'बिलिंग और चालान',
    hisab: 'दैनिक हिसाब',
    inventory: 'इन्वेंटरी',
    crm: 'सीआरएम',
    
    // Module Descriptions
    payrollDesc: 'कर्मचारी प्रबंधन, उपस्थिति और वेतन।',
    ledgerDesc: 'वित्तीय खाते और लेनदेन बही।',
    billingDesc: 'चालान, ग्राहक और विक्रेता प्रबंधन।',
    hisabDesc: 'दैनिक गणना सूचियां और सारांश।',
    inventoryDesc: 'स्टॉक, उत्पादों और बिक्री इतिहास को ट्रैक करें।',
    crmDesc: 'लीड्स, कार्यों और टीम संचार का प्रबंधन करें।',
    
    // Landing Hero
    heroBadge: 'ऑल-इन-इन बिजनेस सुइट • भारत के लिए निर्मित',
    heroTitlePre: 'आपका पूरा व्यवसाय,',
    heroTitleHighlight: 'एक ही प्लेटफॉर्म पर',
    heroSubtitle: 'पेरोल, बिलिंग, सीआरएम, इन्वेंटरी, अकाउंट लेजर और दैनिक हिसाब — सब कुछ एक ही जगह पर। बिल्कुल मुफ्त।',
    ctaStart: 'मुफ्त खाता बनाएं',
    ctaDashboard: 'डैशबोर्ड खोलें',
    viewModules: 'मॉड्यूल देखें',
    
    // Landing Sections
    modulesTitle: 'अपने व्यवसाय को सुचारू रूप से चलाएं',
    modulesSub: 'चलाने के लिए किसी भी सक्रिय मॉड्यूल पर क्लिक करें। जैसे-जैसे व्यवसाय बढ़े, और जोड़ें।',
    featuresTitle: 'एस्क्रो बीएमएस ही क्यों?',
    pricingTitle: 'पारदर्शी मूल्य निर्धारण योजनाएं',
    pricingSub: 'केवल उसी का भुगतान करें जिसकी आपको आवश्यकता है। कभी भी अपग्रेड या डाउनग्रेड करें।',
    reviewsTitle: 'हमारे उपयोगकर्ता क्या कहते हैं?',
    ctaBoxTitle: 'आज ही अपने व्यवसाय को व्यवस्थित करें',
    ctaBoxSub: 'साइन अप करें, अपने व्यवसाय का विवरण दर्ज करें, और संचालन सुचारू रूप से चलाएं।',
    ctaBoxBadge: '100% मुफ्त — कोई छिपा हुआ शुल्क नहीं',
    featuresHeaderTitle: 'सरल। तेज़। विश्वसनीय।',
    includedModules: 'शामिल मॉड्यूल',
    landingFooterCopyright: 'एस्क्रो बीएमएस। डेटा आपके डिवाइस पर स्थानीय रूप से सुरक्षित है। क्लाउड सिंक नहीं।',
    
    // Features Row Landing
    fPrivacyTitle: 'डेटा गोपनीयता',
    fPrivacyDesc: 'आपका डेटा आपके पास रहता है। कोई सर्वर अपलोड नहीं।',
    fSetupTitle: 'त्वरित सेटअप',
    fSetupDesc: '२ मिनट में तैयार। किसी प्रशिक्षण की आवश्यकता नहीं।',
    fStatsTitle: 'लाइव रिपोर्ट',
    fStatsDesc: 'लाइव डैशबोर्ड पर सब कुछ एक नज़र में देखें।',
    fGrowthTitle: 'व्यापार वृद्धि',
    fGrowthDesc: 'डेटा-संचालित निर्णय लें। बिक्री, लाभ और खर्चों को ट्रैक करें।',
    
    // Stats Landing
    stat1Label: 'सक्रिय व्यवसाय',
    stat2Label: 'प्रोसेस्ड इनवॉइस',
    stat3Label: 'डेटा विश्वसनीयता',
    stat4Label: 'शक्तिशाली मॉड्यूल',
    
    // Testimonials
    testimonial1Name: 'रवि कपूर',
    testimonial1Role: 'कपड़ा व्यापारी, सूरत',
    testimonial1Text: 'हम पहले ३ अलग-अलग ऐप्स का इस्तेमाल करते थे। अब सब कुछ एक ही जगह है। समय और पैसा दोनों बचता है!',
    testimonial2Name: 'प्रिया सिंह',
    testimonial2Role: 'सीए, दिल्ली',
    testimonial2Text: 'मेरे ग्राहकों के लिए सबसे अच्छा टूल। बिलिंग से लेकर लेजर तक सब कुछ सुचारू है। अत्यधिक सलाह दी जाती है।',
    testimonial3Name: 'मोहम्मद आसिफ',
    testimonial3Role: 'परिधान निर्यातक, लुधियाना',
    testimonial3Text: 'सीआरएम और पेरोल मॉड्यूल ने हमारे व्यवसाय को पूरी तरह से बदल दिया है। सपोर्ट भी बेहतरीन है।',
    
    // Pricing Plan details
    planStarterName: 'स्टार्टर',
    planStarterDesc: 'छोटे व्यवसायों के लिए बिल्कुल सही',
    planGrowthName: 'ग्रोथ',
    planGrowthDesc: 'बढ़ते व्यवसायों के लिए बिल्कुल सही',
    planEnterpriseName: 'एंटरप्राइज',
    planEnterpriseDesc: 'बड़ी टीमों के लिए बिल्कुल सही — सब कुछ शामिल',
    planPeriod: '/महीना',
    mostPopular: 'सबसे लोकप्रिय',
    
    // Pricing Extra Row
    pSecureTitle: 'सुरक्षित',
    pSecureDesc: 'सुपाबेस द्वारा संचालित — आपका डेटा पूरी तरह सुरक्षित है।',
    pNoLockTitle: 'कोई लॉक-इन नहीं',
    pNoLockDesc: 'कभी भी अपग्रेड या डाउनग्रेड करें।',
    pSupportTitle: 'समर्पित समर्थन',
    pSupportDesc: 'हमारा हेल्पडेस्क हमेशा आपकी सेवा में सक्रिय है।',
    
    // Dashboard Portal
    welcomeBack: 'स्वागत है',
    welcomeSub: 'एस्क्रो बीएमएस में आपका स्वागत है',
    activeCountLabel: 'सक्रिय मॉड्यूल',
    lockedCountLabel: 'बंद मॉड्यूल',
    totalCountLabel: 'कुल मॉड्यूल',
    unlockMore: 'और अनलॉक करें →',
    openModule: 'मॉड्यूल खोलें',
    upgradeToUnlock: 'अनलॉक करने के लिए अपग्रेड करें',
    yourModules: 'आपके मॉड्यूल',
    
    // Auth Page translations
    authWelcomeTitle: 'आपके सभी व्यावसायिक उपकरण एक ही स्थान पर',
    authWelcomeSub: 'पेरोल और चालान से लेकर दैनिक हिसाब और सीआरएम तक — एस्क्रो बीएमएस में संचालन को सुचारू रूप से चलाने के लिए आवश्यक सब कुछ है।',
    authCardTitleLogin: 'स्वागत है!',
    authCardTitleSignup: 'मुफ्त खाता बनाएं',
    authCardSubLogin: 'अपने खाते में लॉग इन करें',
    authCardSubSignup: 'मुफ्त में शुरुआत करें',
    authFooterCopyright: '© 2026 एस्क्रो बीएमएस। सभी अधिकार सुरक्षित।',
    authFooterLinks: 'गोपनीयता नीति · सेवा की शर्तें · सहायता केंद्र',
    backToHome: '← होम पेज पर जाएं',
    
    // Settings Page translations
    settingsSub: 'अपना प्रोफ़ाइल और कंपनी विवरण अपडेट करें।',
    settingsSaved: 'सहेज लिया गया!',
    settingsSaveBtn: 'बदलाव सहेजें',
    fullNameLabel: 'पूरा नाम',
    fullNamePlaceholder: 'आपका नाम',
    companyNameLabel: 'कंपनी का नाम',
    companyNamePlaceholder: 'आपकी कंपनी का नाम',
    phoneLabel: 'फ़ोन नंबर',
    
    // Dynamic Sub-website Switcher
    backToHub: '← बीएमएस हब पर जाएं',
    productSwitcher: 'वेबसाइट बदलें',
    productSwitcherDesc: 'दूसरे एस्क्रो उत्पाद पर जाएं',
    payrollSubtitle: 'पेरोल ऐप',
    ledgerSubtitle: 'लेजर ऐप',
    billingSubtitle: 'बिलिंग ऐप',
    hisabSubtitle: 'हिसाब ऐप',
    inventorySubtitle: 'इन्वेंटरी ऐप',
    crmSubtitle: 'सीआरएम ऐप',
    bmsSubtitle: 'बीएमएस सुइट',

    // Sub-menus
    employees: 'कर्मचारी',
    payrollSalary: 'वेतन और रन',
    attendance: 'उपस्थिति',
    leave: 'छुट्टियां',
    payslips: 'पेस्लिप्स',
    reports: 'रिपोर्ट्स',
    ledgerParty: 'पार्टी बही',
    transferEntry: 'स्थानांतरण प्रविष्टि',
    createParty: 'पार्टी बनाएं',
    balanceSheet: 'तुलन पत्र',
    profitLoss: 'लाभ और हानि',
    partiesReport: 'पार्टियों की रिपोर्ट',
    transactionsReport: 'लेनदेन रिपोर्ट',
    companySettings: 'कंपनी सेटिंग्स',
    profile: 'प्रोफ़ाइल',
    salesInvoices: 'बिक्री चालान',
    createInvoice: 'चालान बनाएं',
    purchaseInvoices: 'खरीद बिल',
    clients: 'ग्राहक',
    vendors: 'विक्रेता',
    payments: 'भुगतान',
    expenses: 'खर्च',
    products: 'उत्पाद',
    eInvoice: 'ई-इनवॉइसिंग',
    hisabHistory: 'हिसाब का इतिहास',
    productsStock: 'उत्पाद और स्टॉक',
    scanBarcode: 'बारकोड स्कैन करें',
    stockHistory: 'स्टॉक इतिहास',
    usersStaff: 'उपयोगकर्ता और स्टाफ',
    leads: 'लीड्स',
    contacts: 'संपर्क',
    taskBoard: 'कार्य बोर्ड',
    analytics: 'विश्लेषण',
    teamMembers: 'टीम के सदस्य'
  },
  gu: {
    // Nav & Sidebar Links
    modules: 'મોડ્યુલ્સ',
    features: 'વિશેષતાઓ',
    pricing: 'કિંમતો',
    reviews: 'રીવ્યુઝ',
    login: 'લોગિન',
    dashboard: 'ડેશબોર્ડ',
    admin: 'એડમિન પોર્ટલ',
    shuruKaro: 'શરૂ કરો',
    logout: 'સાઇન આઉટ',
    settings: 'સેટિંગ્સ',
    search: 'શોધો...',
    active: 'સક્રિય',
    locked: 'લૉક કરેલ',
    free: 'મફત',
    
    // Modules Keys
    payroll: 'પેરોલ',
    ledger: 'ખાતા વહી',
    billing: 'બિલિંગ અને ઇન્વૉઇસેસ',
    hisab: 'દૈનિક હિસાબ',
    inventory: 'ઇન્વેન્ટરી',
    crm: 'સીઆરએમ',
    
    // Module Descriptions
    payrollDesc: 'કર્મચારી સંચાલન, હાજરી અને પેરોલ.',
    ledgerDesc: 'નાણાકીય ખાતાઓ અને વ્યવહાર ખાતાવહી.',
    billingDesc: 'ઇન્વૉઇસેસ, ગ્રાહકો અને વિક્રેતા વ્યવસ્થાપન.',
    hisabDesc: 'દૈનિક ગણતરી સૂચિઓ અને સારાંશ.',
    inventoryDesc: 'સ્ટોક, ઉત્પાદનો અને વેચાણ ઇતિહાસને ટ્રૅક કરો.',
    crmDesc: 'લીડ્સ, કાર્યો અને ટીમ સંચારનું સંચાલન કરો.',
    
    // Landing Hero
    heroBadge: 'ઑલ-ઇન-વન બિઝનેસ સ્યુટ • ભારત માટે બનાવેલ',
    heroTitlePre: 'તમારો સંપૂર્ણ વ્યવસાય,',
    heroTitleHighlight: 'એક જ પ્લેટફોર્મ પર',
    heroSubtitle: 'પેરોલ, બિલિંગ, સીઆરએમ, ઇન્વેન્ટરી, એકાઉન્ટ લેજર અને દૈનિક હિસાબ — બધું એક જ જગ્યાએ. બિલકુલ મફત.',
    ctaStart: 'મફત ખાતું બનાવો',
    ctaDashboard: 'ડેશબોર્ડ ખોલો',
    viewModules: 'મોડ્યુલ્સ જુઓ',
    
    // Landing Sections
    modulesTitle: 'તમારા વ્યવસાયને એકીકૃત રીતે ચલાવો',
    modulesSub: 'ચલાવવા માટે કોઈપણ સક્રિય મોડ્યુલ પર ક્લિક કરો. જેમ જેમ વ્યવસાય વધે તેમ વધુ ઉમેરો.',
    featuresTitle: 'શા માટે એસ્ક્રો બીએમએસ?',
    pricingTitle: 'પારદર્શક કિંમત યોજનાઓ',
    pricingSub: 'ફક્ત તમને જે જોઈએ છે તેની ચૂકવણી કરો. કોઈપણ સમયે અપગ્રેડ અથવા ડાઉનગ્રેડ કરો.',
    reviewsTitle: 'અમારા વપરાશકર્તાઓ શું કહે છે?',
    ctaBoxTitle: 'આજે જ તમારા વ્યવસાયને વ્યવસ્થિત કરો',
    ctaBoxSub: 'સાઇન અપ કરો, તમારા વ્યવસાયની વિગતો દાખલ કરો અને કામગીરી સરળતાથી ચલાવો.',
    ctaBoxBadge: '100% મફત — કોઈ છુપાયેલ શુલ્ક નથી',
    featuresHeaderTitle: 'સરળ. ઝડપી. વિશ્વસનીય.',
    includedModules: 'શામેલ મોડ્યુલો',
    landingFooterCopyright: 'એસ્ક્રો બીએમએસ. ડેટા તમારા ઉપકરણ પર સ્થાનિક રીતે સંગ્રહિત છે. કોઈ ક્લાઉડ સિંક નથી.',
    
    // Features Row Landing
    fPrivacyTitle: 'ડેટા ગોપનીયતા',
    fPrivacyDesc: 'તમારો ડેટા તમારી પાસે રહે છે. કોઈ સર્વર અપલોડ નથી.',
    fSetupTitle: 'ઝડપી સેટઅપ',
    fSetupDesc: '૨ મિનિટમાં તૈયાર. કોઈ તાલીમની જરૂર નથી.',
    fStatsTitle: 'લાઇવ રિપોર્ટ',
    fStatsDesc: 'લાઇવ ડેશબોર્ડ પર બધું એક નજરમાં જુઓ.',
    fGrowthTitle: 'વ્યવસાય વૃદ્ધિ',
    fGrowthDesc: 'ડેટા-સંચાલિત નિર્ણયો લો. વેચાણ, નફો અને ખર્ચ ટ્રૅક કરો.',
    
    // Stats Landing
    stat1Label: 'સક્રિય વ્યવસાયો',
    stat2Label: 'પ્રોસેસ્ડ ઇન્વૉઇસેસ',
    stat3Label: 'ડેટા વિશ્વસનીયતા',
    stat4Label: 'શક્તિશાળી મોડ્યુલો',
    
    // Testimonials
    testimonial1Name: 'રવિ કપૂર',
    testimonial1Role: 'કાપડ વેપારી, સુરત',
    testimonial1Text: 'અમે પહેલા ૩ અલગ અલગ એપ્સ વાપરતા હતા. હવે બધું એક જ જગ્યાએ છે. સમય અને નાણાં બંને બચે છે!',
    testimonial2Name: 'પ્રિયા સિંહ',
    testimonial2Role: 'સીએ, દિલ્હી',
    testimonial2Text: 'મારા ક્લાયન્ટ્સ માટે શ્રેષ્ઠ સાધન. બિલિંગથી લઈને ખાતાવહી સુધી બધું સરળ છે. ખૂબ ભલામણ કરું છું.',
    testimonial3Name: 'મોહમ્મદ આસિફ',
    testimonial3Role: 'ગારમેન્ટ નિકાસકાર, લુધિયાણા',
    testimonial3Text: 'સીઆરએમ અને પેરોલ મોડ્યુલે અમારા વ્યવસાયને સંપૂર્ણપણે બદલી નાખ્યો છે. સપોર્ટ પણ ખૂબ સારો છે.',
    
    // Pricing Plan details
    planStarterName: 'સ્ટાર્ટર',
    planStarterDesc: 'નાના વ્યવસાયો માટે યોગ્ય',
    planGrowthName: 'ગ્રોથ',
    planGrowthDesc: 'વધતા વ્યવસાયો માટે યોગ્ય',
    planEnterpriseName: 'એન્ટરપ્રાઇઝ',
    planEnterpriseDesc: 'મોટી ટીમો માટે યોગ્ય — બધું શામેલ',
    planPeriod: '/મહિનો',
    mostPopular: 'સૌથી લોકપ્રિય',
    
    // Pricing Extra Row
    pSecureTitle: 'સુરક્ષિત',
    pSecureDesc: 'સુપાબેઝ દ્વારા સંચાલિત — તમારો ડેટા સંપૂર્ણ સુરક્ષિત છે.',
    pNoLockTitle: 'કોઈ લોક-ઇન નથી',
    pNoLockDesc: 'ગમે ત્યારે અપગ્રેડ કે ડાઉનગ્રેડ કરો.',
    pSupportTitle: 'સમર્પિત સપોર્ટ',
    pSupportDesc: 'અમારો હેલ્પડેસ્ક હંમેશા તમારી સેવામાં સક્રિય છે.',
    
    // Dashboard Portal
    welcomeBack: 'સ્વાગત છે',
    welcomeSub: 'એસ્ક્રો બીએમએસ માં તમારું સ્વાગત છે',
    activeCountLabel: 'સક્રિય મોડ્યુલ્સ',
    lockedCountLabel: 'લૉક કરેલ મોડ્યુલ્સ',
    totalCountLabel: 'કુલ મોડ્યુલ્સ',
    unlockMore: 'વધુ અનલૉક કરો →',
    openModule: 'મોડ્યુલ ખોલો',
    upgradeToUnlock: 'અનલૉક કરવા માટે અપગ્રેડ કરો',
    yourModules: 'તમારા મોડ્યુલ્સ',
    
    // Auth Page translations
    authWelcomeTitle: 'તમારા બધા વ્યવસાયિક સાધનો એક જ જગ્યાએ',
    authWelcomeSub: 'પેરોલ અને ઇન્વૉઇસેસથી લઈને દૈનિક હિસાબ અને સીઆરએમ સુધી — એસ્ક્રો બીએમએસ પાસે કામગીરી સરળતાથી ચલાવવા માટે જરૂરી બધું છે.',
    authCardTitleLogin: 'સ્વાગત છે!',
    authCardTitleSignup: 'મફત ખાતું બનાવો',
    authCardSubLogin: 'તમારા ખાતામાં લૉગ ઇન કરો',
    authCardSubSignup: 'મફતમાં શરૂઆત કરો',
    authFooterCopyright: '© 2026 એસ્ક્રો બીએમએસ. સર્વાધિકાર સુરક્ષિત.',
    authFooterLinks: 'ગોપનીયતા નીતિ · સેવાની શરતો · સહાય કેન્દ્ર',
    backToHome: '← હોમ પેજ પર પાછા જાઓ',
    
    // Settings Page translations
    settingsSub: 'તમારી પ્રોફાઇલ અને કંપની વિગતો અપડેટ કરો.',
    settingsSaved: 'સાચવવામાં આવ્યું!',
    settingsSaveBtn: 'ફેરફારો સાચવો',
    fullNameLabel: 'પૂરું નામ',
    fullNamePlaceholder: 'તમારું નામ',
    companyNameLabel: 'કંપનીનું નામ',
    companyNamePlaceholder: 'તમારી કંપનીનું નામ',
    phoneLabel: 'ફોન નંબર',
    
    // Dynamic Sub-website Switcher
    backToHub: '← બીએમએસ હબ પર જાઓ',
    productSwitcher: 'વેબસાઇટ બદલો',
    productSwitcherDesc: 'બીજા એસ્ક્રો ઉત્પાદન પર જાઓ',
    payrollSubtitle: 'પેરોલ એપ',
    ledgerSubtitle: 'લેજર એપ',
    billingSubtitle: 'બિલિંગ એપ',
    hisabSubtitle: 'હિસાબ એપ',
    inventorySubtitle: 'ઇન્વેન્ટરી એપ',
    crmSubtitle: 'સીઆરએમ એપ',
    bmsSubtitle: 'બીએમએસ સ્યુટ',

    // Sub-menus
    employees: 'કર્મચારીઓ',
    payrollSalary: 'પગાર અને રન',
    attendance: 'હાજરી',
    leave: 'રજાઓ',
    payslips: 'પેસ્લિપ્સ',
    reports: 'રિપોર્ટ્સ',
    ledgerParty: 'પાર્ટી ખાતાવહી',
    transferEntry: 'ટ્રાન્સફર એન્ટ્રી',
    createParty: 'પાર્ટી બનાવો',
    balanceSheet: 'બેલેન્સ શીટ',
    profitLoss: 'નફો અને નુકસાન',
    partiesReport: 'પાર્ટીઓનો અહેવાલ',
    transactionsReport: 'વ્યવહારો રિપોર્ટ',
    companySettings: 'કંપની સેટિંગ્સ',
    profile: 'પ્રોફાઇલ',
    salesInvoices: 'વેચાણ ઇન્વૉઇસેસ',
    createInvoice: 'ઇન્વૉઇસ બનાવો',
    purchaseInvoices: 'ખરીદી બિલો',
    clients: 'ગ્રાહકો',
    vendors: 'વિક્રેતાઓ',
    payments: 'ચૂકવણીઓ',
    expenses: 'ખર્ચાઓ',
    products: 'ઉત્પાદનો',
    eInvoice: 'ઇ-ઇનવોઇસિંગ',
    hisabHistory: 'હિસાબ ઇતિહાસ',
    productsStock: 'ઉત્પાદનો અને સ્ટોક',
    scanBarcode: 'બારકોડ સ્કેન કરો',
    stockHistory: 'સ્ટોક ઇતિહાસ',
    usersStaff: 'વપરાશકર્તાઓ અને સ્ટાફ',
    leads: 'લીડ્સ',
    contacts: 'સંપર્કો',
    taskBoard: 'ટાસ્ક બોર્ડ',
    analytics: 'એનાલિટિક્સ',
    teamMembers: 'ટીમ સભ્યો'
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('bms_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bms_lang', lang);
  };

  const t = (key: string): string => {
    const dict = (fullTranslations[language] || fullTranslations['en']) as Record<string, string>;
    const defaultDict = fullTranslations['en'] as Record<string, string>;
    return dict[key] || defaultDict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
