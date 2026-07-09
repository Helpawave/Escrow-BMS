// supabase-admin.ts — stub, no Supabase dependency
// Admin functionality handled via localStorage in AdminDashboard

export const supabaseAdmin = null;

export const AdminService = {
  updateUserPassword: async (_userId: string, _newPassword: string) => ({ data: null, error: null }),
  changeUserPassword: async (_userId: string, _newPassword: string) => ({ data: null, error: null }),
  getUserById: async (_userId: string) => ({ data: null, error: null }),
  listUsers: async () => ({ data: { users: [] }, error: null }),
  deleteUser: async (_userId: string) => ({ data: null, error: null }),
};
