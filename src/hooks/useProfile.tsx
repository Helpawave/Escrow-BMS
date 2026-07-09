import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  is_admin: boolean;
  approval_status: string;
}

export const useProfile = (userId?: string) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (data) {
          const nameParts = (data.full_name || '').split(' ');
          
          // Get email from active session if it matches the current user
          let email = '';
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && session.user.id === userId) {
            email = session.user.email || '';
          }

          setProfile({
            id: data.id,
            email: email,
            first_name: data.first_name || nameParts[0] || null,
            last_name: data.last_name || nameParts.slice(1).join(' ') || null,
            company_name: data.company_name || null,
            is_admin: data.role === 'admin',
            approval_status: 'approved',
          });
        }
      } catch (e) {
        console.error('Error in useProfile:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading };
};
