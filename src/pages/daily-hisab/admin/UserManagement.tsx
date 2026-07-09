import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db, ProfileChangeRequestRepository } from '@/lib/repository';
import { supabase } from '@/lib/supabase';
import { AdminService } from '@/lib/supabase-admin';
import type { Profile, ProfileChangeRequest } from '@/lib/supabase';
import CountdownTimer from '@/components/CountdownTimer';
// import ApprovalTimer from '@/components/ApprovalTimer'; // Temporarily disabled to fix constructor error
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Key,
  Mail,
  Phone,
  Building2,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Copy,
  Edit,
  AlertCircle,
  Timer,
  RotateCcw,
  Lock
} from 'lucide-react';

// Enhanced component to show detailed user password and auth status
const DetailedUserStatus = ({ userId }: { userId: string }) => {
  const [userDetails, setUserDetails] = useState<{
    id: string;
    actuallyHasPassword: boolean;
    profileHasPassword: boolean;
    profilePasswordText: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        
         // Get profile data (avoiding admin client that causes constructor error)
         const { data: profileData, error: profileError } = await supabase
           .from('profiles')
           .select('has_password, password_text')
           .eq('id', userId)
           .single();
        
         if (profileError) {
           console.error('Error fetching profile data:', profileError);
           return;
         }
         
         const profileHasPassword = profileData?.has_password || false;
         const profilePasswordText = profileData?.password_text || null;
        
         // Simplified password detection using only profile data
         const actuallyHasPassword = profileHasPassword;
         
         console.log('[ADMIN] Password detection for user:', {
           userId,
           profileHasPassword,
           actuallyHasPassword,
           passwordText: profilePasswordText ? '***SET***' : 'Not set'
         });
        
         setUserDetails({
           id: userId,
           actuallyHasPassword,
           profileHasPassword,
           profilePasswordText
         });
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [userId]);
  
  if (isLoading) {
    return <Badge variant="outline" className="text-xs">🔍 Loading...</Badge>;
  }
  
  if (!userDetails) {
    return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">❌ Error</Badge>;
  }
  
   // Simplified - just use the profile data
   const hasPassword = userDetails.actuallyHasPassword;
  
  return (
     <div className="space-y-2">
       {/* Authentication Methods */}
       <div className="flex gap-1 flex-wrap">
         {hasPassword ? (
           <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
             🔐 Password Set
           </Badge>
         ) : (
           <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
             🔓 Google OAuth Only
           </Badge>
         )}
       </div>
       
       {/* Password Info */}
       {userDetails.profilePasswordText && (
         <div className="text-xs text-muted-foreground">
           <div>Password: {userDetails.profilePasswordText}</div>
         </div>
       )}
     </div>
  );
};

