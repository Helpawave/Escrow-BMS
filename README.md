# ⚡ Escrow BMS — SaaS Business Management Suite

[![Built for India](https://img.shields.io/badge/Market-India%20🇮🇳-blue?style=for-the-badge)](https://escrow-bms-6fdeb.web.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Supabase-indigo?style=for-the-badge)](#-tech-stack)
[![Hosting](https://img.shields.io/badge/Hosting-Firebase%20⚡-orange?style=for-the-badge)](https://escrow-bms-6fdeb.web.app)

An all-in-one, highly performant, and beautifully designed SaaS platform engineered specifically for Indian Small and Medium Businesses (SMBs), traders, and retail shops. Escrow BMS brings billing, payroll, inventory, ledger, crm, and daily calculations into a single, unified workspace with absolute data security.

🔗 **Live Application URL:** [https://escrow-bms-6fdeb.web.app](https://escrow-bms-6fdeb.web.app)

---

## 🚀 Key Modules & Features

Escrow BMS is built out of 6 core business modules, accessible seamlessly from a central control dashboard.

### 📄 1. Billing & E-Invoicing
* **GST Compliance:** CGST, SGST, IGST auto-applied based on business location and buyer parameters.
* **Pro Forma & Purchase Invoices:** Issue quotations and record inventory stock input invoices.
* **HSN Search:** Embedded local search mapping for standard Indian HSN codes.
* **E-Way Bills:** Seamless documentation parameters.

### 👥 2. Payroll & Attendance
* **Employee Directory:** Record profiles, monthly wages, allowances, and documents.
* **Attendance Ledger:** Daily check-ins, monthly summary, and leave management.
* **Auto Pay-Slips:** Generate and download professional monthly slips with one click.

### 💰 3. Account Ledger (Khaata)
* **Party Registry:** Record and track credit/debit balances for partners, clients, and suppliers.
* **Balance Sheet:** Automated assets, liabilities, profit, and loss tracking.
* **Reports:** Generate statement files and ledger history ready for tax filing.

### 📦 4. Inventory Management
* **Item Stock Tracking:** Maintain stock counts with logs for additions and removals.
* **Alert System:** Alerts for low stock levels to avoid shortage.

### 🎯 5. Customer Relationship Management (CRM)
* **Lead Funnels:** Track deals from generation to successful closure.
* **Tasks & Calendar:** Integrated action items with alerts.

### 🧮 6. Daily Hisab (Daily Calculations)
* **Cash Register:** Rapid bookkeeping to trace cash-in and cash-out.
* **Categories:** Customized grouping for miscellaneous expenses.

---

## ⚡ Tech Stack

* **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide icons, Framer Motion
* **Database & Auth:** Supabase (PostgreSQL, Realtime, RLS security)
* **Hosting:** Firebase Hosting (CDN cached edge-delivery)

---

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Helpawave/Escrow-BMS.git
cd Escrow-BMS
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
VITE_USE_SUPABASE="true"
```

### 4. Running the Dev Server
```bash
npm run dev
```

---

## 🛢️ Supabase Database Configuration

To set up the database, run the SQL migrations in the `supabase/migrations/` folder or follow these steps in your **Supabase SQL Editor**:

1. Run the consolidation schema scripts found under `UPDATE_DATABASE.sql`.
2. Re-create the **14-day Free Trial Onboarding Trigger** to automatically register users as workspace owners:

```sql
-- Run this in your Supabase SQL editor to enable the onboarding workflow
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 1. Insert profile with Admin privileges and free plan
  INSERT INTO public.profiles (user_id, first_name, last_name, display_name, role, plan_type, is_paid)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'first_name'),
    'admin',
    'free',
    false
  );
  
  -- 2. Grant workspace role as admin (Owner)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  -- 3. Provision a 14-day Free Trial subscription with all modules active
  INSERT INTO public.subscriptions (user_id, status, plan_type, start_date, end_date, trial_end_date)
  VALUES (
    NEW.id, 
    'active', 
    'free',
    NOW(),
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days'
  );
  
  RETURN NEW;
END;
$function$;
```

---

## 🌐 Deployment

Building for production and deploying to Firebase Hosting:
```bash
# Build Vite production bundle
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

---

## 🔒 Security & Data Isolation
This platform implements strict **Row-Level Security (RLS)** in PostgreSQL. Every select, update, insert, or delete query is verified at the database level against `auth.uid() = user_id`, guaranteeing complete isolation of financial and client data between different workspaces.
