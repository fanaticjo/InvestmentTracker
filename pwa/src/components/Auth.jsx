import { useState, useEffect } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function Auth({ onLogin, children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already signed in (token in localStorage)
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
      onLogin(savedToken);
      setLoading(false);
      return;
    }

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogleSignIn();
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initGoogleSignIn = () => {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      setLoading(false);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: true,
      login_uri: undefined,
      allowed_parent_origin: undefined,
    });

    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      { 
        theme: 'outline', 
        size: 'large', 
        width: '300',
        text: 'signin_with',
        shape: 'rectangular'
      }
    );

    // Also try One Tap
    window.google.accounts.id.prompt();
    setLoading(false);
  };

  const handleCredentialResponse = (response) => {
    const token = response.credential;
    
    // Decode JWT to get user info (no verification needed client-side)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if email is allowed
    const allowedEmails = ['mohapatrabiswajit744@gmail.com'];
    if (!allowedEmails.includes(payload.email.toLowerCase())) {
      alert('⛔ Access denied. This app is private.\n\nOnly authorized accounts can use this tracker.');
      if (window.google) {
        window.google.accounts.id.disableAutoSelect();
      }
      return;
    }
    
    const userData = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    };

    // Save to localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    
    setUser(userData);
    onLogin(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    onLogin(null);
    
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  // Show app if logged in
  if (user) {
    return (
      <div>
        <div className="user-bar">
          <img src={user.picture} alt="" className="user-avatar" />
          <span className="user-name">{user.name}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
        {children}
      </div>
    );
  }

  // Show login screen
  if (loading) {
    return <div className="login-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>💰 Investment Tracker</h1>
        <p>Sign in with your Google account to access your financial data.</p>
        <div id="google-signin-btn"></div>
        {!GOOGLE_CLIENT_ID && (
          <p className="error-text">
            ⚠️ Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to .env
          </p>
        )}
      </div>
    </div>
  );
}

export default Auth;
