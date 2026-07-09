import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, Users, CheckCircle2, AlertCircle, Calendar, LogIn, LogOut, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface AttendanceRecord {
  empId: string;
  name: string;
  dept: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: string;
  overtime: string;
}

const initialData: AttendanceRecord[] = [
  { empId: "EMP001", name: "Priya Sharma", dept: "Engineering", date: "2026-03-22", checkIn: "09:02", checkOut: "18:15", hours: "9h 13m", status: "Present", overtime: "1h 13m" },
  { empId: "EMP002", name: "Rahul Verma", dept: "Engineering", date: "2026-03-22", checkIn: "08:45", checkOut: "18:30", hours: "9h 45m", status: "Present", overtime: "1h 45m" },
  { empId: "EMP003", name: "Ankit Patel", dept: "Product", date: "2026-03-22", checkIn: "09:30", checkOut: "17:00", hours: "7h 30m", status: "Half Day", overtime: "—" },
  { empId: "EMP004", name: "Sneha Reddy", dept: "Design", date: "2026-03-22", checkIn: "—", checkOut: "—", hours: "—", status: "Absent", overtime: "—" },
  { empId: "EMP005", name: "Vikram Singh", dept: "Finance", date: "2026-03-22", checkIn: "—", checkOut: "—", hours: "—", status: "On Leave", overtime: "—" },
  { empId: "EMP006", name: "Deepa Nair", dept: "HR", date: "2026-03-22", checkIn: "09:00", checkOut: "18:00", hours: "9h 00m", status: "Present", overtime: "1h 00m" },
  { empId: "EMP007", name: "Arjun Gupta", dept: "Engineering", date: "2026-03-22", checkIn: "10:15", checkOut: "—", hours: "—", status: "Late", overtime: "—" },
  { empId: "EMP008", name: "Kavita Joshi", dept: "Marketing", date: "2026-03-22", checkIn: "08:55", checkOut: "18:10", hours: "9h 15m", status: "Present", overtime: "1h 15m" },
];

const statusStyles: Record<string, string> = {
  Present: "bg-success/10 text-success",
  Absent: "bg-destructive/10 text-destructive",
  "Half Day": "bg-warning/10 text-warning",
  "On Leave": "bg-primary/10 text-primary",
  Late: "bg-warning/10 text-warning",
};

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-3xl font-bold tracking-tight tabular-nums">
      {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
    </span>
  );
}

