import { Navigate, Link } from 'react-router-dom'
import { ReactNode, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, BarChart3, ChevronDown } from 'lucide-react'
import CountdownTimer from '@/components/CountdownTimer'

export const UserLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut: logout } = useAuth()
  const checkUserApprovalStatus = async () => {}
  const { toast } = useToast()
  const u = user as any;

  // Listen for approval status changes
  useEffect(() => {
    const handleApprovalChange = (event: CustomEvent) => {
      const { is_allowed } = event.detail
      if (is_allowed) {
        toast({
          title: "Access Approved!",
          description: "Your account has been approved. You now have access to the dashboard.",
        })
        // Force page reload to refresh the UI with new permissions
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast({
          title: "Access Revoked",
          description: "Your account access has been revoked by an administrator.",
          variant: "destructive"
        })
      }
    }

    window.addEventListener('userApprovalChanged', handleApprovalChange as EventListener)

    return () => {
      window.removeEventListener('userApprovalChanged', handleApprovalChange as EventListener)
    }
  }, [])

  // Removed console.log to prevent spam

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Show pending approval screen if user is not allowed
  if (u.is_allowed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Account Pending Approval</CardTitle>
            <CardDescription>
              Your account is awaiting administrator approval
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Hello <span className="font-medium">{u.name || user.email}</span>,
              </p>
              <p className="text-sm text-gray-600">
                Please contact an administrator to get access to the application.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user.email}</span>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary">
                {u?.role || 'user'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={checkUserApprovalStatus} 
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Check Approval Status
              </Button>
              
              <Button 
                onClick={logout} 
                variant="outline" 
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main layout for approved users
  return <>{children}</>;
}
