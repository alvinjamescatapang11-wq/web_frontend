let googleScript;

export function googleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleScript) return googleScript;

  googleScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error('Google Identity Services did not initialize.'));
    };
    script.onerror = () => {
      googleScript = null;
      reject(new Error('Google Identity Services could not be loaded.'));
    };
    document.head.appendChild(script);
  });
  return googleScript;
}

export async function requestDriveFileAccess() {
  const clientId = googleClientId();
  if (!clientId) throw new Error('Google Sheets export is not configured.');
  const google = await loadGoogleIdentity();
  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || 'Google authorization was not completed.'));
          return;
        }
        resolve(response.access_token);
      },
    });
    tokenClient.requestAccessToken();
  });
}
