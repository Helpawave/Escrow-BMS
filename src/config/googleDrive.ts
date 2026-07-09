// Google Drive OAuth2 Configuration (read from env)
// Define these in your .env: VITE_GOOGLE_DRIVE_CLIENT_ID, VITE_GOOGLE_DRIVE_CLIENT_SECRET, VITE_GOOGLE_DRIVE_REDIRECT_URI

export const GOOGLE_DRIVE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID as string,
  CLIENT_SECRET: import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_SECRET as string,

  // Redirect URI for OAuth2 callback
  REDIRECT_URI: typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `${window.location.origin}/auth/google-drive-callback.html`
    : (import.meta.env.VITE_GOOGLE_DRIVE_REDIRECT_URI as string) || 'https://www.bill.escrowbms.in/auth/google-drive-callback.html',

  // Required scopes for Google Drive
  SCOPES: [
    'https://www.googleapis.com/auth/drive.file', // Create and modify files
  ],
};

// Instructions:
// 1. Go to: https://console.cloud.google.com/
// 2. Create a new project (or select existing)
// 3. Enable "Google Drive API"
// 4. Credentials → OAuth 2.0 Client ID (Web)
// 5. Authorized origins: http://localhost:5173, https://www.bill.escrowbms.in
// 6. Redirect URIs: http://localhost:5173/auth/google-drive-callback.html, https://www.bill.escrowbms.in/auth/google-drive-callback.html
// 7. Put Client ID/Secret in .env as VITE_GOOGLE_DRIVE_CLIENT_ID/SECRET

