import { useState, useEffect } from 'react';
import { UserLayout } from '@/components/layout/UserLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ProfileChangeRequestRepository } from '@/lib/repository';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, Building, Shield, Calendar, Loader2, Key, Lock, Edit, AlertCircle, Clock, CheckCircle, XCircle, Settings } from 'lucide-react';
import CountdownTimer from '@/components/CountdownTimer';

// Simple component to display user's available login methods
const LoginMethodsDisplay = ({ userId }: { userId?: string }) => {
  const [loginMethods, setLoginMethods] = useState<{
    hasGoogle: boolean;
    hasPassword: boolean;
    isLoading: boolean;
  }>({
    hasGoogle: false,
    hasPassword: false,
    isLoading: true
  });

  useEffect(() => {
    const checkLoginMethods = async () => {
      if (!userId) {
        setLoginMethods({ hasGoogle: false, hasPassword: false, isLoading: false });
        return;
      }

      try {
        // Clear any old cached auth method data since it may be inaccurate
        localStorage.removeItem('user_auth_method');
        localStorage.removeItem('user_has_password');

        // Fallback: Conservative detection - only show what we're sure about
        // Since we can't reliably check password status without session,
        // default to showing Google OAuth only (most common case)
        setLoginMethods({
          hasGoogle: true, // Safe assumption for most users
          hasPassword: false, // Conservative - better to under-report than over-report
          isLoading: false
        });
        
      } catch (error) {
        console.error('Error checking login methods:', error);
        setLoginMethods({
          hasGoogle: true, // Default assumption
          hasPassword: false,
          isLoading: false
        });
      }
    };

    checkLoginMethods();
  }, [userId]);

  if (loginMethods.isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
        <span className="text-xs text-muted-foreground">Checking...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {loginMethods.hasGoogle && (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google OAuth
          </Badge>
        )}
        {loginMethods.hasPassword && (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Email & Password
          </Badge>
        )}
        {!loginMethods.hasGoogle && !loginMethods.hasPassword && (
          <Badge variant="secondary" className="text-xs">
            No login methods detected
          </Badge>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {loginMethods.hasGoogle && loginMethods.hasPassword && 
          "You can login using either Google OAuth or your email and password"}
        {loginMethods.hasGoogle && !loginMethods.hasPassword && 
          "You can login using Google OAuth. Contact admin to enable email/password login."}
        {!loginMethods.hasGoogle && loginMethods.hasPassword && 
          "You can login using your email and password"}
        {!loginMethods.hasGoogle && !loginMethods.hasPassword && 
          "Contact administrator for login access"}
      </p>
    </div>
  );
};

export const Profile = () => {
  const { user, updateUser, refreshUser, isLoading, checkUserApprovalStatus } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    companyName: user?.companyName || '',
    phone: user?.phone || ''
  });
  
  // Change request states
  const [isChangeRequestDialogOpen, setIsChangeRequestDialogOpen] = useState(false);
  const [changeRequestData, setChangeRequestData] = useState({
    name: '',
    companyName: '',
    phone: '',
    reason: ''
  });
  const [userChangeRequests, setUserChangeRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  
  // Password set request states
  const [isPasswordRequestDialogOpen, setIsPasswordRequestDialogOpen] = useState(false);
  const [passwordRequestData, setPasswordRequestData] = useState({
    password: '',
    confirmPassword: '',
    reason: ''
  });
  
  // Password change request states
  const [isPasswordChangeDialogOpen, setIsPasswordChangeDialogOpen] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    reason: ''
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  
  
  // Load user profile data
  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Load user change requests
  const loadChangeRequests = async () => {
    if (!user?.id) return;
    
    setIsLoadingRequests(true);
    try {
      const { data: requests } = await ProfileChangeRequestRepository.getUserChangeRequests(user.id);
      const { hasPending } = await ProfileChangeRequestRepository.hasPendingChangeRequest(user.id);
      
      setUserChangeRequests(requests || []);
      setHasPendingRequest(hasPending);
      
      // Check if any request was approved very recently (last 10 seconds) and hasn't been processed yet
      const recentApprovedRequest = requests?.find(req => 
        req.status === 'approved' && 
        req.reviewed_at &&
        new Date(req.reviewed_at).getTime() > Date.now() - 10000 && // Within last 10 seconds only
        !sessionStorage.getItem(`processed_request_${req.id}`) // Not already processed
      );
      
      if (recentApprovedRequest && refreshUser) {
        console.log('[PROFILE]: Recent approved request found, refreshing user data');
        
        // Mark this request as processed to prevent infinite loop
        sessionStorage.setItem(`processed_request_${recentApprovedRequest.id}`, 'true');
        
        await refreshUser();
        
        // Show success notification
        toast({
          title: "Profile Updated!",
          description: "Your change request has been approved and your profile has been updated.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error loading change requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Sync form data with user changes and load requests
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        companyName: user.companyName || '',
        phone: user.phone || ''
      });
      
      // Initialize change request form with current values
      setChangeRequestData({
        name: user.name || '',
        companyName: user.companyName || '',
        phone: user.phone || '',
        reason: ''
      });
      
      loadChangeRequests();
      loadUserProfile();
    }
  }, [user]);

  // Handle password set request
  const handlePasswordSetRequest = async () => {
    if (!user?.id) return;

    // Validation
    if (passwordRequestData.password !== passwordRequestData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordRequestData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    if (!passwordRequestData.reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for setting a password",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await ProfileChangeRequestRepository.createPasswordSetRequest(
        user.id,
        passwordRequestData.password,
        passwordRequestData.reason
      );

      if (error) throw error;

      toast({
        title: "Password request submitted!",
        description: "Your password set request has been sent to the administrator for approval",
      });

      setIsPasswordRequestDialogOpen(false);
      setPasswordRequestData({
        password: '',
        confirmPassword: '',
        reason: ''
      });

      // Reload change requests
      loadChangeRequests();
    } catch (error) {
      console.error('Error submitting password set request:', error);
      toast({
        title: "Request failed",
        description: "Failed to submit password set request. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle password change request
  const handlePasswordChangeRequest = async () => {
    if (!user?.id) return;

    // Validation
    if (!passwordChangeData.currentPassword.trim()) {
      toast({
        title: "Current password required",
        description: "Please enter your current password",
        variant: "destructive"
      });
      return;
    }

    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordChangeData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "New password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    if (!passwordChangeData.reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for changing your password",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await ProfileChangeRequestRepository.createPasswordChangeRequest(
        user.id,
        passwordChangeData.currentPassword,
        passwordChangeData.newPassword,
        passwordChangeData.reason
      );

      if (error) throw error;

      toast({
        title: "Password change request submitted!",
        description: "Your password change request has been sent to the administrator for approval",
      });

      setIsPasswordChangeDialogOpen(false);
      setPasswordChangeData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        reason: ''
      });

      // Reload change requests
      loadChangeRequests();
    } catch (error) {
      console.error('Error submitting password change request:', error);
      toast({
        title: "Request failed",
        description: "Failed to submit password change request. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Periodic refresh to check for approved change requests
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      console.log('[PROFILE]: Periodic check for change request updates');
      loadChangeRequests();
    }, 60000); // Check every 60 seconds (reduced frequency)

    return () => clearInterval(interval);
  }, [user?.id]);


  // Handle change request submission
  const handleChangeRequest = async () => {
    if (!user?.id) return;

    // Check what fields have changed
    const changes: Record<string, any> = {};
    const currentValues: Record<string, any> = {};

    if (changeRequestData.name !== user.name) {
      changes.name = changeRequestData.name;
      currentValues.name = user.name;
    }
    if (changeRequestData.companyName !== user.companyName) {
      changes.company_name = changeRequestData.companyName;
      currentValues.company_name = user.companyName;
    }
    if (changeRequestData.phone !== user.phone) {
      changes.phone = changeRequestData.phone;
      currentValues.phone = user.phone;
    }

    if (Object.keys(changes).length === 0) {
      toast({
        title: "No changes detected",
        description: "Please modify at least one field to request changes",
        variant: "destructive"
      });
      return;
    }

    if (!changeRequestData.reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for requesting these changes",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await ProfileChangeRequestRepository.createChangeRequest(
        user.id,
        changes,
        currentValues,
        changeRequestData.reason
      );

      if (error) throw error;

      toast({
        title: "Change request submitted!",
        description: "Your request has been sent to the administrator for approval",
      });

      setIsChangeRequestDialogOpen(false);
      setChangeRequestData({
        name: user.name || '',
        companyName: user.companyName || '',
        phone: user.phone || '',
        reason: ''
      });

      // Reload change requests
      loadChangeRequests();
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast({
        title: "Request failed",
        description: "Failed to submit change request. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Check if company name is locked (has been set before)
  const isCompanyNameLocked = user?.companyName && user.companyName.trim() !== '';
  

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-elegant">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage your account information</p>
            </div>
          </div>
          
          {/* Countdown Timer */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="text-xs text-muted-foreground">Account Status</div>
            <CountdownTimer
              expiryDate={user?.approval_expires_at || null}
              approvalDate={user?.approved_at || null}
              isActive={user?.is_allowed || false}
              userName={user?.name}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={checkUserApprovalStatus}
              className="text-xs w-full sm:w-auto"
            >
              <Settings className="w-3 h-3 mr-1" />
              Refresh Status
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  View your profile information. To make changes, use the "Request Profile Changes" button below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="name"
                          value={formData.name}
                          disabled={true}
                          className="pl-10 bg-muted"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="email"
                          value={user?.email || ''}
                          disabled
                          className="pl-10 bg-muted"
                          placeholder="Email address"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          disabled={true}
                          className="pl-10 bg-muted"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="flex items-center gap-2">
                        Company Name
                        {isCompanyNameLocked && (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          disabled={true}
                          className="pl-10 bg-muted"
                          placeholder="Enter your company name"
                        />
                      </div>
                      {isCompanyNameLocked && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Company name is locked. Request changes through admin approval.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-6">
                      {/* Profile Change Request Button */}
                      <Dialog open={isChangeRequestDialogOpen} onOpenChange={setIsChangeRequestDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="default"
                            disabled={hasPendingRequest}
                            className="w-full"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {hasPendingRequest ? 'Change Request Pending' : 'Request Profile Changes'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Request Profile Changes</DialogTitle>
                            <DialogDescription>
                              Submit a request to modify your profile information. Admin approval is required.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="requestName">Full Name</Label>
                              <Input
                                id="requestName"
                                value={changeRequestData.name}
                                onChange={(e) => setChangeRequestData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter new name"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="requestCompanyName">Company Name</Label>
                              <Input
                                id="requestCompanyName"
                                value={changeRequestData.companyName}
                                onChange={(e) => setChangeRequestData(prev => ({ ...prev, companyName: e.target.value }))}
                                placeholder="Enter new company name"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="requestPhone">Phone Number</Label>
                              <Input
                                id="requestPhone"
                                value={changeRequestData.phone}
                                onChange={(e) => setChangeRequestData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter new phone number"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="requestReason">Reason for Changes *</Label>
                              <Textarea
                                id="requestReason"
                                value={changeRequestData.reason}
                                onChange={(e) => setChangeRequestData(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Please explain why you need these changes..."
                                rows={3}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsChangeRequestDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleChangeRequest}>
                              Submit Request
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Password Set Request Button (only for Google OAuth users) */}
                      {userProfile && !userProfile.has_password && (
                        <Dialog open={isPasswordRequestDialogOpen} onOpenChange={setIsPasswordRequestDialogOpen}>
                          <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                              disabled={hasPendingRequest}
                              className="w-full"
                            >
                              <Lock className="w-4 h-4 mr-2" />
                              {hasPendingRequest ? 'Password Request Pending' : 'Set Password'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Request Password Setup</DialogTitle>
                              <DialogDescription>
                                Since you signed up with Google, you can request to set a password for email login. Admin approval is required.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                  id="newPassword"
                                  type="password"
                                  value={passwordRequestData.password}
                                  onChange={(e) => setPasswordRequestData(prev => ({ ...prev, password: e.target.value }))}
                                  placeholder="Enter new password (min 6 characters)"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="confirmNewPassword">Confirm Password</Label>
                                <Input
                                  id="confirmNewPassword"
                                  type="password"
                                  value={passwordRequestData.confirmPassword}
                                  onChange={(e) => setPasswordRequestData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  placeholder="Confirm new password"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="passwordReason">Reason for Password Setup *</Label>
                                <Textarea
                                  id="passwordReason"
                                  value={passwordRequestData.reason}
                                  onChange={(e) => setPasswordRequestData(prev => ({ ...prev, reason: e.target.value }))}
                                  placeholder="Please explain why you need password access..."
                                  rows={3}
                                />
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsPasswordRequestDialogOpen(false);
                                  setPasswordRequestData({
                                    password: '',
                                    confirmPassword: '',
                                    reason: ''
                                  });
                                }}
                        >
                          Cancel
                        </Button>
                              <Button onClick={handlePasswordSetRequest}>
                                Submit Password Request
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Password Change Request Button (only for users who have password) */}
                      {userProfile && userProfile.has_password && (
                        <Dialog open={isPasswordChangeDialogOpen} onOpenChange={setIsPasswordChangeDialogOpen}>
                          <DialogTrigger asChild>
                      <Button
                        type="button"
                              variant="outline"
                              disabled={hasPendingRequest}
                              className="w-full"
                            >
                              <Key className="w-4 h-4 mr-2" />
                              {hasPendingRequest ? 'Password Change Pending' : 'Change Password'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Request Password Change</DialogTitle>
                              <DialogDescription>
                                Submit a request to change your current password. Admin approval is required for security.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                  id="currentPassword"
                                  type="password"
                                  value={passwordChangeData.currentPassword}
                                  onChange={(e) => setPasswordChangeData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                  placeholder="Enter your current password"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="newPasswordChange">New Password</Label>
                                <Input
                                  id="newPasswordChange"
                                  type="password"
                                  value={passwordChangeData.newPassword}
                                  onChange={(e) => setPasswordChangeData(prev => ({ ...prev, newPassword: e.target.value }))}
                                  placeholder="Enter new password (min 6 characters)"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="confirmPasswordChange">Confirm New Password</Label>
                                <Input
                                  id="confirmPasswordChange"
                                  type="password"
                                  value={passwordChangeData.confirmPassword}
                                  onChange={(e) => setPasswordChangeData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  placeholder="Confirm new password"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="passwordChangeReason">Reason for Password Change *</Label>
                                <Textarea
                                  id="passwordChangeReason"
                                  value={passwordChangeData.reason}
                                  onChange={(e) => setPasswordChangeData(prev => ({ ...prev, reason: e.target.value }))}
                                  placeholder="Please explain why you need to change your password..."
                                  rows={3}
                                />
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsPasswordChangeDialogOpen(false);
                                  setPasswordChangeData({
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: '',
                                    reason: ''
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handlePasswordChangeRequest}>
                                Submit Change Request
                      </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Status & Security */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>
                  Your account information and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Role</span>
                  </div>
                  <Badge variant="secondary">
                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Account Status</span>
                  </div>
                  <Badge variant={user?.is_allowed ? "default" : "destructive"}>
                    {user?.is_allowed ? 'Active' : 'Pending Approval'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">User ID</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {user?.id}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Available Login Methods</span>
                  </div>
                  <LoginMethodsDisplay userId={user?.id} />
                </div>
              </CardContent>
            </Card>

            {/* Change Request History */}
            <Card>
              <CardHeader>
                <CardTitle>Change Request History</CardTitle>
                <CardDescription>
                  View your profile change requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading requests...
                  </div>
                ) : userChangeRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No change requests submitted yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {userChangeRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {request.status === 'pending' && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending
                              </Badge>
                            )}
                            {request.status === 'approved' && (
                              <Badge variant="default" className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Approved
                              </Badge>
                            )}
                            {request.status === 'rejected' && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Rejected
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <p className="font-medium mb-1">Requested Changes:</p>
                          <ul className="text-muted-foreground space-y-1">
                            {Object.entries(request.requested_changes).map(([key, value]) => (
                              <li key={key} className="flex gap-2">
                                <span className="font-medium capitalize">
                                  {key.replace('_', ' ')}:
                                </span>
                                <span>{String(value)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {request.change_reason && (
                          <div className="text-sm">
                            <p className="font-medium mb-1">Reason:</p>
                            <p className="text-muted-foreground">{request.change_reason}</p>
                          </div>
                        )}
                        
                        {request.admin_response && (
                          <div className="text-sm">
                            <p className="font-medium mb-1">Admin Response:</p>
                            <p className="text-muted-foreground">{request.admin_response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
          </div>
        </div>
        
      </div>
    </UserLayout>
  );
};
