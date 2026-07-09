import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface SystemStatus {
  id: string;
  service_name: string;
  status: string;
  response_time_ms: number | null;
  error_message: string | null;
  last_checked: string;
}

export const AdminSystem = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('system_status')
        .select('*')
        .order('service_name');

      if (error) throw error;
      setSystemStatus(data || []);
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSystemStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Down</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">System Status</h1>
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">System Status</h1>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Service</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Response Time</TableHead>
                <TableHead className="text-slate-300">Last Checked</TableHead>
                <TableHead className="text-slate-300">Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemStatus.map((service) => (
                <TableRow key={service.id} className="border-slate-700">
                  <TableCell className="text-white font-medium">
                    {service.service_name}
                  </TableCell>
                  <TableCell>
                    {getSystemStatusBadge(service.status)}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {service.response_time_ms ? `${service.response_time_ms}ms` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {new Date(service.last_checked).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {service.error_message || 'None'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
