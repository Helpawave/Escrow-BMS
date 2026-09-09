import { useAuth } from "@/contexts/AuthContext";

export function StaffHeaderBadge() {
  const { isStaff, companyProfile, profile, staffName, ownerName } = useAuth();

  if (!isStaff) return null;

  const resolvedCompany = companyProfile?.company_name || profile?.company_name || ownerName || 'Company';
  const resolvedStaff = staffName || 'Staff';

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 border border-border/70 text-xs text-muted-foreground font-normal">
      <span className="font-medium text-foreground/80">{resolvedCompany}</span>
      <span className="text-muted-foreground/40 font-light">|</span>
      <span>Staff: <span className="font-medium text-foreground/80">{resolvedStaff}</span></span>
    </div>
  );
}
