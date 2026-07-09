import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AuthService } from '@/lib/auth-service'

export const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[CALLBACK]: Starting OAuth callback handling')
        console.log('[CALLBACK]: Current URL:', window.location.href)
        console.log('[CALLBACK]: URL search params:', window.location.search)
        
        const { data, error } = await supabase.auth.getSession()
        
        console.log('[CALLBACK]: Session data:', { hasSession: !!data.session, hasUser: !!data.session?.user, error })
        
        // Also check for URL parameters that might indicate an error
        const urlParams = new URLSearchParams(window.location.search)
        const urlError = urlParams.get('error')
        const urlErrorDescription = urlParams.get('error_description')
        
        if (urlError) {
          console.error('[CALLBACK]: URL contains error:', urlError, urlErrorDescription)
        }
        
        if (error || !data.session?.user) {
          console.log('[CALLBACK]: No session or error, redirecting to login')
          navigate('/login')
          return
        }

        console.log('[CALLBACK]: Getting profile for user:', data.session.user.id)
        
        // Get profile with retry (trigger might need time to create profile)
        let profile = null
        let profileError = null
        
        for (let i = 0; i < 5; i++) {
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()
          
          if (result.data) {
            profile = result.data
            profileError = null
            break
          } else {
            profileError = result.error
            console.log(`[CALLBACK]: Profile not found, attempt ${i + 1}/5, waiting...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        console.log('[CALLBACK]: Profile data:', { profile, profileError })

        if (profile) {
          const userData = {
            id: data.session.user.id,
            email: data.session.user.email!,
            name: profile.name,
            companyName: profile.company_name, // Fixed: Include company name
            phone: profile.phone, // Fixed: Include phone
            role: profile.role,
            is_allowed: profile.is_allowed
          }
          
          console.log('[CALLBACK]: Saving user data:', userData)
          AuthService.setUser(userData)
          
          // Check if user is approved before redirecting
          if (userData.is_allowed) {
            console.log('[CALLBACK]: User approved, navigating to dashboard')
            window.location.href = '/dashboard'
          } else {
            console.log('[CALLBACK]: User not approved, redirecting to login for approval message')
            window.location.href = '/login'
          }
        } else {
          console.log('[CALLBACK]: No profile found, attempting to create profile for new Google user')
          
          // Try to create profile for new Google OAuth user
          try {
            const authUser = data.session.user;
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
                phone: authUser.user_metadata?.phone || null,
                company_name: null,
                role: 'user',
                is_allowed: false,
                has_password: false, // Google OAuth users don't have passwords
                password_text: null  // No password for Google users
              })
              .select()
              .single();
            
            if (createError) {
              console.error('[CALLBACK]: Failed to create profile:', createError);
              // If profile creation fails, treat as deleted user
              await supabase.auth.signOut();
              navigate('/login?error=account_deleted');
              return;
            }
            
            console.log('[CALLBACK]: Profile created successfully for new Google user:', newProfile);
            
            // Set user data and redirect
            const userData = {
              id: authUser.id,
              email: authUser.email!,
              name: newProfile.name,
              companyName: newProfile.company_name,
              phone: newProfile.phone,
              role: newProfile.role,
              is_allowed: newProfile.is_allowed
            };
            
            AuthService.setUser(userData);
            
            // New users need approval
            console.log('[CALLBACK]: New Google user created, redirecting for approval');
            window.location.href = '/dashboard'; // Will show approval pending screen
            
          } catch (createError) {
            console.error('[CALLBACK]: Error creating profile for Google user:', createError);
            await supabase.auth.signOut();
            navigate('/login?error=registration_failed');
          }
        }
      } catch (error) {
        console.error('[CALLBACK]: OAuth error:', error)
        navigate('/login')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
      <div className="text-center">
        <Link to="/" className="inline-block">
          <img src="/logo.png" alt="Escrow Daily Hisab" className="w-16 h-16 mx-auto mb-6 hover:opacity-80 transition-all duration-200 cursor-pointer" />
        </Link>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Authenticating...</p>
      </div>
    </div>
  )
}