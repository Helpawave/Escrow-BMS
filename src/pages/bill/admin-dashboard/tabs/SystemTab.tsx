import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { History, Shield, Settings, AlertTriangle, Megaphone } from 'lucide-react';
import { AuditLog } from '@/types/admin';

interface SystemTabProps {
  auditLogs: AuditLog[];
  maintenanceMode: boolean;
  pendingMaintenanceValue: boolean;
  setPendingMaintenanceValue: (val: boolean) => void;
  showMaintenanceDialog: boolean;
  setShowMaintenanceDialog: (val: boolean) => void;
  publicSignups: boolean;
  pendingSignupsValue: boolean;
  setPendingSignupsValue: (val: boolean) => void;
  showSignupsDialog: boolean;
  setShowSignupsDialog: (val: boolean) => void;
  updateSystemSetting: (key: string, value: boolean) => Promise<void> | void;
  broadcastMessage: string;
  setBroadcastMessage: (val: string) => void;
  isPublishingBroadcast: boolean;
  handlePublishBroadcast: () => Promise<void> | void;
}

export const SystemTab: React.FC<SystemTabProps> = ({
  auditLogs,
  maintenanceMode,
  pendingMaintenanceValue,
  setPendingMaintenanceValue,
  showMaintenanceDialog,
  setShowMaintenanceDialog,
  publicSignups,
  pendingSignupsValue,
  setPendingSignupsValue,
  showSignupsDialog,
  setShowSignupsDialog,
  updateSystemSetting,
  broadcastMessage,
  setBroadcastMessage,
  isPublishingBroadcast,
  handlePublishBroadcast,
}) => {
  return (
    <TabsContent value="system" className="space-y-6 outline-none">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md bg-white dark:bg-slate-800/50 backdrop-blur-md dark:bg-slate-800/50 h-fit">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center">
                <History className="w-4 h-4 mr-2" />
                Platform Audit Logs
              </CardTitle>
              <CardDescription>Real-time security events tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <div className={`p-2 rounded-lg ${log.action.includes('Blocked') ? 'bg-rose-100' : 'bg-blue-100'}`}>
                        <Shield className={`w-4 h-4 ${log.action.includes('Blocked') ? 'text-rose-600' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-bold">{log.action}</p>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{log.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Target: {log.target}</p>
                        <p className="text-[10px] text-slate-400 mt-1 italic">Initiated by: {log.admin}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No recent platform activity recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold flex items-center">
                <Settings className="w-4 h-4 mr-2 text-primary" />
                Platform Guards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Maintenance Mode</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Lock the platform for updates</p>
                </div>
                <AlertDialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
                  <AlertDialogTrigger asChild>
                    <div onClick={(e) => {
                      e.preventDefault();
                      setPendingMaintenanceValue(!maintenanceMode);
                      setShowMaintenanceDialog(true);
                    }}>
                      <Checkbox checked={maintenanceMode} />
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-black flex items-center gap-2">
                        <AlertTriangle className="text-amber-500 w-5 h-5" />
                        Critical Operation
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-sm font-medium pt-2">
                        {pendingMaintenanceValue
                          ? "Enabling maintenance mode will block all non-admin users from accessing their dashboards. Are you absolutely certain?"
                          : "Disabling maintenance mode will restore platform access for all users immediately."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl font-bold border-none bg-slate-100">Abort</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => updateSystemSetting('maintenance_mode', pendingMaintenanceValue)}
                        className="rounded-xl font-bold bg-slate-900 text-white"
                      >
                        Confirm Action
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Public Signups</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Enable new user registration</p>
                </div>
                <AlertDialog open={showSignupsDialog} onOpenChange={setShowSignupsDialog}>
                  <AlertDialogTrigger asChild>
                    <div onClick={(e) => {
                      e.preventDefault();
                      setPendingSignupsValue(!publicSignups);
                      setShowSignupsDialog(true);
                    }}>
                      <Checkbox checked={publicSignups} />
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-black">Authentication Guard</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm font-medium pt-2">
                        {pendingSignupsValue
                          ? "New businesses will be able to register on the platform. Proceed?"
                          : "Disabling signups will prevent any new registrations until re-enabled."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl font-bold border-none bg-slate-100">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => updateSystemSetting('public_signups', pendingSignupsValue)}
                        className="rounded-xl font-bold bg-primary text-white"
                      >
                        Confirm Request
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative border border-slate-100 dark:border-slate-800">
            <CardHeader className="bg-blue-600/5 dark:bg-blue-600/10 border-b border-blue-50 dark:border-blue-900/20">
              <CardTitle className="text-lg font-bold flex items-center text-blue-600 dark:text-blue-400">
                <Megaphone className="w-4 h-4 mr-2" />
                Platform Broadcast
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 pt-6">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">Send a notice to all logged-in users instantly.</p>
              <Input
                placeholder="Enter notice text..."
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 h-10 mb-3 focus-visible:ring-blue-600 focus-visible:ring-1"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />
              <Button
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold"
                onClick={handlePublishBroadcast}
                disabled={isPublishingBroadcast}
              >
                {isPublishingBroadcast ? 'Publishing...' : 'Publish Announcement'}
              </Button>
            </CardContent>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
              <Megaphone className="w-24 h-24" />
            </div>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
};

