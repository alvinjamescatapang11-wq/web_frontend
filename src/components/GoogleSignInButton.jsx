import { useEffect, useRef, useState } from 'react';
import { googleClientId, loadGoogleIdentity } from '../integrations/google.js';

export default function GoogleSignInButton({ onCredential }) {
  const button = useRef(null);
  const credentialHandler = useRef(onCredential);
  const [error, setError] = useState('');
  const clientId = googleClientId();
  credentialHandler.current = onCredential;

  useEffect(() => {
    if (!clientId || !button.current) return undefined;
    let active = true;
    loadGoogleIdentity()
      .then((google) => {
        if (!active || !button.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) credentialHandler.current(response.credential);
          },
          auto_select: false,
        });
        google.accounts.id.renderButton(button.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 360,
        });
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });
    return () => { active = false; };
  }, [clientId]);

  if (!clientId) return <p className="google-signin-note">Google Sign-In is unavailable until VITE_GOOGLE_CLIENT_ID is configured.</p>;
  return <div className="google-signin-area">
    <div className="google-signin-button" ref={button} />
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