interface UserAuthData {
  id: string;
  email: string;
  hasPassword: boolean;
  actualPasswordText: string | null;
  databaseHasPassword: boolean;
  providers: string[];
  identities?: {
    id: string;
    provider: string;
    email?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
  lastSignInAt?: string;
  phone?: string;
  phoneConfirmed?: boolean;
  emailConfirmed?: boolean;
  recoveryToken?: string;
  role?: string;
  aud?: string;
}

export const UserManagement = () => {
  const { toast } = useToast();
  const { adminUser } = useAdminAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Admin access features
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [userPasswords, setUserPasswords] = useState<Record<string, UserAuthData>>({});

  // Password change states
  const [changingPasswordUser, setChangingPasswordUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(5); // Show 5 users per page
  
  // Rejection states
  const [rejectingUser, setRejectingUser] = useState<Profile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Change request states
  const [activeTab, setActiveTab] = useState<'users' | 'change-requests'>('users');
  const [reviewingRequest, setReviewingRequest] = useState<(ProfileChangeRequest & { user_profile?: Partial<Profile> }) | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [changeRequests, setChangeRequests] = useState<(ProfileChangeRequest & { user_profile?: Partial<Profile> })[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);


  // Check for expired users (simplified)
  const checkExpiredUsers = useCallback(async () => {
    try {
      toast({
        title: "Checking expired users...",
        description: "This feature is being processed",
      });
      // Simplified for now to avoid constructor issues
    } catch (error) {
      console.error('Error checking expired users:', error);
    }
  }, [toast]);

  const loadProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await db.profiles.getAllProfiles();
      
      if (error) {
        console.error('Error loading profiles:', error);
        toast({
          title: "Error",
          description: "Failed to load user profiles",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setProfiles(data);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load user profiles",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load change requests
  const loadChangeRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      console.log('[USER_MANAGEMENT]: Loading change requests...');
      
      const { data, error } = await ProfileChangeRequestRepository.getPendingChangeRequests();
      
      if (error) {
        console.error('Error loading change requests:', error);
        toast({
          title: "Error",
          description: "Failed to load change requests",
          variant: "destructive"
        });
        setChangeRequests([]);
        return;
      }

      if (data && Array.isArray(data)) {
        console.log('[USER_MANAGEMENT]: Loaded change requests:', data.length);
        setChangeRequests(data);
      } else {
        console.log('[USER_MANAGEMENT]: No change requests data or invalid format');
        setChangeRequests([]);
      }
    } catch (error) {
      console.error('Error loading change requests:', error);
      setChangeRequests([]);
      toast({
        title: "Error",
        description: "Failed to load change requests due to unexpected error",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRequests(false);
    }
  }, [toast]);

  // Load all profiles and change requests
  useEffect(() => {
    loadProfiles();
    if (activeTab === 'change-requests') {
      loadChangeRequests();
    }
    // Check for expired users on load
    checkExpiredUsers();
  }, [activeTab, loadProfiles, loadChangeRequests, checkExpiredUsers]);

   // Function to get user data (simplified to avoid admin client issues)
   const getUserAuthData = async (userId: string, email: string) => {
     try {
       console.log(`[ADMIN] Retrieving profile data for ${email}`);
       
       // Get profile data only
       const { data: profile, error } = await supabase
         .from('profiles')
         .select('*')
         .eq('id', userId)
         .single();
       
       if (error || !profile) {
         console.error(`[ADMIN] Failed to get profile ${email}:`, error);
         return null;
       }
      
       // Simplified profile data to avoid admin client issues
       const authData = {
         id: profile.id,
         email: profile.email,
         hasPassword: profile.has_password || false,
         actualPasswordText: profile.password_text,
         databaseHasPassword: profile.has_password,
         providers: profile.has_password ? ['email'] : ['google'],
         createdAt: profile.created_at
       };

       console.log(`[ADMIN] Profile data for ${email}:`, authData);
       return authData;
      
    } catch (error) {
      console.error(`[ADMIN] Error getting auth data for ${email}:`, error);
      return null;
    }
  };

  // Function to reveal all user authentication data
  const revealAllUserData = async () => {
    try {
      toast({
        title: "🔓 Admin Master Access Activated",
        description: "Retrieving complete authentication data for all users...",
        duration: 5000,
      });

      const authDataMap: Record<string, UserAuthData> = {};
      
      for (const profile of profiles) {
        const authData = await getUserAuthData(profile.id, profile.email);
        if (authData) {
          authDataMap[profile.id] = authData;
        }
      }
      
      setUserPasswords(authDataMap);
      setShowAllPasswords(true);
      
      toast({
        title: "🔐 Complete Admin Access Granted",
        description: `Retrieved full authentication data for ${Object.keys(authDataMap).length} users. All secrets revealed!`,
        duration: 8000,
      });
      
    } catch (error) {
      console.error('[ADMIN] Error revealing user data:', error);
      toast({
        title: "Error",
        description: "Failed to retrieve user authentication data",
        variant: "destructive"
      });
    }
  };

  // Get only users (not admins) first
  const allUsers = profiles.filter(profile => profile.role === 'user');
  
  // Enhanced filter users based on search and status
  const filteredUsers = allUsers.filter(profile => {
    // Enhanced search - search in multiple fields
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      profile.name?.toLowerCase().includes(searchLower) ||
      profile.email.toLowerCase().includes(searchLower) ||
      (profile.company_name && profile.company_name.toLowerCase().includes(searchLower)) ||
      (profile.phone && profile.phone.includes(searchTerm)) ||
      profile.id.toLowerCase().includes(searchLower) ||
      (profile.rejection_reason && profile.rejection_reason.toLowerCase().includes(searchLower));
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'approved' && profile.is_allowed && !profile.rejected_at) ||
      (filterStatus === 'pending' && !profile.is_allowed && !profile.rejected_at) ||
      (filterStatus === 'rejected' && profile.rejected_at);
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search, filter, or usersPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, usersPerPage]);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await db.profiles.approveUser(userId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to approve user",
          variant: "destructive"
        });
        return;
      }

      setProfiles(prev => 
        prev.map(profile => 
          profile.id === userId 
            ? { ...profile, is_allowed: true, rejected_at: null, rejection_reason: null }
            : profile
        )
      );
      
      toast({
        title: "User approved",
        description: "User has been approved and can now access the system"
      });
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleRejectUser = async () => {
    if (!rejectingUser) return;
    
    try {
      const { error } = await db.profiles.rejectUser(rejectingUser.id, rejectionReason);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to reject user",
          variant: "destructive"
        });
        return;
      }

