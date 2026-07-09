import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building2 } from 'lucide-react';

interface CompanySetupModalProps {
  open: boolean;
  onClose: () => void;
}

export const CompanySetupModal = ({ open, onClose }: CompanySetupModalProps) => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState(user?.companyName || '');

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter your company name",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[COMPANY_SETUP] Saving company name:', companyName.trim());
      console.log('[COMPANY_SETUP] User before update:', user);
      
      await updateUser({ companyName: companyName.trim() });
      
      console.log('[COMPANY_SETUP] Company name saved successfully');
      
      toast({
        title: "Company name saved!",
        description: "Your company name has been set successfully",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save company name",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Set Company Name
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please enter your company name. This will be displayed on your dashboard and included in PDF reports.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="Enter your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Company Name
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
