import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  User as UserIcon,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

// Types
 type Role = "Admin" | "Manager" | "Staff";
 type Status = "Active" | "Invited" | "Suspended";
 type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  lastActive: string; // ISO string
};

const initialUsers: UserRecord[] = [
  {
    id: "u_001",
    name: "Aisha Khan",
    email: "aisha.khan@example.com",
    role: "Admin",
    status: "Active",
    lastActive: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "u_002",
    name: "Rohit Sharma",
    email: "rohit.sharma@example.com",
    role: "Manager",
    status: "Active",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "u_003",
    name: "Emily Chen",
    email: "emily.chen@example.com",
    role: "Staff",
    status: "Invited",
    lastActive: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "u_004",
    name: "Carlos Diaz",
    email: "carlos.diaz@example.com",
    role: "Staff",
    status: "Suspended",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
];

const roleBadgeMap: Record<Role, string> = {
  Admin: "bg-primary/10 text-primary",
  Manager: "bg-muted text-foreground",
  Staff: "bg-accent text-foreground",
};

const statusBadgeMap: Record<Status, string> = {
  Active: "bg-green-500/10 text-green-600 dark:text-green-500",
  Invited: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
  Suspended: "bg-destructive/10 text-destructive",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const Users = () => {
  // SEO
  useEffect(() => {
    document.title = "Users • InventoryPro";
    const descText = "Manage users, roles, and access in your inventory system.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', descText);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/users`);
  }, []);

  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("Staff");

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchesQuery = `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
      const matchesStatus = statusFilter === "all" ? true : u.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const handleAdd = () => {
    if (!newName || !newEmail) {
      toast.error("Please provide name and email");
      return;
    }
    const record: UserRecord = {
      id: `u_${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      status: "Invited",
      lastActive: new Date().toISOString(),
    };
    setUsers(prev => [record, ...prev]);
    setAddOpen(false);
    setNewName("");
    setNewEmail("");
    setNewRole("Staff");
    toast.success("User invited successfully");
  };

  const toggleSuspend = (id: string) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === "Suspended" ? "Active" : "Suspended" } : u
    ));
    toast.info("User status updated");
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success("User removed");
  };

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Users and Roles</h1>
          <p className="text-sm text-muted-foreground mt-1">Invite teammates, manage roles, and control access.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Invite user
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a new user</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" className="col-span-3" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" className="col-span-3" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Role</Label>
                <Select value={newRole} onValueChange={(v: Role) => setNewRole(v)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Send invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <Input
                placeholder="Search users"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full md:w-64"
              />
              <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Invited">Invited</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Last active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{u.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleBadgeMap[u.role]}> 
                        {u.role === "Admin" && <Shield className="mr-1 h-3 w-3" />}
                        {u.role === "Manager" && <ShieldCheck className="mr-1 h-3 w-3" />}
                        {u.role === "Staff" && <ShieldAlert className="mr-1 h-3 w-3" />}
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeMap[u.status]}>{u.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{timeAgo(u.lastActive)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => toast.message("Edit user coming soon")}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleSuspend(u.id)}>
                            {u.status === "Suspended" ? "Activate" : "Suspend"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => removeUser(u.id)}>Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default Users;
