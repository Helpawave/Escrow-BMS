import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-300">
          <p>Admin settings panel coming soon. This will include system configuration options, notifications, and admin preferences.</p>
        </CardContent>
      </Card>
    </div>
  );
};
