// Google Drive API with direct Google Cloud Console OAuth2
import { GOOGLE_DRIVE_CONFIG } from '../config/googleDrive';

interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}

export class GoogleDriveAPI {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isAuthenticating: boolean = false;
  private isRefreshing: boolean = false;

  constructor() {
    this.accessToken = localStorage.getItem('google_drive_token');
    this.refreshToken = localStorage.getItem('google_drive_refresh_token');
  }

  // Check if user is authenticated (has valid token)
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Try to ensure we have a valid token (refresh if needed)
  async ensureAuthenticated(): Promise<boolean> {
    // If we have a token, assume it's valid (will be refreshed on 401)
    if (this.accessToken) {
      return true;
    }

    // If we have refresh token, try to refresh
    if (this.refreshToken) {
      return await this.refreshAccessToken();
    }

    return false;
  }

  // Automatic OAuth2 authentication using Google Cloud Console
  async authenticate(): Promise<boolean> {
    if (this.isAuthenticating) return false;
    this.isAuthenticating = true;

    try {
      // First, check localStorage for auth code (cross-browser/tab scenario)
      const storedCode = localStorage.getItem('google_drive_auth_code');
      const storedTimestamp = localStorage.getItem('google_drive_auth_timestamp');
      if (storedCode && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp, 10);
        // Clear stored code immediately to prevent another run attempting to consume it simultaneously
        localStorage.removeItem('google_drive_auth_code');
        localStorage.removeItem('google_drive_auth_timestamp');
        localStorage.removeItem('google_drive_auth_state');

        // Only use if stored within last 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          const exchanged = await this.exchangeCodeForTokens(storedCode);
          if (exchanged) {
            this.isAuthenticating = false;
            return true;
          }
        }
      }

