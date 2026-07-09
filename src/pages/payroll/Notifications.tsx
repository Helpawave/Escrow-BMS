import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { CheckCheck, Bell, FileText, Users, DollarSign, Calendar, Shield, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "payroll" | "leave" | "employee" | "system" | "attendance" | "audit";
}

const initialNotifications: Notification[] = [
  { id: "1", title: "Payroll Run Generated", description: "March 2026 payroll has been generated with 1,240 employees. Ready for review.", time: "10 minutes ago", read: false, type: "payroll" },
  { id: "2", title: "Leave Request Pending", description: "Ankit Patel has requested 5 days paid leave from April 1-5. Awaiting your approval.", time: "1 hour ago", read: false, type: "leave" },
  { id: "3", title: "New Employee Onboarded", description: "Arjun Gupta has been added to the Engineering department as Junior Developer.", time: "3 hours ago", read: false, type: "employee" },
  { id: "4", title: "Tax Filing Deadline", description: "TDS filing for Q4 FY2025-26 is due on March 31. 7 employees have pending declarations.", time: "5 hours ago", read: false, type: "system" },
  { id: "5", title: "Attendance Anomaly", description: "3 employees have not checked in today. Automated reminder sent.", time: "6 hours ago", read: true, type: "attendance" },
  { id: "6", title: "Payroll Locked", description: "February 2026 payroll has been locked by HR Admin. No further edits allowed.", time: "1 day ago", read: true, type: "payroll" },
  { id: "7", title: "Password Policy Update", description: "Company password policy has been updated. All users must reset within 7 days.", time: "2 days ago", read: true, type: "system" },
  { id: "8", title: "Salary Revision Applied", description: "15% increment applied for Ankit Patel effective April 2026.", time: "2 days ago", read: true, type: "employee" },
  { id: "9", title: "Audit Log Alert", description: "Bulk employee data export performed by admin@escoroll.io.", time: "3 days ago", read: true, type: "audit" },
  { id: "10", title: "Leave Balance Reset", description: "Annual leave balances have been carried forward for FY2026-27.", time: "5 days ago", read: true, type: "leave" },
];

const typeIcons: Record<string, React.ElementType> = {
  payroll: DollarSign,
  leave: Calendar,
  employee: Users,
  system: Shield,
  attendance: Bell,
  audit: FileText,
};

const typeStyles: Record<string, string> = {
  payroll: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
  leave: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  employee: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  system: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
  attendance: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
  audit: "bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30",
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayed = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto py-2 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="h-10 w-10 shrink-0 rounded-full border-border/50 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Notifications
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">Stay updated with your latest alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted/50 p-1 rounded-xl flex items-center border shadow-inner">
              <button
                onClick={() => setFilter("all")}
                className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-300 ${
                  filter === "all" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  filter === "unread" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    filter === "unread" ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 h-9 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 hidden sm:flex rounded-lg" 
                onClick={markAllRead}
              >
                <CheckCheck className="h-4 w-4" />
                <span className="font-medium">Mark all read</span>
              </Button>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2 h-9 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all sm:hidden rounded-lg" 
            onClick={markAllRead}
          >
            <CheckCheck className="h-4 w-4" />
            <span className="font-medium">Mark all read</span>
          </Button>
        )}

        <div className="flex flex-col gap-3">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card rounded-2xl border border-dashed border-border shadow-sm">
              <div className="h-16 w-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">You're all caught up!</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">There are no new notifications to display at the moment. We'll alert you when something happens.</p>
            </div>
          ) : (
            displayed.map((n) => {
              const Icon = typeIcons[n.type];
              return (
                <div
                  key={n.id}
                  className={`group relative overflow-hidden flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                    !n.read 
                      ? "bg-card border-primary/20 shadow-md shadow-primary/5 hover:border-primary/40 hover:shadow-lg" 
                      : "bg-background border-transparent hover:border-border hover:bg-card/50"
                  }`}
                >
                  {!n.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  )}
                  
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border shadow-sm transition-transform duration-300 group-hover:scale-110 ${typeStyles[n.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center sm:pr-8 pr-12">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-base tracking-tight ${!n.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                        {n.title}
                      </p>
                      <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-full hidden sm:block">
                        {n.time}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${!n.read ? "text-muted-foreground" : "text-muted-foreground/80"}`}>
                      {n.description}
                    </p>
                    <span className="text-[11px] font-medium text-muted-foreground mt-2 sm:hidden block">
                      {n.time}
                    </span>
                  </div>

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex bg-background/80 backdrop-blur border rounded-full p-1.5 shadow-sm z-10">
                    {n.read ? (
                      <button 
                        onClick={() => toggleRead(n.id)}
                        className="h-8 w-8 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer" 
                        title="Mark as unread"
                      >
                        <Bell className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => toggleRead(n.id)}
                        className="h-8 w-8 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer" 
                        title="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Notifications;

