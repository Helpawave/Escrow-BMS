// Settings page
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Building2, Globe, Shield, Bell, Palette } from "lucide-react";
import { RolesPermissions } from "@/components/settings/RolesPermissions";
import { TeamManagement } from "@/components/settings/TeamManagement";
import { useState } from "react";
import { toast } from "sonner";

const Settings = () => {
  const { theme, setTheme } = useTheme();

  const [company, setCompany] = useState({
    name: "ESCOROLL Technologies Pvt. Ltd.",
    regNo: "U72200KA2020PTC123456",
    pan: "AABCE1234F",
    gst: "29AABCE1234F1ZH",
  });

  const [notifPrefs, setNotifPrefs] = useState({
    payroll: true,
    leave: true,
    onboarding: true,
    tax: false,
  });

  const handleSaveCompany = () => {
    if (!company.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    toast.success("Company information saved");
  };

  return (
    <AppLayout title="Settings">
      <div className="space-y-8 max-w-3xl animate-fade-in">
        {/* Company Info */}
        <section className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight">Company Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company Name</label>
                <Input value={company.name} onChange={(e) => setCompany(c => ({ ...c, name: e.target.value }))} className="bg-background" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Registration No.</label>
                <Input value={company.regNo} onChange={(e) => setCompany(c => ({ ...c, regNo: e.target.value }))} className="bg-background font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">PAN</label>
                <Input value={company.pan} onChange={(e) => setCompany(c => ({ ...c, pan: e.target.value }))} className="bg-background font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">GST Number</label>
                <Input value={company.gst} onChange={(e) => setCompany(c => ({ ...c, gst: e.target.value }))} className="bg-background font-mono" />
              </div>
            </div>
            <Button size="sm" onClick={handleSaveCompany}>Save Changes</Button>
          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight">Appearance</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">Choose between light and dark mode</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setTheme("light"); toast.success("Switched to light mode"); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                <Sun className="h-4 w-4" />Light
              </button>
              <button
                onClick={() => { setTheme("dark"); toast.success("Switched to dark mode"); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                <Moon className="h-4 w-4" />Dark
              </button>
            </div>
          </div>
        </section>

        {/* Localization */}
        <section className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight">Localization</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Country</label>
                <Input defaultValue="India" className="bg-background" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Currency</label>
                <Input defaultValue="INR (₹)" className="bg-background" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Format</label>
                <Input defaultValue="DD/MM/YYYY" className="bg-background font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Financial Year Start</label>
                <Input defaultValue="April" className="bg-background" />
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight">Notification Preferences</h2>
          </div>
          <div className="p-6 space-y-3">
            {[
              { key: "payroll" as const, label: "Payroll Processing Alerts", desc: "Notify when payroll is generated, locked, or paid" },
              { key: "leave" as const, label: "Leave Request Updates", desc: "Notify on leave approvals, rejections, and new requests" },
              { key: "onboarding" as const, label: "Employee Onboarding", desc: "Notify when new employees are added" },
              { key: "tax" as const, label: "Tax Filing Reminders", desc: "Reminders for upcoming statutory deadlines" },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
                <Switch
                  checked={notifPrefs[pref.key]}
                  onCheckedChange={(checked) => {
                    setNotifPrefs(prev => ({ ...prev, [pref.key]: checked }));
                    toast.success(`${pref.label} ${checked ? "enabled" : "disabled"}`);
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Security */}
        <section className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight">Security</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("2FA setup will be available after authentication is configured")}>Enable</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Session Management</p>
                <p className="text-xs text-muted-foreground">View and manage active sessions</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("Session management requires authentication")}>Manage</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your account password</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("Password change requires authentication")}>Update</Button>
            </div>
          </div>
        </section>

        <TeamManagement />
        <RolesPermissions />
      </div>
    </AppLayout>
  );
};

export default Settings;
