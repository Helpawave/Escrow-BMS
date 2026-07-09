import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, MapPin, CreditCard, Bell, Users, Shield, Database } from "lucide-react";

export const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account, company, and system preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Company Information */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Company Information
            </CardTitle>
            <CardDescription>
              Update your business details and company settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" defaultValue="TechCorp Solutions" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-id">Tax ID</Label>
                <Input id="tax-id" defaultValue="123-45-6789" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($) - United States Dollar</SelectItem>
                    <SelectItem value="eur">EUR (€) - Euro</SelectItem>
                    <SelectItem value="gbp">GBP (£) - British Pound</SelectItem>
                    <SelectItem value="inr">INR (₹) - Indian Rupee</SelectItem>
                    <SelectItem value="cad">CAD (C$) - Canadian Dollar</SelectItem>
                    <SelectItem value="aud">AUD (A$) - Australian Dollar</SelectItem>
                    <SelectItem value="jpy">JPY (¥) - Japanese Yen</SelectItem>
                    <SelectItem value="cny">CNY (¥) - Chinese Yuan</SelectItem>
                    <SelectItem value="krw">KRW (₩) - South Korean Won</SelectItem>
                    <SelectItem value="sgd">SGD (S$) - Singapore Dollar</SelectItem>
                    <SelectItem value="hkd">HKD (HK$) - Hong Kong Dollar</SelectItem>
                    <SelectItem value="chf">CHF (CHF) - Swiss Franc</SelectItem>
                    <SelectItem value="sek">SEK (kr) - Swedish Krona</SelectItem>
                    <SelectItem value="nok">NOK (kr) - Norwegian Krone</SelectItem>
                    <SelectItem value="dkk">DKK (kr) - Danish Krone</SelectItem>
                    <SelectItem value="brl">BRL (R$) - Brazilian Real</SelectItem>
                    <SelectItem value="mxn">MXN ($) - Mexican Peso</SelectItem>
                    <SelectItem value="rub">RUB (₽) - Russian Ruble</SelectItem>
                    <SelectItem value="zar">ZAR (R) - South African Rand</SelectItem>
                    <SelectItem value="aed">AED (د.إ) - UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="est">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="est">Eastern Time (EST)</SelectItem>
                    <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                    <SelectItem value="cst">Central Time (CST)</SelectItem>
                    <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Input id="address" defaultValue="123 Business Ave, New York, NY 10001" />
            </div>
            <Button>Save Company Details</Button>
          </CardContent>
        </Card>

        {/* Warehouses */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Warehouses
            </CardTitle>
            <CardDescription>
              Manage your warehouse locations and default settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Main Warehouse</div>
                  <div className="text-sm text-muted-foreground">123 Storage St, New York, NY</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Default</Badge>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">West Coast Facility</div>
                  <div className="text-sm text-muted-foreground">456 Distribution Blvd, Los Angeles, CA</div>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Add New Warehouse
            </Button>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage team members and their access permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">John Doe</div>
                  <div className="text-sm text-muted-foreground">john@techcorp.com</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>Owner</Badge>
                  <span className="text-sm text-muted-foreground">Last login: 2 hours ago</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Sarah Wilson</div>
                  <div className="text-sm text-muted-foreground">sarah@techcorp.com</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Admin</Badge>
                  <span className="text-sm text-muted-foreground">Last login: 1 day ago</span>
                </div>
              </div>
            </div>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure your notification preferences and alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Low Stock Alerts</div>
                  <div className="text-sm text-muted-foreground">Get notified when inventory is running low</div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Reports</div>
                  <div className="text-sm text-muted-foreground">Receive daily inventory reports via email</div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Security Alerts</div>
                  <div className="text-sm text-muted-foreground">Get notified of login attempts and security events</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security and API access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>Update Password</Button>
            </div>
            <Separator />
            <div>
              <div className="font-medium mb-2">API Keys</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Production API Key</div>
                    <div className="text-sm text-muted-foreground font-mono">sk_prod_****...****1234</div>
                  </div>
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
              </div>
              <Button variant="outline" className="mt-2">
                <Database className="h-4 w-4 mr-2" />
                Generate New API Key
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Billing & Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-primary/10 to-success/10 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Professional Plan</div>
                  <div className="text-sm text-muted-foreground">$49/month • 5 users • Unlimited products</div>
                </div>
                <Badge className="bg-success text-success-foreground">Active</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">5</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">2,847</div>
                <div className="text-sm text-muted-foreground">Products</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground">Days Until Renewal</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Manage Billing</Button>
              <Button variant="outline">Upgrade Plan</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};