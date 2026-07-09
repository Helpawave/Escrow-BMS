import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [form, setForm] = useState({
    company_name: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    registration_no: "",
    pan: "",
    gst: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.admin_name || !form.admin_email || !form.admin_password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.admin_password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("platform-admin", {
      body: { action: "self_register", ...form },
    });
    setSubmitting(false);

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Registration failed");
      return;
    }

    toast.success("Company registered! You can now sign in.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Register Your Company</CardTitle>
          <CardDescription>Create your company account on ESCOROLL HR</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input id="company" placeholder="e.g. Acme Technologies Pvt. Ltd." value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input id="name" placeholder="e.g. John Doe" value={form.admin_name} onChange={(e) => setForm((f) => ({ ...f, admin_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={form.admin_email} onChange={(e) => setForm((f) => ({ ...f, admin_email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" placeholder="Min 6 characters" value={form.admin_password} onChange={(e) => setForm((f) => ({ ...f, admin_password: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Reg. No</Label>
                <Input placeholder="Optional" value={form.registration_no} onChange={(e) => setForm((f) => ({ ...f, registration_no: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">PAN</Label>
                <Input placeholder="Optional" value={form.pan} onChange={(e) => setForm((f) => ({ ...f, pan: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">GST</Label>
                <Input placeholder="Optional" value={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
              Register Company
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already registered?{" "}
              <button type="button" className="text-primary hover:underline" onClick={() => navigate("/login")}>
                Sign in
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