const Attendance = () => {
  const { hasRole } = useAuth();
  const canCheckInOut = hasRole("hr_manager", "manager", "employee");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AttendanceRecord[]>(initialData);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState("");

  const selectedRecord = data.find((d) => d.empId === selectedEmp);

  const canCheckIn = selectedRecord && selectedRecord.checkIn === "—" && selectedRecord.status !== "On Leave";
  const canCheckOut = selectedRecord && selectedRecord.checkIn !== "—" && selectedRecord.checkOut === "—";
  const isCompleted = selectedRecord && selectedRecord.checkIn !== "—" && selectedRecord.checkOut !== "—";
  const isOnLeave = selectedRecord?.status === "On Leave";

  const getNow = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const handleCheckIn = () => {
    if (!selectedEmp) { toast.error("Select your name first"); return; }
    const time = getNow();
    const hourNum = parseInt(time.split(":")[0]);
    setData((prev) =>
      prev.map((a) =>
        a.empId === selectedEmp
          ? { ...a, checkIn: time, status: hourNum >= 10 ? "Late" : "Present" }
          : a
      )
    );
    toast.success(`Checked in at ${time}`, { description: `Welcome, ${selectedRecord?.name}!` });
  };

  const handleCheckOut = () => {
    if (!selectedEmp || !selectedRecord) return;
    const now = new Date();
    const time = getNow();
    const [inH, inM] = selectedRecord.checkIn.split(":").map(Number);
    const totalMins = (now.getHours() * 60 + now.getMinutes()) - (inH * 60 + inM);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const overtime = totalMins > 480 ? `${Math.floor((totalMins - 480) / 60)}h ${(totalMins - 480) % 60}m` : "—";
    const status = totalMins < 240 ? "Half Day" : selectedRecord.status;

    setData((prev) =>
      prev.map((a) =>
        a.empId === selectedEmp
          ? { ...a, checkOut: time, hours: `${h}h ${String(m).padStart(2, "0")}m`, overtime, status }
          : a
      )
    );
    toast.success(`Checked out at ${time}`, { description: `Total: ${h}h ${m}m. Have a great evening!` });
  };

  const filtered = data.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.empId.toLowerCase().includes(search.toLowerCase()) ||
      a.dept.toLowerCase().includes(search.toLowerCase())
  );

  const present = data.filter((a) => a.status === "Present").length;
  const absent = data.filter((a) => a.status === "Absent").length;
  const late = data.filter((a) => a.status === "Late").length;

  const totalMinutes = data
    .filter((a) => a.hours !== "—")
    .reduce((sum, a) => {
      const match = a.hours.match(/(\d+)h\s*(\d+)m/);
      return sum + (match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0);
    }, 0);
  const workingCount = data.filter((a) => a.hours !== "—").length;
  const avgH = workingCount > 0 ? Math.floor(totalMinutes / workingCount / 60) : 0;
  const avgM = workingCount > 0 ? Math.round((totalMinutes / workingCount) % 60) : 0;

  return (
    <AppLayout title="Attendance">
      <div className="space-y-6">
        {/* Employee Self-Service Check In/Out - only for HR, Manager, Employee */}
        {canCheckInOut && (
        <section className="rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Live clock */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <LiveClock />
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <div className="h-12 w-px bg-border hidden md:block" />

            {/* Employee selector + actions */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Quick Attendance</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                  <SelectTrigger className="sm:w-[260px] bg-background">
                    <SelectValue placeholder="Select your name..." />
                  </SelectTrigger>
                  <SelectContent>
                    {data.map((emp) => (
                      <SelectItem key={emp.empId} value={emp.empId}>
                        {emp.name} ({emp.empId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCheckIn}
                    disabled={!canCheckIn}
                    className="gap-2"
                    variant={canCheckIn ? "default" : "outline"}
                  >
                    <LogIn className="h-4 w-4" />
                    Check In
                  </Button>
                  <Button
                    onClick={handleCheckOut}
                    disabled={!canCheckOut}
                    variant={canCheckOut ? "default" : "outline"}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Check Out
                  </Button>
                </div>
              </div>

              {/* Status feedback */}
              {selectedRecord && (
                <div className="flex items-center gap-3 text-xs">
                  {isOnLeave && (
                    <span className="text-primary font-medium">You are on leave today</span>
                  )}
                  {canCheckIn && !isOnLeave && (
                    <span className="text-muted-foreground">You haven't checked in yet. Click <strong>Check In</strong> to start.</span>
                  )}
                  {canCheckOut && (
                    <span className="text-success font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Checked in at {selectedRecord.checkIn} — click <strong>Check Out</strong> when you leave
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-muted-foreground">
                      ✅ Done for today — {selectedRecord.checkIn} → {selectedRecord.checkOut} ({selectedRecord.hours})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Daily attendance tracking and overtime management</p>
          <Button size="sm" className="gap-2" onClick={() => setCalendarOpen(true)}>
            <Calendar className="h-3.5 w-3.5" />View Calendar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Present Today" value={present.toString()} subtitle={`of ${data.length} employees`} icon={CheckCircle2} />
          <StatCard title="Absent" value={absent.toString()} subtitle="Not checked in" icon={AlertCircle} />
          <StatCard title="Late Arrivals" value={late.toString()} subtitle="After 10:00 AM" icon={Clock} />
          <StatCard title="Avg. Hours" value={`${avgH}h ${String(avgM).padStart(2, "0")}m`} subtitle="Today's average" icon={Users} />
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, ID, or department..." className="pl-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden animate-fade-in">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employee</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Department</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Check In</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Check Out</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hours</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Overtime</th>
                <th className="text-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((att) => (
                <tr key={att.empId} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground">{att.name.split(" ").map((n) => n[0]).join("")}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{att.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{att.empId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm">{att.dept}</td>
                  <td className="px-6 py-3 text-sm text-center font-mono">{att.checkIn}</td>
                  <td className="px-6 py-3 text-sm text-center font-mono">{att.checkOut}</td>
                  <td className="px-6 py-3 text-sm text-center font-mono">{att.hours}</td>
                  <td className="px-6 py-3 text-sm text-center font-mono text-accent">{att.overtime}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusStyles[att.status]}`}>{att.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    {att.status === "Absent" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSelectedEmp(att.empId); handleCheckIn(); }}>Check In</Button>
                    )}
                    {(att.status === "Present" || att.status === "Late") && att.checkOut === "—" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSelectedEmp(att.empId); }}>Check Out</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance Calendar</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">March 2026 Summary</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold font-mono text-success">{present}</p>
                <p className="text-xs text-muted-foreground mt-1">Present</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold font-mono text-destructive">{absent}</p>
                <p className="text-xs text-muted-foreground mt-1">Absent</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold font-mono text-warning">{late}</p>
                <p className="text-xs text-muted-foreground mt-1">Late</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Attendance;
