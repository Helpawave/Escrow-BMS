import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db, ProfileChangeRequestRepository, ProfileRepository } from '@/lib/repository';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import type { Profile } from '@/lib/supabase';
import { 
  Users, 
  UserCheck, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  BarChart3,
  Activity,
  Database,
  Settings,
  Edit,
  Timer
} from 'lucide-react';

export const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    rejectedUsers: 0,
    expiredUsers: 0,
    pendingChangeRequests: 0,
    totalCalculations: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load all profiles for statistics
      const { data: profiles, error: profilesError } = await db.profiles.getAllProfiles();
      
      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
        return;
      }

      if (profiles) {
        // Calculate statistics
        const now = new Date();
        const stats = {
          totalUsers: profiles.length,
          approvedUsers: profiles.filter(p => p.is_allowed && !p.rejected_at).length,
          pendingUsers: profiles.filter(p => !p.is_allowed && !p.rejected_at).length,
          rejectedUsers: profiles.filter(p => p.rejected_at).length,
          expiredUsers: profiles.filter(p => 
            p.approval_expires_at && 
            new Date(p.approval_expires_at) < now
          ).length,
          pendingChangeRequests: 0, // Will be loaded separately
          totalCalculations: 0 // Will be loaded separately
        };

        // Get recent users (last 5)
        const recent = profiles
          .filter(p => p.role === 'user')
          .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
          .slice(0, 5);

        setStats(stats);
        setRecentUsers(recent);

        // Load change requests count
        const { data: changeRequests } = await ProfileChangeRequestRepository.getPendingChangeRequests();
        if (changeRequests) {
          setStats(prev => ({ ...prev, pendingChangeRequests: changeRequests.length }));
        }

        // Load calculations count
        const { data: calculations } = await supabase
          .from('calculation_entries')
          .select('id', { count: 'exact' });
        
        if (calculations) {
          setStats(prev => ({ ...prev, totalCalculations: calculations.length }));
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExpiredUsers = async () => {
    try {
      const { expiredCount, error } = await ProfileRepository.checkAndUpdateExpiredUsers();
      
      if (error) {
        console.error('Error checking expired users:', error);
        return;
      }

      if (expiredCount > 0) {
        toast({
          title: "Users Expired",
          description: `${expiredCount} user(s) have expired and been deactivated`,
          variant: "destructive"
        });
        // Reload dashboard data
        loadDashboardData();
      } else {
        toast({
          title: "No Expired Users",
          description: "All users are within their approval period",
        });
      }
    } catch (error) {
      console.error('Error checking expired users:', error);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-elegant">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Overview and system statistics</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={checkExpiredUsers} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Timer className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Check Expired Users</span>
              <span className="sm:hidden">Check Expired</span>
            </Button>
            <Button onClick={loadDashboardData} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users in system
              </p>
            </CardContent>
          </Card>

          {/* Approved Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedUsers}</div>
              <p className="text-xs text-muted-foreground">
                Currently approved and active
              </p>
            </CardContent>
          </Card>

          {/* Pending Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingUsers}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting admin approval
              </p>
            </CardContent>
          </Card>

          {/* Change Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Edit className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pendingChangeRequests}</div>
              <p className="text-xs text-muted-foreground">
                Profile & password requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Expired Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Users</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expiredUsers}</div>
              <p className="text-xs text-muted-foreground">
                Approval period expired
              </p>
            </CardContent>
          </Card>

          {/* Total Calculations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calculations</CardTitle>
              <Database className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalCalculations}</div>
              <p className="text-xs text-muted-foreground">
                Hisab entries in system
              </p>
            </CardContent>
          </Card>

          {/* Rejected Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected Users</CardTitle>
              <UserCheck className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.rejectedUsers}</div>
              <p className="text-xs text-muted-foreground">
                Access denied by admin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/users">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users ({stats.totalUsers})
                </Button>
              </Link>
              
              {stats.pendingUsers > 0 && (
                <Link to="/admin/users">
                  <Button className="w-full justify-start" variant="outline">
                    <Clock className="w-4 h-4 mr-2" />
                    Review Pending Users ({stats.pendingUsers})
                  </Button>
                </Link>
              )}
              
              {stats.pendingChangeRequests > 0 && (
                <Link to="/admin/users">
                  <Button className="w-full justify-start" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Review Change Requests ({stats.pendingChangeRequests})
                  </Button>
                </Link>
              )}
              
              <Button 
                onClick={checkExpiredUsers} 
                className="w-full justify-start" 
                variant="outline"
              >
                <Timer className="w-4 h-4 mr-2" />
                Check Expired Users
              </Button>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Users
              </CardTitle>
              <CardDescription>
                Latest user registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent users
                </p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{user.name}</h4>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.created_at || '').toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          user.is_allowed ? "default" : 
                          user.rejected_at ? "destructive" : 
                          "secondary"
                        } className="text-xs">
                          {user.is_allowed ? 'Active' : 
                           user.rejected_at ? 'Rejected' : 
                           'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  <Link to="/admin/users">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Users
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Current system health and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Approval Rate</span>
                  <Badge variant="default">
                    {stats.totalUsers > 0 ? 
                      Math.round((stats.approvedUsers / stats.totalUsers) * 100) : 0}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending Approvals</span>
                  <Badge variant={stats.pendingUsers > 0 ? "secondary" : "default"}>
                    {stats.pendingUsers}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Change Requests</span>
                  <Badge variant={stats.pendingChangeRequests > 0 ? "secondary" : "default"}>
                    {stats.pendingChangeRequests}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Expired Users</span>
                  <Badge variant={stats.expiredUsers > 0 ? "destructive" : "default"}>
                    {stats.expiredUsers}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Calculations</span>
                  <Badge variant="outline">
                    {stats.totalCalculations}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Status</span>
                  <Badge variant="default" className="bg-green-600">
                    ✅ Operational
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        {(stats.pendingUsers > 0 || stats.pendingChangeRequests > 0 || stats.expiredUsers > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Attention Required
              </CardTitle>
              <CardDescription>
                Items that need your immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.pendingUsers > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">{stats.pendingUsers} users awaiting approval</span>
                  </div>
                  <Link to="/admin/users">
                    <Button size="sm" variant="outline">
                      Review Now
                    </Button>
                  </Link>
                </div>
              )}
              
              {stats.pendingChangeRequests > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{stats.pendingChangeRequests} change requests pending</span>
                  </div>
                  <Link to="/admin/users">
                    <Button size="sm" variant="outline">
                      Review Requests
                    </Button>
                  </Link>
                </div>
              )}
              
              {stats.expiredUsers > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">{stats.expiredUsers} users have expired</span>
                  </div>
                  <Button onClick={checkExpiredUsers} size="sm" variant="outline">
                    Process Expired
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};