      setProfiles(prev => 
        prev.map(profile => 
          profile.id === rejectingUser.id 
            ? { 
                ...profile, 
                is_allowed: false, 
                rejected_at: new Date().toISOString(),
                rejection_reason: rejectionReason || 'Access revoked by admin'
              }
            : profile
        )
      );
      
      toast({
        title: "User rejected",
        description: `${rejectingUser.name} has been rejected`
      });
      
      setRejectingUser(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  // Handle change request approval
  const handleApproveChangeRequest = async () => {
    if (!reviewingRequest) return;
    
    try {
      // Get current admin user ID from admin auth context
      const adminUserId = adminUser?.id;
      
      if (!adminUserId) {
        toast({
          title: "Authentication Error",
          description: "Could not identify admin user. Please login again.",
          variant: "destructive"
        });
        return;
      }

      let error;
      
      // Handle different request types
      if (reviewingRequest.request_type === 'password_set') {
        const result = await ProfileChangeRequestRepository.approvePasswordSetRequest(
          reviewingRequest.id,
          adminUserId,
          adminResponse
        );
        error = result.error;
      } else if (reviewingRequest.request_type === 'password_change') {
        const result = await ProfileChangeRequestRepository.approvePasswordChangeRequest(
          reviewingRequest.id,
          adminUserId,
          adminResponse
        );
        error = result.error;
      } else {
        const result = await ProfileChangeRequestRepository.approveChangeRequest(
          reviewingRequest.id,
          adminUserId,
          adminResponse
        );
        error = result.error;
      }
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to approve change request",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Request Approved",
        description: reviewingRequest.request_type === 'password_set' 
          ? "Password has been set successfully for the user"
          : reviewingRequest.request_type === 'password_change'
          ? "Password has been changed successfully for the user"
          : "Profile changes have been applied successfully",
      });

      setReviewingRequest(null);
      setAdminResponse('');
      loadChangeRequests(); // Reload requests
    } catch (error) {
      console.error('Error approving change request:', error);
      toast({
        title: "Error",
        description: "Failed to approve change request",
        variant: "destructive"
      });
    }
  };

  // Handle change request rejection
  const handleRejectChangeRequest = async () => {
    if (!reviewingRequest || !adminResponse.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide a reason for rejecting this request",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Get current admin user ID from admin auth context
      const adminUserId = adminUser?.id;

      if (!adminUserId) {
        toast({
          title: "Authentication Error",
          description: "Could not identify admin user. Please login again.",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await ProfileChangeRequestRepository.rejectChangeRequest(
        reviewingRequest.id,
        adminUserId,
        adminResponse
      );
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to reject change request",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Request Rejected",
        description: "Change request has been rejected",
      });

      setReviewingRequest(null);
      setAdminResponse('');
      loadChangeRequests(); // Reload requests
    } catch (error) {
      console.error('Error rejecting change request:', error);
      toast({
        title: "Error",
        description: "Failed to reject change request",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await db.profiles.deleteProfile(userId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive"
        });
        return;
      }

      setProfiles(prev => prev.filter(profile => profile.id !== userId));
      
      toast({
        title: "User deleted",
        description: "User has been permanently removed from the system",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleFixPassword = async (profile: Profile) => {
    if (!profile.password_text) {
      toast({
        title: "No Password Found",
        description: "This user doesn't have a password set in the database",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Fixing Password...",
        description: `Updating Supabase Auth password for ${profile.name}`,
      });

      const { error } = await AdminService.changeUserPassword(profile.id, profile.password_text);
      
      if (error) {
        console.error('Error fixing password:', error);
        toast({
          title: "Password Fix Failed",
          description: "Failed to update password in Supabase Auth",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Password Fixed!",
        description: `Password successfully updated in Supabase Auth for ${profile.name}. User can now login.`,
      });
      
      // Refresh the profile data
      loadProfiles();
    } catch (error) {
      console.error('Error fixing password:', error);
      toast({
        title: "Error",
        description: "Failed to fix user password",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async () => {
    if (!changingPasswordUser || !newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Changing Password...",
        description: `Setting new password for ${changingPasswordUser.name}`,
      });

      // Use AdminService to properly update password in both Auth and Database
      const { error } = await AdminService.changeUserPassword(changingPasswordUser.id, newPassword);
      
      if (error) {
        console.error('Error changing password:', error);
        toast({
          title: "Password Change Failed",
          description: "Failed to update user password",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Password Changed!",
        description: `Password successfully updated for ${changingPasswordUser.name}. User can now login with the new password.`,
      });
      
      // Clear form and close dialog
      setChangingPasswordUser(null);
      setNewPassword('');
      setShowPassword(false);
      
      // Refresh the profile data
      loadProfiles();
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change user password",
        variant: "destructive"
      });
    }
  };

  const handleFixExpiry = async (profile: Profile) => {
    try {
      toast({
        title: "Fixing Expiry...",
        description: `Setting 1-year expiry for ${profile.name}`,
      });

      const now = new Date();
      const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      const { error } = await db.profiles.renewUserApproval(profile.id);
      
      if (error) {
        console.error('Error fixing expiry:', error);
        toast({
          title: "Expiry Fix Failed",
          description: "Failed to set expiry date",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Expiry Fixed!",
        description: `${profile.name} now has 1-year access until ${oneYearLater.toLocaleDateString()}`,
      });
      
      // Refresh the profile data
      loadProfiles();
    } catch (error) {
      console.error('Error fixing expiry:', error);
      toast({
        title: "Error",
        description: "Failed to fix user expiry",
        variant: "destructive"
      });
    }
  };


  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading user management...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-elegant">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Comprehensive user administration, monitoring, and change requests</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Users ({allUsers.length})
          </Button>
          <Button
            variant={activeTab === 'change-requests' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('change-requests')}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Change Requests ({changeRequests.length})
          </Button>
        </div>

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <>
            <div className="flex gap-2">
            {!showAllPasswords ? (
              <Button 
                onClick={revealAllUserData} 
                variant="destructive" 
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <Key className="w-4 h-4 mr-2" />
                🔓 Master Access
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  setShowAllPasswords(false);
                  setUserPasswords({});
                  toast({
                    title: "🔒 Master Access Disabled",
                    description: "User authentication data hidden",
                  });
                }} 
                variant="outline" 
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                🔒 Hide Access
              </Button>
            )}
            <Button onClick={loadProfiles} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            </div>

            {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, company, phone, ID, or rejection reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {(['all', 'approved', 'pending', 'rejected'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                  >
                    {status === 'all' && <Users className="w-4 h-4 mr-1" />}
                    {status === 'approved' && <CheckCircle className="w-4 h-4 mr-1" />}
                    {status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                    {status === 'rejected' && <XCircle className="w-4 h-4 mr-1" />}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Users ({totalUsers})
            </CardTitle>
            <CardDescription>
              Comprehensive user list with authentication details and management options
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pagination Info */}
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <div>
                Showing {startIndex + 1}-{Math.min(endIndex, totalUsers)} of {totalUsers} users
                {searchTerm && ` (filtered from ${allUsers.length} total)`}
              </div>
              <div>
                Page {currentPage} of {totalPages}
              </div>
            </div>

            <div className="space-y-4">
              {paginatedUsers.map(profile => (
                <div key={profile.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* User Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-lg">{profile.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {profile.email}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={profile.is_allowed ? "default" : profile.rejected_at ? "destructive" : "secondary"}>
                            {profile.is_allowed ? 'Approved' : profile.rejected_at ? 'Rejected' : 'Pending'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {profile.role === 'admin' ? '👑 Admin' : '👤 User'}
                          </Badge>
                        </div>
                      </div>

                       {/* Countdown Timer */}
                       <div className="flex items-center gap-2">
                         <CountdownTimer
                           expiryDate={profile.approval_expires_at}
                           approvalDate={profile.approved_at}
                           isActive={profile.is_allowed}
                           userName={profile.name}
                         />
                       </div>
                      
                      {/* Contact & Company Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          {profile.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {profile.phone}
                            </div>
                          )}
                          {profile.company_name && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="w-3 h-3" />
                              {profile.company_name}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>Created: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</div>
                          {profile.rejected_at && (
                            <div className="text-red-600">
                              Rejected: {new Date(profile.rejected_at).toLocaleDateString()}
                              {profile.rejection_reason && (
                                <div className="italic">Reason: {profile.rejection_reason}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Authentication Details */}
                      <DetailedUserStatus key={`${profile.id}-${refreshKey}`} userId={profile.id} />
                      
                      {/* Master Admin Access - Show All Data */}
                      {showAllPasswords && userPasswords[profile.id] && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4 text-red-600" />
                            <span className="font-semibold text-red-800">🔓 ADMIN MASTER ACCESS</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-2">
                              <div><strong>User ID:</strong> <code className="bg-white px-1 rounded">{userPasswords[profile.id].id}</code></div>
                              <div><strong>Email Confirmed:</strong> {userPasswords[profile.id].emailConfirmed ? '✅ Yes' : '❌ No'}</div>
                              <div><strong>Has Password:</strong> {userPasswords[profile.id].hasPassword ? '🔐 Yes' : '🔓 No'}</div>
                              <div><strong>Database Column:</strong> {userPasswords[profile.id].databaseHasPassword ? '🔐 True' : '🔓 False'}</div>
                              <div><strong>Actual Password:</strong> 
                                {userPasswords[profile.id].actualPasswordText ? (
                                  <div className="flex items-center gap-2">
                                    <code className="bg-red-100 px-2 py-1 rounded text-red-800 font-bold border border-red-300">
                                      {userPasswords[profile.id].actualPasswordText}
                                    </code>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(userPasswords[profile.id].actualPasswordText);
                                        toast({
                                          title: "Password Copied",
                                          description: `Password for ${profile.name} copied to clipboard`,
                                        });
                                      }}
                                      className="p-1 hover:bg-red-200 rounded transition-colors"
                                      title="Copy password"
                                    >
                                      <Copy className="w-3 h-3 text-red-600" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">Not available</span>
                                )}
                              </div>
                              <div><strong>Phone:</strong> {userPasswords[profile.id].phone || 'Not set'}</div>
                              <div><strong>Phone Confirmed:</strong> {userPasswords[profile.id].phoneConfirmed ? '✅ Yes' : '❌ No'}</div>
                            </div>
                            
                            <div className="space-y-2">
                              <div><strong>Auth Providers:</strong> 
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {userPasswords[profile.id].providers.map((provider: string) => (
                                    <Badge key={provider} variant="outline" className="text-xs">{provider}</Badge>
                                  ))}
                                </div>
                              </div>
                                <div><strong>Identities:</strong>
                                  <div className="space-y-1 mt-1">
                                    {(userPasswords[profile.id].identities || []).map((identity, idx) => (
                                      <div key={idx} className="bg-white p-2 rounded border">
                                        <div><strong>Provider:</strong> {identity.provider}</div>
                                        <div><strong>ID:</strong> <code className="text-xs">{identity.id}</code></div>
                                        <div><strong>Email:</strong> {identity.email}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <div><strong>Last Sign In:</strong> {userPasswords[profile.id].lastSignInAt ? new Date(userPasswords[profile.id].lastSignInAt).toLocaleString() : 'Never'}</div>
                              <div><strong>Created:</strong> {userPasswords[profile.id].createdAt ? new Date(userPasswords[profile.id].createdAt).toLocaleString() : 'N/A'}</div>
                              <div><strong>Updated:</strong> {userPasswords[profile.id].updatedAt ? new Date(userPasswords[profile.id].updatedAt).toLocaleString() : 'N/A'}</div>
                            </div>
                            
                            <div className="space-y-1">
                              <div><strong>Recovery Token:</strong> {userPasswords[profile.id].recoveryToken || 'None'}</div>
                              <div><strong>Role:</strong> {userPasswords[profile.id].role}</div>
                              <div><strong>Audience:</strong> {userPasswords[profile.id].aud}</div>
                            </div>
                          </div>
                          
                          {/* Raw Data Toggle */}
                          <details className="mt-4">
                            <summary className="cursor-pointer font-semibold text-red-700 hover:text-red-800">
                              🔍 View Raw Authentication Data
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-900 text-green-400 text-xs rounded overflow-auto max-h-64">
                              {JSON.stringify(userPasswords[profile.id], null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(profile);
                          setShowUserDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      
                      {!profile.is_allowed && !profile.rejected_at && (
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(profile.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      
                      
                      {profile.is_allowed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectingUser(profile)}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setChangingPasswordUser(profile)}
                        className={profile.password_text ? 
                          "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" : 
                          "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        }
                      >
                        <Key className="w-4 h-4 mr-1" />
                        {profile.password_text ? 'Change Password' : 'Set Password'}
                      </Button>

                      {profile.password_text && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFixPassword(profile)}
                          className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Fix Password
                        </Button>
                      )}
                      
                      {profile.is_allowed && !profile.approval_expires_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFixExpiry(profile)}
                          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                        >
                          <Timer className="w-4 h-4 mr-1" />
                          Fix Expiry
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(profile.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {totalUsers === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found matching your criteria</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {totalUsers} total users
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Show:</span>
                    <select
                      value={usersPerPage}
                      onChange={(e) => setUsersPerPage(Number(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span>per page</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <Button
                          variant={1 === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(1)}
                          className="w-10"
                        >
                          1
                        </Button>
                        {currentPage > 4 && (
                          <div className="px-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Current page and neighbors */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      if (pageNum < 1 || pageNum > totalPages) return null;
                      if (currentPage > 3 && pageNum === 1) return null;
                      if (currentPage < totalPages - 2 && pageNum === totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <div className="px-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </div>
                        )}
                        <Button
                          variant={totalPages === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(totalPages)}
                          className="w-10"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Modal */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                User Details: {selectedUser?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Email</Label>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Phone</Label>
                    <p className="text-muted-foreground">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Company</Label>
                    <p className="text-muted-foreground">{selectedUser.company_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Role</Label>
                    <p className="text-muted-foreground">{selectedUser.role}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Status</Label>
                    <Badge variant={selectedUser.is_allowed ? "default" : "destructive"}>
                      {selectedUser.is_allowed ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">User ID</Label>
                    <p className="text-xs text-muted-foreground font-mono">{selectedUser.id}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Password</Label>
                    <div className="flex items-center gap-2">
                      {selectedUser.password_text ? (
                        <>
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                            {selectedUser.password_text}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedUser.password_text || '');
                              toast({
                                title: "Password Copied",
                                description: `Password for ${selectedUser.name} copied to clipboard`,
                              });
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copy password"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium">Password Status</Label>
                    <Badge variant={selectedUser.has_password ? "default" : "secondary"} className="text-xs">
                      {selectedUser.has_password ? '🔐 Password Set' : '🔓 Google OAuth Only'}
                    </Badge>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <Label className="font-medium">Authentication Status</Label>
                  <div className="mt-2">
                    <DetailedUserStatus userId={selectedUser.id} />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Password Change Dialog */}
        <Dialog open={!!changingPasswordUser} onOpenChange={(open) => {
          if (!open) {
            setChangingPasswordUser(null);
            setNewPassword('');
            setShowPassword(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className={`w-5 h-5 ${changingPasswordUser?.password_text ? 'text-green-600' : 'text-blue-600'}`} />
                {changingPasswordUser?.password_text ? 'Change Password for User' : 'Set Password for User'}
              </DialogTitle>
              <DialogDescription>
                {changingPasswordUser?.password_text ? 'Change the password' : 'Set a new password'} for <strong>{changingPasswordUser?.name}</strong> ({changingPasswordUser?.email})
                <br />
                <span className={`text-xs ${changingPasswordUser?.password_text ? 'text-green-600' : 'text-blue-600'}`}>
                  ✨ This will update both database and Supabase Auth properly
                </span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (minimum 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.414 1.414m-1.414-1.414l1.414 1.414M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This will be the user's new login password
                </p>
              </div>

              {changingPasswordUser?.password_text && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Current Password</span>
                  </div>
                  <code className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    {changingPasswordUser.password_text}
                  </code>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setChangingPasswordUser(null);
                  setNewPassword('');
                  setShowPassword(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={!newPassword || newPassword.length < 6}
                className={changingPasswordUser?.password_text ? 
                  "bg-green-600 hover:bg-green-700" : 
                  "bg-blue-600 hover:bg-blue-700"
                }
              >
                <Key className="w-4 h-4 mr-2" />
                {changingPasswordUser?.password_text ? 'Change Password' : 'Set Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={!!rejectingUser} onOpenChange={(open) => {
          if (!open) {
            setRejectingUser(null);
            setRejectionReason('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Reject User Access
              </DialogTitle>
              <DialogDescription>
                Reject access for <strong>{rejectingUser?.name}</strong>? 
                You can optionally provide a reason.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Rejection Reason (Optional)</Label>
                <Textarea
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingUser(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectUser}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </>
        )}

        {/* Change Requests Tab Content */}
        {activeTab === 'change-requests' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Pending Profile Change Requests
                </CardTitle>
                <CardDescription>
                  Review and approve or reject profile change requests from users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading change requests...</p>
                    </div>
                  </div>
                ) : changeRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
                    <p className="text-muted-foreground">All change requests have been processed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {changeRequests.filter(request => request && request.id).map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending Review
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            
                            <div>
                              <h4 className="font-medium">{request.user_profile?.name}</h4>
                              <p className="text-sm text-muted-foreground">{request.user_profile?.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Badge variant={
                              request.request_type === 'password_set' ? 'secondary' : 
                              request.request_type === 'password_change' ? 'default' : 'outline'
                            } className="text-xs">
                              {request.request_type === 'password_set' ? '🔐 Password Setup' : 
                               request.request_type === 'password_change' ? '🔑 Password Change' : 
                               '📝 Profile Change'}
                            </Badge>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setReviewingRequest(request);
                                setAdminResponse('');
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Current Values:</h5>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {request.current_values && Object.entries(request.current_values).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-medium capitalize">
                                    {key.replace('_', ' ')}:
                                  </span>
                                  <span>{String(value) || 'Not set'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-sm mb-2">Requested Changes:</h5>
                            <div className="text-sm space-y-1">
                              {request.requested_changes && Object.entries(request.requested_changes).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-medium capitalize text-blue-600">
                                    {key.replace('_', ' ')}:
                                  </span>
                                  <span className="text-blue-600">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {request.change_reason && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">
                              {request.request_type === 'password_set' ? 'Reason for Password Setup:' : 'Reason for Changes:'}
                            </h5>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                              {request.change_reason}
                            </p>
                          </div>
                        )}
                        
                        {request.request_type === 'password_set' && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Lock className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-800">Password Setup Request</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              This user currently uses Google OAuth and wants to set a password for email login access.
                            </p>
                          </div>
                        )}
                        
                        {request.request_type === 'password_change' && (
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Key className="w-4 h-4 text-orange-600" />
                              <span className="font-medium text-orange-800">Password Change Request</span>
                            </div>
                            <p className="text-sm text-orange-700">
                              This user wants to change their existing password. Current password verification required.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review Change Request Dialog */}
        <Dialog open={!!reviewingRequest} onOpenChange={(open) => {
          if (!open) {
            setReviewingRequest(null);
            setAdminResponse('');
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Change Request</DialogTitle>
              <DialogDescription>
                Review and approve or reject the profile change request from {reviewingRequest?.user_profile?.name}
              </DialogDescription>
            </DialogHeader>
            
            {reviewingRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Current Values:</h4>
                    <div className="text-sm space-y-1 bg-muted p-3 rounded">
                      {Object.entries(reviewingRequest.current_values).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium capitalize">
                            {key.replace('_', ' ')}:
                          </span>
                          <span>{String(value) || 'Not set'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Requested Changes:</h4>
                    <div className="text-sm space-y-1 bg-blue-50 p-3 rounded">
                      {Object.entries(reviewingRequest.requested_changes).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium capitalize text-blue-600">
                            {key.replace('_', ' ')}:
                          </span>
                          <span className="text-blue-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {reviewingRequest.change_reason && (
                  <div>
                    <h4 className="font-medium mb-2">User's Reason:</h4>
                    <p className="text-sm bg-muted p-3 rounded">
                      {reviewingRequest.change_reason}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="adminResponse">Admin Response/Notes</Label>
                  <Textarea
                    id="adminResponse"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Add your response or notes (optional for approval, required for rejection)..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReviewingRequest(null);
                  setAdminResponse('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectChangeRequest}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="default"
                onClick={handleApproveChangeRequest}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
