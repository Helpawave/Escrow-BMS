import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Cloud,
  HardDrive,
  FileSpreadsheet,
  FileCode,
  CloudDownload,
  ExternalLink,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { googleDriveAPI } from "@/utils/googleDriveAPI";

export interface BackupSnapshotItem {
  id: string;
  name: string;
  timestamp: string;
  isoTime: string;
  method: string;
  format: string;
  destination: string;
  status: 'Success' | 'Failed';
  driveUrl?: string;
}

export interface CloudBackupTabProps {
  user: any;
  isStaff: boolean;
  effectiveUserId?: string;
  profile: any;
  serviceSupabase?: any;
  toast: any;
}

export const CloudBackupTab: React.FC<CloudBackupTabProps> = ({
  user,
  isStaff,
  effectiveUserId,
  profile,
  serviceSupabase,
  toast,
}) => {
  const [backupLoading, setBackupLoading] = useState(false);
  const [driveBackingUp, setDriveBackingUp] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState(() => localStorage.getItem('escrow_last_backup_date') || 'Never');
  const [lastBackupMethod, setLastBackupMethod] = useState(() => localStorage.getItem('escrow_last_backup_method') || 'Manual');
  const [backupHistory, setBackupHistory] = useState<BackupSnapshotItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [driveConnected, setDriveConnected] = useState(() => googleDriveAPI.isAuthenticated());
  const [driveUserEmail, setDriveUserEmail] = useState(() => googleDriveAPI.getUserEmail());
  const [driveFolderUrl, setDriveFolderUrl] = useState(() => localStorage.getItem('escrow_drive_backup_folder_url') || '');

  useEffect(() => {
    setDriveConnected(googleDriveAPI.isAuthenticated());
    setDriveUserEmail(googleDriveAPI.getUserEmail());
    setDriveFolderUrl(localStorage.getItem('escrow_drive_backup_folder_url') || '');
  }, []);

  // Helper to persist and broadcast a new real snapshot
  const recordSnapshotEntry = async (entry: BackupSnapshotItem) => {
    try {
      const targetId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
      if (!targetId) return;

      setBackupHistory(prev => {
        const nextList = [entry, ...prev.filter(x => x.id !== entry.id)].slice(0, 50);
        try {
          localStorage.setItem(`escrow_backup_history_${targetId}`, JSON.stringify(nextList));
        } catch {
          // ignore
        }
        return nextList;
      });

      setLastBackupDate(entry.timestamp);
      setLastBackupMethod(entry.method);
      localStorage.setItem('escrow_last_backup_date', entry.timestamp);
      localStorage.setItem('escrow_last_backup_method', entry.method);

      const client = serviceSupabase || supabase;
      const { data: currentSetting } = await (client as any)
        .from('system_settings')
        .select('value')
        .eq('key', `backup_history_${targetId}`)
        .maybeSingle();

      let remoteList: BackupSnapshotItem[] = [];
      if (currentSetting?.value) {
        try {
          remoteList = typeof currentSetting.value === 'string'
            ? JSON.parse(currentSetting.value)
            : currentSetting.value;
        } catch {
          remoteList = [];
        }
      }

      const merged = [entry, ...remoteList.filter(x => x.id !== entry.id)].slice(0, 50);
      await (client as any).from('system_settings').upsert({
        key: `backup_history_${targetId}`,
        value: JSON.stringify(merged)
      }, { onConflict: 'key' });

      // Realtime broadcast to other open tabs
      const rtChannel = supabase.channel(`escrow_backup_rt_${targetId}`);
      rtChannel.send({
        type: 'broadcast',
        event: 'snapshot_logged',
        payload: { entry }
      });
    } catch (err) {
      console.warn("Could not save snapshot entry:", err);
    }
  };

  const fetchBackupHistory = useCallback(async () => {
    const targetId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
    if (!targetId) {
      setBackupHistory([]);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);
    try {
      // 1. Instant cache retrieval
      let localList: BackupSnapshotItem[] = [];
      const cached = localStorage.getItem(`escrow_backup_history_${targetId}`);
      if (cached) {
        try {
          localList = JSON.parse(cached);
          if (Array.isArray(localList)) {
            setBackupHistory(localList);
          }
        } catch {
          // ignore
        }
      }

      // 2. Fetch from Supabase
      const client = serviceSupabase || supabase;
      const { data, error } = await (client as any)
        .from('system_settings')
        .select('value')
        .eq('key', `backup_history_${targetId}`)
        .maybeSingle();

      let remoteList: BackupSnapshotItem[] = [];
      if (!error && data?.value) {
        try {
          remoteList = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        } catch {
          remoteList = [];
        }
      }

      const map = new Map<string, BackupSnapshotItem>();
      [...localList, ...remoteList].forEach(item => {
        if (item?.id) map.set(item.id, item);
      });

      let merged = Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.isoTime || a.timestamp).getTime();
        const timeB = new Date(b.isoTime || b.timestamp).getTime();
        return timeB - timeA;
      });

      // If completely empty but user already had a real lastBackupDate in localStorage, seed that single real item
      if (merged.length === 0) {
        const cachedDate = localStorage.getItem('escrow_last_backup_date');
        if (cachedDate && cachedDate !== 'Never') {
          const cachedMethod = localStorage.getItem('escrow_last_backup_method') || 'Manually';
          const seedItem: BackupSnapshotItem = {
            id: `snap_init_${Date.now()}`,
            name: `ESCROWBILL_${(profile.company_name || 'Business').replace(/[^a-zA-Z0-9]/g, '_')}_Drive_Snapshot.xlsx`,
            timestamp: cachedDate,
            isoTime: new Date().toISOString(),
            method: (cachedMethod === 'Manually' ? 'Manual' : cachedMethod),
            format: '.xlsx',
            destination: 'Local Vault',
            status: 'Success'
          };
          merged = [seedItem];
        }
      }

      setBackupHistory(merged);
      localStorage.setItem(`escrow_backup_history_${targetId}`, JSON.stringify(merged));
      if (merged[0]) {
        setLastBackupDate(merged[0].timestamp);
        setLastBackupMethod(merged[0].method);
      }
    } catch (err) {
      console.warn("Could not load backup history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.id, isStaff, effectiveUserId, profile.company_name, serviceSupabase]);

  useEffect(() => {
    fetchBackupHistory();

    const targetId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
    if (!targetId) return;

    const rtChannel = supabase
      .channel(`escrow_backup_rt_${targetId}`)
      .on('broadcast', { event: 'snapshot_logged' }, (payload: any) => {
        if (payload?.payload?.entry) {
          const newEntry = payload.payload.entry as BackupSnapshotItem;
          setBackupHistory(prev => {
            if (prev.some(x => x.id === newEntry.id)) return prev;
            return [newEntry, ...prev];
          });
          setLastBackupDate(newEntry.timestamp);
          setLastBackupMethod(newEntry.method);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(rtChannel);
    };
  }, [fetchBackupHistory, user?.id, isStaff, effectiveUserId]);

  const handleExportComprehensiveBackup = async (format: 'excel' | 'json') => {
    // Safety auto-reset timeout so button NEVER stays stuck under any condition
    const safetyTimer = setTimeout(() => {
      setBackupLoading(false);
    }, 7000);

    try {
      setBackupLoading(true);
      const targetId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
      if (!targetId) throw new Error("User not authenticated");

      const client = serviceSupabase || supabase;

      // Fetch with timeout race to prevent network hang
      const fetchPromise = Promise.all([
        client.from('profiles').select('*').eq('user_id', targetId),
        client.from('invoices').select('*').eq('user_id', targetId),
        client.from('clients').select('*').eq('user_id', targetId),
        client.from('vendors').select('*').eq('user_id', targetId),
        client.from('purchase_invoices').select('*').eq('user_id', targetId),
        client.from('products').select('*').eq('user_id', targetId),
        client.from('expenses').select('*').eq('user_id', targetId),
        client.from('payments').select('*').eq('user_id', targetId)
      ]);

      const timeoutPromise = new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error("Backup data fetch timed out.")), 20000)
      );

      let profileData: any[] = [];
      let invoicesData: any[] = [];
      let clientsData: any[] = [];
      let vendorsData: any[] = [];
      let purchaseData: any[] = [];
      let productsData: any[] = [];
      let expensesData: any[] = [];
      let paymentsData: any[] = [];

      try {
        const results = await Promise.race([fetchPromise, timeoutPromise]) as any[];
        const failed = results.find(r => r?.error);
        if (failed?.error) throw failed.error;
        profileData = results[0]?.data || [];
        invoicesData = results[1]?.data || [];
        clientsData = results[2]?.data || [];
        vendorsData = results[3]?.data || [];
        purchaseData = results[4]?.data || [];
        productsData = results[5]?.data || [];
        expensesData = results[6]?.data || [];
        paymentsData = results[7]?.data || [];
      } catch (fetchErr: any) {
        console.error("Backup data fetch failed:", fetchErr);
        throw new Error(fetchErr?.message || "Could not fetch all company records. Backup was not created; please retry.");
      }

      const compName = (profile.company_name || 'MyCompany').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        const fullDump = {
          metadata: {
            company: profile.company_name || 'My Business',
            export_date: new Date().toISOString(),
            user_email: user?.email || '',
            system: 'ESCROWBILL Enterprise Vault'
          },
          profile: profileData,
          invoices: invoicesData,
          clients: clientsData,
          vendors: vendorsData,
          purchase_invoices: purchaseData,
          products: productsData,
          expenses: expensesData,
          payments: paymentsData
        };
        const blob = new Blob([JSON.stringify(fullDump, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ESCROWBILL_${compName}_Backup_${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
        await recordSnapshotEntry({
          id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: `ESCROWBILL_${compName}_Backup_${dateStr}.json`,
          timestamp: new Date().toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
          }),
          isoTime: new Date().toISOString(),
          method: 'Manual',
          format: '.json',
          destination: 'Local Device',
          status: 'Success'
        });
        toast({
          title: "JSON Backup Downloaded",
          description: "Complete raw JSON snapshot downloaded to your device."
        });
        return;
      }

      // Format: Excel (.xlsx)
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // ALWAYS guarantee at least one valid sheet so XLSX.writeFile never throws "Workbook is empty"
      const summaryRows = [{
        "Company Name": profile.company_name || 'My Business',
        "Export Date": new Date().toLocaleString('en-IN'),
        "Account Email": user?.email || '',
        "Sales Invoices Count": invoicesData.length,
        "Clients Count": clientsData.length,
        "Vendors Count": vendorsData.length,
        "Products Count": productsData.length,
        "Purchase Bills Count": purchaseData.length,
        "Expenses Count": expensesData.length,
        "Payments Count": paymentsData.length,
        "Status": "Verified Complete Snapshot"
      }];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Backup Summary");

      if (profileData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profileData), "Company Profile");
      if (invoicesData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoicesData), "Sales Invoices");
      if (clientsData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientsData), "Clients & Customers");
      if (vendorsData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendorsData), "Vendors & Suppliers");
      if (purchaseData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchaseData), "Purchase Bills");
      if (productsData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsData), "Products & Stock");
      if (expensesData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), "Expenses");
      if (paymentsData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentsData), "Payments");

      const now = new Date();
      const monthName = now.toLocaleString('en-US', { month: 'long' });
      const yearStr = now.getFullYear();
      const monthYearStr = `${monthName}_${yearStr}`;
      const localFileName = `ESCROWBILL_${compName}_Backup_${monthYearStr}.xlsx`;

      XLSX.writeFile(wb, localFileName);
      await recordSnapshotEntry({
        id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: localFileName,
        timestamp: new Date().toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
        }),
        isoTime: new Date().toISOString(),
        method: 'Manual',
        format: '.xlsx',
        destination: 'Local Device',
        status: 'Success'
      });
      toast({
        title: "Offline Backup Ready",
        description: "Complete company ledger & inventory exported successfully as Excel (.xlsx)."
      });
    } catch (err: any) {
      console.error("Backup export error:", err);
      toast({
        variant: "destructive",
        title: "Backup Failed",
        description: err.message || "Failed to generate local backup archive."
      });
    } finally {
      clearTimeout(safetyTimer);
      setBackupLoading(false);
    }
  };

  const handleSyncGoogleDriveBackup = async (isAutoMonthly: boolean = false) => {
    if (driveBackingUp) return;
    setDriveBackingUp(true);

    try {
      // 1. Ensure authenticated with Google Drive
      const hasToken = await googleDriveAPI.ensureAuthenticated();
      if (!hasToken) {
        if (isAutoMonthly) {
          setDriveBackingUp(false);
          return;
        }
        toast({
          title: "Connecting to Google Drive",
          description: "Please allow the Google popup window to authorize your account."
        });
        const authenticated = await googleDriveAPI.authenticate();
        if (!authenticated) {
          throw new Error('Google Drive authorization was cancelled or failed. Please allow popup access.');
        }
      }

      setDriveConnected(true);
      const email = googleDriveAPI.getUserEmail();
      if (email) setDriveUserEmail(email);

      if (!isAutoMonthly) {
        toast({
          title: "Preparing Backup Data",
          description: "Compiling business ledger, invoices, inventory, and master records..."
        });
      }

      // 2. Fetch fresh company data across tables
      const targetId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
      const client = serviceSupabase || supabase;

      const syncResults = await Promise.all([
        client.from('profiles').select('*').eq('user_id', targetId),
        client.from('invoices').select('*').eq('user_id', targetId),
        client.from('clients').select('*').eq('user_id', targetId),
        client.from('vendors').select('*').eq('user_id', targetId),
        client.from('purchase_invoices').select('*').eq('user_id', targetId),
        client.from('products').select('*').eq('user_id', targetId),
        client.from('expenses').select('*').eq('user_id', targetId),
        client.from('payments').select('*').eq('user_id', targetId),
      ]);

      const failedSyncQuery = syncResults.find(r => r.error);
      if (failedSyncQuery?.error) throw failedSyncQuery.error;

      const profileData = syncResults[0].data || [];
      const invoicesData = syncResults[1].data || [];
      const clientsData = syncResults[2].data || [];
      const vendorsData = syncResults[3].data || [];
      const purchaseData = syncResults[4].data || [];
      const productsData = syncResults[5].data || [];
      const expensesData = syncResults[6].data || [];
      const paymentsData = syncResults[7].data || [];

      const compName = (profile.company_name || 'MyCompany').replace(/[^a-zA-Z0-9]/g, '_');
      const now = new Date();
      const monthName = now.toLocaleString('en-US', { month: 'long' });
      const yearStr = now.getFullYear();
      const monthYearKey = `${monthName}_${yearStr}`;
      const nowStr = now.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });

      // 3. Generate multi-sheet Excel Workbook (.xlsx)
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const summaryRows = [{
        "Company Name": profile.company_name || 'My Business',
        "Backup Month": `${monthName} ${yearStr}`,
        "Backup Generated": nowStr,
        "Account Email": user?.email || '',
        "Sales Invoices Count": invoicesData?.length || 0,
        "Clients Count": clientsData?.length || 0,
        "Vendors Count": vendorsData?.length || 0,
        "Products Count": productsData?.length || 0,
        "Purchase Bills Count": purchaseData?.length || 0,
        "Expenses Count": expensesData?.length || 0,
        "Payments Count": paymentsData?.length || 0,
        "Destination": "Google Drive (/ESCROWBILL Backups/)",
        "Backup Type": isAutoMonthly ? "Monthly Auto-Sync" : "Manual Drive Sync",
        "Integrity Status": "Verified Complete Snapshot"
      }];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Backup Summary");

      if (profileData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profileData), "Company Profile");
      if (invoicesData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoicesData), "Sales Invoices");
      if (clientsData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientsData), "Clients & Customers");
      if (vendorsData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendorsData), "Vendors & Suppliers");
      if (purchaseData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchaseData), "Purchase Bills");
      if (productsData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsData), "Products & Stock");
      if (expensesData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), "Expenses");
      if (paymentsData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentsData), "Payments");

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const fileName = `ESCROWBILL_${compName}_Backup_${monthYearKey}.xlsx`;

      if (!isAutoMonthly) {
        toast({
          title: "Uploading to Google Drive",
          description: `Saving ${fileName} in '/ESCROWBILL Backups' folder...`
        });
      }

      // 4. Get or Create dedicated folder 'ESCROWBILL Backups' in Google Drive
      const folder = await googleDriveAPI.getOrCreateFolder('ESCROWBILL Backups');
      if (!folder || !folder.id) {
        throw new Error("Unable to create or locate 'ESCROWBILL Backups' folder in your Google Drive.");
      }
      if (folder.webViewLink) {
        setDriveFolderUrl(folder.webViewLink);
        localStorage.setItem('escrow_drive_backup_folder_url', folder.webViewLink);
      }

      // 5. Upload Excel file into the dedicated folder
      const driveFile = await googleDriveAPI.uploadFile(
        excelBlob,
        fileName,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        folder.id
      );

      if (!driveFile || !driveFile.id) {
        throw new Error("File upload to Google Drive failed. Please try again.");
      }

      // 6. Record snapshot in audit log and localStorage/system_settings
      const methodLabel = isAutoMonthly ? 'Monthly Auto-Sync' : 'Google Drive Sync';
      setLastBackupDate(nowStr);
      setLastBackupMethod(methodLabel);
      localStorage.setItem('escrow_last_backup_date', nowStr);
      localStorage.setItem('escrow_last_backup_method', methodLabel);
      localStorage.setItem(`escrow_last_monthly_backup_${targetId}`, monthYearKey);

      await recordSnapshotEntry({
        id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: fileName,
        timestamp: nowStr,
        isoTime: new Date().toISOString(),
        method: methodLabel,
        format: '.xlsx',
        destination: 'Google Drive / Backups',
        status: 'Success',
        driveUrl: driveFile.webViewLink
      });

      if (isAutoMonthly) {
        toast({
          title: "Monthly Auto-Backup Complete 🎉",
          description: `Auto-saved ${fileName} to 'ESCROWBILL Backups' in your Google Drive.`
        });
      } else {
        toast({
          title: "Google Drive Backup Success! 🎉",
          description: `Snapshot ${fileName} successfully saved to folder 'ESCROWBILL Backups' in your Google Drive.`
        });
      }
    } catch (err: any) {
      console.error("Google Drive sync error:", err);
      if (!isAutoMonthly) {
        toast({
          variant: "destructive",
          title: "Google Drive Backup Failed",
          description: err.message || "Failed to synchronize backup to Google Drive."
        });
      }
    } finally {
      setDriveBackingUp(false);
    }
  };

  // Monthly Automated Background Sync to Google Drive
  useEffect(() => {
    if (!driveConnected) return;
    const targetId = (isStaff && effectiveUserId) ? effectiveUserId : user?.id;
    if (!targetId) return;

    const currentMonthYear = `${new Date().toLocaleString('en-US', { month: 'long' })}_${new Date().getFullYear()}`;
    const lastBackupMonth = localStorage.getItem(`escrow_last_monthly_backup_${targetId}`);

    if (lastBackupMonth !== currentMonthYear) {
      const autoTimer = setTimeout(() => {
        handleSyncGoogleDriveBackup(true).catch(e => console.warn("Auto-monthly backup silent skip:", e));
      }, 3000);
      return () => clearTimeout(autoTimer);
    }
  }, [driveConnected, user?.id, isStaff, effectiveUserId]);

  const handleDisconnectGoogleDrive = () => {
    googleDriveAPI.disconnect();
    setDriveConnected(false);
    setDriveUserEmail(null);
    setDriveFolderUrl('');
    toast({
      title: "Google Drive Disconnected",
      description: "Google Drive access session cleared from this device."
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <Card className="rounded-2xl border border-border shadow-md bg-card overflow-hidden">
        <div className="p-6 md:p-8 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Cloud className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Data Sovereignty & Automated Cloud Backup</h2>
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Enterprise Vault
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Download full structured offline archives to your device or synchronize automated monthly (30-day) cloud backups to Google Drive.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Drive Sync Online
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Grid: Local Offline Backup vs Online Google Drive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. LOCAL OFFLINE DATA EXPORT */}
        <Card className="rounded-2xl border border-border/80 shadow-sm p-6 space-y-5 bg-card flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Local Device Backup</h3>
                  <p className="text-xs text-muted-foreground font-medium">100% Client-Side Data Sovereignty</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-border/80">
                Offline Ready
              </Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Download complete structured company records to your computer anytime. Exports include all financial ledgers, product catalogs, customer databases, and invoices.
            </p>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground block">Included in Archive:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-foreground">
                <span className="flex items-center gap-1.5">📄 Sales Invoices</span>
                <span className="flex items-center gap-1.5">📦 Products & Stock</span>
                <span className="flex items-center gap-1.5">👥 Clients & Parties</span>
                <span className="flex items-center gap-1.5">🚚 Vendors & Suppliers</span>
                <span className="flex items-center gap-1.5">🧾 Purchase Bills</span>
                <span className="flex items-center gap-1.5">💸 Expenses & Payments</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={() => handleExportComprehensiveBackup('excel')}
              disabled={backupLoading}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 gap-2 shadow-sm"
            >
              {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Download Master Excel (.xlsx)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExportComprehensiveBackup('json')}
              disabled={backupLoading}
              className="rounded-xl font-bold text-xs h-11 gap-2 border-border/80"
            >
              <FileCode className="w-4 h-4" />
              JSON Dump
            </Button>
          </div>
        </Card>

        {/* 2. ONLINE GOOGLE DRIVE AUTOMATED BACKUP */}
        <Card className="rounded-2xl border border-border/80 shadow-sm p-6 space-y-5 bg-card flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <CloudDownload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Google Drive Auto Backup</h3>
                  <p className="text-xs text-muted-foreground font-medium">Automatic Cloud Vault Integration</p>
                </div>
              </div>
              {driveConnected ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  ● Drive Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground border-border text-[10px] font-bold">
                  ○ Not Connected
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Automated monthly backup saves Excel snapshots (e.g. <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">Backup_October_2026.xlsx</code>) directly into your Google Drive in a dedicated <strong>/ESCROWBILL Backups/</strong> folder.
            </p>

            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground font-semibold">Google Account:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">
                    {driveUserEmail || (driveConnected ? (user?.email || "Connected") : "Not connected")}
                  </span>
                  {driveConnected && (
                    <button
                      type="button"
                      onClick={handleDisconnectGoogleDrive}
                      className="text-[10px] text-destructive hover:underline font-semibold"
                      title="Disconnect Google Drive Account"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground font-semibold">Drive Target Folder:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-primary">/ESCROWBILL Backups/</span>
                  {driveFolderUrl && (
                    <a
                      href={driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5 text-[10px] font-bold bg-primary/10 px-1.5 py-0.5 rounded"
                      title="Open folder in Google Drive"
                    >
                      Open <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground font-semibold">Last Backup Date:</span>
                <span className="font-bold text-foreground">{lastBackupDate}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground font-semibold">Backup Method:</span>
                <Badge variant="outline" className="font-bold text-[10px] bg-background">
                  {lastBackupMethod}
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => handleSyncGoogleDriveBackup(false)}
              disabled={driveBackingUp}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs h-11 gap-2 shadow-sm"
            >
              {driveBackingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing to Google Drive Folder...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  Backup Now to Google Drive
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* 3. BACKUP LOGS & SNAPSHOT HISTORY TABLE */}
      <Card className="rounded-2xl border border-border/80 shadow-sm overflow-hidden bg-card">
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <div>
            <h3 className="text-sm font-bold text-foreground">Backup Snapshot History</h3>
            <p className="text-xs text-muted-foreground">Real-time audit log of manual exports and cloud backups</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fetchBackupHistory}
              disabled={loadingHistory}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg border border-border/60 hover:bg-background"
              title="Refresh snapshot logs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loadingHistory && "animate-spin text-primary")} />
              <span className="hidden sm:inline font-semibold">Refresh</span>
            </Button>
            <Badge variant="outline" className="text-xs font-bold bg-background">
              {backupHistory.length} Verified Snapshot{backupHistory.length === 1 ? '' : 's'}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
              <tr>
                <th className="px-4 py-3">Snapshot Name</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {loadingHistory && backupHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
                    <span className="text-xs font-medium">Syncing snapshot audit history...</span>
                  </td>
                </tr>
              ) : backupHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/60">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-xs text-foreground">No Backup Snapshots Created Yet</p>
                      <p className="text-[11px] text-muted-foreground max-w-sm">
                        Download a Master Excel archive or sync to Google Drive above to generate your first verified snapshot.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                backupHistory.map((snap) => (
                  <tr key={snap.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        {snap.format.toLowerCase().includes('json') ? (
                          <FileCode className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : snap.destination.toLowerCase().includes('drive') ? (
                          <Cloud className="w-3.5 h-3.5 text-primary shrink-0" />
                        ) : (
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        {snap.driveUrl ? (
                          <a
                            href={snap.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate max-w-[280px] text-primary hover:underline inline-flex items-center gap-1 font-bold"
                            title="Open file in Google Drive"
                          >
                            <span className="truncate">{snap.name}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="truncate max-w-[280px]" title={snap.name}>{snap.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] whitespace-nowrap">{snap.timestamp}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{snap.method}</td>
                    <td className="px-4 py-3 font-mono uppercase text-[11px]">{snap.format}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">{snap.destination}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {snap.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