      // Check if we have a refresh token
      if (this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          this.isAuthenticating = false;
          return true;
        }
      }

      // Generate OAuth2 URL with Google Cloud Console credentials
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_DRIVE_CONFIG.CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(GOOGLE_DRIVE_CONFIG.REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(GOOGLE_DRIVE_CONFIG.SCOPES.join(' '))}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(JSON.stringify({ timestamp: Date.now() }))}`;

      // Open OAuth2 popup
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Wait for OAuth2 callback with timeout (5 minutes max)
      return new Promise((resolve) => {
        const AUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes
        let messageHandler: ((event: MessageEvent) => void) | null = null;
        let timeoutId: any = null;
        let localStorageCheckInterval: any = null;

        const cleanup = () => {
          if (messageHandler) {
            window.removeEventListener('message', messageHandler);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          if (localStorageCheckInterval) {
            clearInterval(localStorageCheckInterval);
          }
        };

        let isHandlingCode = false;

        const handleAuthCode = async (code: string) => {
          if (isHandlingCode) return;
          isHandlingCode = true;

          cleanup();
          const ok = await this.exchangeCodeForTokens(code);
          // Clear localStorage after use
          try {
            localStorage.removeItem('google_drive_auth_code');
            localStorage.removeItem('google_drive_auth_state');
            localStorage.removeItem('google_drive_auth_timestamp');
          } catch (e) {
            // Ignore localStorage errors
          }
          // Let popup close itself to avoid COOP warnings
          this.isAuthenticating = false;
          resolve(ok);
        };

        // Timeout after 5 minutes
        timeoutId = setTimeout(() => {
          cleanup();
          // Let popup close itself or user close manually
          this.isAuthenticating = false;
          resolve(false);
        }, AUTH_TIMEOUT);

        // Removed checkClosedInterval to prevent COOP warnings
        // We now rely entirely on localStorage Check and message events

        // Also check localStorage periodically (fallback for cross-browser scenarios)
        // More frequent check for cross-browser login scenarios
        localStorageCheckInterval = setInterval(() => {
          const storedCode = localStorage.getItem('google_drive_auth_code');
          const storedTimestamp = localStorage.getItem('google_drive_auth_timestamp');

          if (storedCode && storedTimestamp) {
            const timestamp = parseInt(storedTimestamp, 10);
            // Only use if stored within last 5 minutes (longer window for cross-browser)
            if (Date.now() - timestamp < 5 * 60 * 1000) {
              cleanup();
              handleAuthCode(storedCode).catch(() => resolve(false));
            }
          }
        }, 500); // Check every 500ms for faster detection

        // Listen for OAuth2 callback via postMessage
        messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'GOOGLE_DRIVE_AUTH_CODE') {
            handleAuthCode(event.data.code).catch(() => {
              cleanup();
              // Let popup close itself
              resolve(false);
            });
          } else if (event.data.type === 'GOOGLE_DRIVE_AUTH_ERROR') {
            cleanup();
            // Let popup close itself
            resolve(false);
          }
        };

        window.addEventListener('message', messageHandler);
      });

    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      this.isAuthenticating = false;
      return false;
    }
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken || this.isRefreshing) return false;
    this.isRefreshing = true;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
          client_secret: GOOGLE_DRIVE_CONFIG.CLIENT_SECRET,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
          this.refreshToken = null;
          localStorage.removeItem('google_drive_refresh_token');
        }
        this.isRefreshing = false;
        return false;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      localStorage.setItem('google_drive_token', data.access_token);

      this.isRefreshing = false;
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.isRefreshing = false;
      return false;
    }
  }

  // Exchange authorization code for tokens
  private async exchangeCodeForTokens(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
          client_secret: GOOGLE_DRIVE_CONFIG.CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: GOOGLE_DRIVE_CONFIG.REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Code exchange failed with status:', response.status, errorText);
        if (response.status === 400 || response.status === 401) {
          // The code is invalid or already used. Clear it and related state.
          this.accessToken = null;
          this.refreshToken = null;
          localStorage.removeItem('google_drive_token');
          localStorage.removeItem('google_drive_refresh_token');
          localStorage.removeItem('google_drive_auth_code');
        }
        return false;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token ?? this.refreshToken;
      if (this.accessToken) localStorage.setItem('google_drive_token', this.accessToken);
      if (this.refreshToken) localStorage.setItem('google_drive_refresh_token', this.refreshToken);
      return true;
    } catch (error) {
      console.error('Code exchange network error:', error);
      return false;
    }
  }


  // Upload PDF to Google Drive directly
  async uploadPDF(pdfBlob: Blob, fileName: string): Promise<GoogleDriveFile | null> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    const doUpload = async () => {
      console.time('drive-doUpload');
      const metadata = { name: fileName, mimeType: 'application/pdf' };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', pdfBlob);

      const result = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: form,
      });
      console.timeEnd('drive-doUpload');
      return result;
    };

    try {
      console.time('drive-firstUpload');
      let response = await doUpload();
      console.timeEnd('drive-firstUpload');

      // If unauthorized/forbidden, attempt refresh, then interactive re-auth
      if (!response.ok && (response.status === 401 || response.status === 403)) {
        console.log('Drive: Got 401/403, attempting token refresh...');
        console.time('drive-tokenRefresh');
        if (this.refreshToken) {
          const refreshed = await this.refreshAccessToken();
          console.timeEnd('drive-tokenRefresh');
          if (refreshed) {
            console.log('Drive: Token refreshed, retrying upload...');
            console.time('drive-retryUpload');
            response = await doUpload();
            console.timeEnd('drive-retryUpload');
          }
        }

        if (!response.ok && (response.status === 401 || response.status === 403)) {
          console.log('Drive: Still 401/403, attempting interactive re-auth...');
          console.time('drive-interactiveAuth');
          this.accessToken = null;
          localStorage.removeItem('google_drive_token');

          const ok = await this.authenticate();
          console.timeEnd('drive-interactiveAuth');
          if (ok && this.accessToken) {
            console.log('Drive: Re-authenticated, retrying upload...');
            console.time('drive-finalRetry');
            response = await doUpload();
            console.timeEnd('drive-finalRetry');
          }
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Drive API Error:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const fileData = await response.json();

      // Make file publicly accessible (best-effort)
      try {
        console.time('drive-makePublic');
        await this.makeFilePublic(fileData.id);
        console.timeEnd('drive-makePublic');
      } catch (e) {
        console.warn('Failed to make file public (continuing):', e);
      }

      return {
        id: fileData.id,
        name: fileData.name,
        webViewLink: `https://drive.google.com/file/d/${fileData.id}/view`,
        webContentLink: `https://drive.google.com/uc?export=download&id=${fileData.id}`,
      };
    } catch (error) {
      console.error('PDF upload failed:', error);
      return null;
    }
  }

  // Make file publicly accessible
  private async makeFilePublic(fileId: string): Promise<void> {
    if (!this.accessToken) return;

    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
    } catch (error) {
      console.error('Failed to make file public:', error);
    }
  }
}

export const googleDriveAPI = new GoogleDriveAPI();
export type { GoogleDriveFile };
