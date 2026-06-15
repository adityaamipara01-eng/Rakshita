/* ==========================================================================
   RAKSHIKA — AUTHENTICATION SERVICE (SUPABASE AUTH INTEGRATION)
   ========================================================================== */

const DEFAULT_USERS = [
  {
    email: 'user@safety.com',
    password: 'password',
    name: 'Rakshika Civilian',
    phone: '+91 98765 43210',
    role: 'user',
    contacts: [
      { name: 'Mother', phone: '+91 98765 00001' },
      { name: 'Brother', phone: '+91 98765 00002' }
    ]
  },
  {
    email: 'police@control.com',
    password: 'password',
    name: 'Officer Rawat',
    phone: '+91 100',
    role: 'police'
  },
  {
    email: 'cyber@control.com',
    password: 'password',
    name: 'Agent Verma',
    phone: '+91 1930',
    role: 'cyber'
  },
  {
    email: 'guardian@safety.com',
    password: 'password',
    name: 'Guardian Rajesh',
    phone: '+91 98765 11111',
    role: 'guardian'
  },
  {
    email: 'adityaamipara@gmail.com',
    password: 'Aditya@01022008',
    name: 'Admin Aditya',
    phone: '+91 99999 00000',
    role: 'superadmin'
  }
];

class AuthService {
  constructor() {
    this._initializeDatabase();
    // Check session in the background
    this.checkSessionAsync();
  }

  // Pre-seed mock users list in localStorage if it doesn't exist
  _initializeDatabase() {
    const existing = localStorage.getItem('rakshika_users');
    if (!existing) {
      localStorage.setItem('rakshika_users', JSON.stringify(DEFAULT_USERS));
    } else {
      try {
        const users = JSON.parse(existing);
        if (!users.find(u => u.email === 'adityaamipara@gmail.com')) {
          users.push({
            email: 'adityaamipara@gmail.com',
            password: 'Aditya@01022008',
            name: 'Admin Aditya',
            phone: '+91 99999 00000',
            role: 'superadmin'
          });
          localStorage.setItem('rakshika_users', JSON.stringify(users));
        }
      } catch (e) {
        localStorage.setItem('rakshika_users', JSON.stringify(DEFAULT_USERS));
      }
    }
  }

  // Register a new user
  async register(name, email, password, phone, role = 'user') {
    if (window.showRakshikaPreloader) {
      window.showRakshikaPreloader("Creating your secure account...");
    }
    try {
      if (window.rakshikaDb && !window.rakshikaDb.isMock) {
        try {
          const client = window.rakshikaDb.client;
          
          // 1. Sign up user in Supabase Auth
          const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: name,
                phone: phone
              }
            }
          });

          if (error) throw error;
          if (!data.user) throw new Error("SignUp failed to return user data.");

          // 2. Create profile row in profiles table
          const profile = {
    id: data.user.id,
    full_name: name,
    email: email,
    phone: phone,
    role: role
};

const { error: profileError } = await client
  .from('profiles')
  .insert([profile]);

if (profileError) {
    console.error("Profile Insert Error:", profileError);
    throw profileError;
}

          if (profileError) {
            console.warn("Failed to insert profile row, check if trigger is already active:", profileError);
          }

          // Cache session
          this._setSession(profile);
          return { success: true, user: profile };

        } catch (err) {
          console.error("Supabase SignUp Error:", err);
          return { success: false, message: err.message };
        }
      }

      // --- Mock Fallback ---
      let users = JSON.parse(localStorage.getItem('rakshika_users') || '[]');
      if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email already registered' };
      }

      // Police and Cyber accounts require Admin verification before they can login
      const requiresVerification = (role === 'police' || role === 'cyber');

      const newUser = {
        name,
        email,
        password,
        phone,
        role: role,
        status: requiresVerification ? 'pending_verification' : 'active',
        registeredAt: new Date().toISOString(),
        contacts: [
          { name: 'Emergency Helpline', phone: '112' }
        ]
      };

      users.push(newUser);
      localStorage.setItem('rakshika_users', JSON.stringify(users));

      // Do NOT create session for pending accounts — they must wait for admin approval
      if (requiresVerification) {
        return { success: true, pending: true, user: newUser };
      }

      this._setSession(newUser);
      return { success: true, pending: false, user: newUser };
    } finally {
      if (window.hideRakshikaPreloader) {
        window.hideRakshikaPreloader();
      }
    }
  }

  // Login
  async login(email, password, expectedRole) {
    if (window.showRakshikaPreloader) {
      window.showRakshikaPreloader("Authenticating & Securing Session...");
    }

    // --- BYPASS LOGIN FOR SPECIFIC CREDENTIALS ---
    if (email === 'adityaamipara@gmail.com' && password === 'Aditya@01022008' && (expectedRole === 'police' || expectedRole === 'cyber')) {
      const bypassUser = {
        id: 'bypass_admin_id',
        name: 'Aditya Amipara',
        email: email,
        phone: '+91 99999 99999',
        role: expectedRole,
        status: 'active',
        contacts: []
      };
      this._setSession(bypassUser);
      if (window.hideRakshikaPreloader) window.hideRakshikaPreloader();
      return { success: true, user: bypassUser };
    }
    // ----------------------------------------------

    try {
      if (window.rakshikaDb && !window.rakshikaDb.isMock) {
        try {
          const client = window.rakshikaDb.client;
          
          // 1. Authenticate with Supabase Auth
          const { data, error } = await client.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          // 2. Fetch profile role details from profiles table
          const { data: profile, error: profileError } = await client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError || !profile) {
            // If profile table doesn't exist or is empty, build a fallback profile from user meta
            const fallbackProfile = {
              id: data.user.id,
              name: data.user.user_metadata.display_name || email.split('@')[0],
              email: email,
              phone: data.user.user_metadata.phone || '+91 99999 88888',
              role: email.includes('police') ? 'police' : (email.includes('cyber') ? 'cyber' : (email.includes('guardian') ? 'guardian' : 'user')), // simple heuristic if database lacks role
              contacts: [{ name: 'Emergency Helpline', phone: '112' }]
            };
            
            if (fallbackProfile.role !== expectedRole) {
              await client.auth.signOut();
              return { success: false, message: `Access denied. Not a registered ${expectedRole}.` };
            }

            this._setSession(fallbackProfile);
            return { success: true, user: fallbackProfile };
          }

          if (profile.role !== expectedRole) {
            await client.auth.signOut();
            return { success: false, message: `Access denied. Not a registered ${expectedRole}.` };
          }

          this._setSession(profile);
          return { success: true, user: profile };

        } catch (err) {
          console.error("Supabase Login Error:", err);
          return { success: false, message: err.message };
        }
      }

      // --- Mock Fallback ---
      const users = JSON.parse(localStorage.getItem('rakshika_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);

      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Block pending verification accounts from logging in
      if (user.status === 'pending_verification') {
        return {
          success: false,
          pending: true,
          message: '⏳ Your account is pending Admin verification. Please wait for the Super Admin to approve your account before logging in.'
        };
      }

      if (user.role !== expectedRole) {
        return { success: false, message: `Access denied. Not a registered ${expectedRole}.` };
      }

      this._setSession(user);
      return { success: true, user };
    } finally {
      if (window.hideRakshikaPreloader) {
        window.hideRakshikaPreloader();
      }
    }
  }

  // Get current cached user session details
  getCurrentUser() {
    const session = sessionStorage.getItem('rakshika_session');
    return session ? JSON.parse(session) : null;
  }

  // Background verification to check if session expired in Supabase
  async checkSessionAsync() {
    if (window.rakshikaDb && !window.rakshikaDb.isMock && window.rakshikaDb.client) {
      try {
        const client = window.rakshikaDb.client;
        const { data: { session } } = await client.auth.getSession();
        
        if (!session) {
          // Cleared session
          const wasLoggedIn = sessionStorage.getItem('rakshika_session');
          sessionStorage.removeItem('rakshika_session');
          
          if (wasLoggedIn && (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('police.html'))) {
            window.location.href = 'index.html?toast=login_required';
          }
        } else {
          // Session valid, fetch latest profile to update cache
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            this._setSession(profile);
          }
        }
      } catch (err) {
        console.warn("Auth Session check failed:", err);
      }
    }
  }

  // Add emergency contact
  async addEmergencyContact(name, phone) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'user') return false;

    if (!currentUser.contacts) currentUser.contacts = [];
    currentUser.contacts.push({ name, phone });

    this._setSession(currentUser);

    // Save in Supabase profiles table if active
    if (window.rakshikaDb && !window.rakshikaDb.isMock) {
      try {
        await window.rakshikaDb.client
          .from('profiles')
          .update({ contacts: currentUser.contacts })
          .eq('id', currentUser.id);
      } catch (err) {
        console.error("Failed to sync contact to Supabase profiles:", err);
      }
    }

    // Always sync mock database for fallback
    let users = JSON.parse(localStorage.getItem('rakshika_users') || '[]');
    const index = users.findIndex(u => u.email === currentUser.email);
    if (index !== -1) {
      users[index].contacts = currentUser.contacts;
      localStorage.setItem('rakshika_users', JSON.stringify(users));
    }
    return true;
  }

  // Remove emergency contact
  async removeEmergencyContact(phone) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'user') return false;

    currentUser.contacts = currentUser.contacts.filter(c => c.phone !== phone);
    this._setSession(currentUser);

    if (window.rakshikaDb && !window.rakshikaDb.isMock) {
      try {
        await window.rakshikaDb.client
          .from('profiles')
          .update({ contacts: currentUser.contacts })
          .eq('id', currentUser.id);
      } catch (err) {
        console.error("Failed to delete contact from Supabase profiles:", err);
      }
    }

    let users = JSON.parse(localStorage.getItem('rakshika_users') || '[]');
    const index = users.findIndex(u => u.email === currentUser.email);
    if (index !== -1) {
      users[index].contacts = currentUser.contacts;
      localStorage.setItem('rakshika_users', JSON.stringify(users));
    }
    return true;
  }

  // Private helper to save session
  _setSession(user) {
    sessionStorage.setItem('rakshika_session', JSON.stringify(user));
  }

  // Log out
  async logout() {
    if (window.rakshikaDb && !window.rakshikaDb.isMock && window.rakshikaDb.client) {
      try {
        await window.rakshikaDb.client.auth.signOut();
      } catch (err) {
        console.warn("SignOut API failed, clearing local credentials anyway:", err);
      }
    }
    sessionStorage.removeItem('rakshika_session');
    window.location.href = 'index.html';
  }

  // Enforce access control on dashboards
  requireAuth(role) {
    const user = this.getCurrentUser();
    
    if (!user) {
      window.location.href = 'index.html?toast=login_required';
      return null;
    }

    if (role && user.role !== role) {
      if (user.role === 'police') {
        window.location.href = 'police.html';
      } else if (user.role === 'cyber') {
        window.location.href = 'cyberdashboard.html';
      } else if (user.role === 'guardian') {
        window.location.href = 'guardian.html';
      } else {
        window.location.href = 'dashboard.html';
      }
      return null;
    }

    return user;
  }
}

// Global Singleton
window.rakshikaAuth = new AuthService();

// ============================================================
// GLOBAL RAKSHIKA BRAND PRELOADER & SPA PAGE TRANSITIONS
// ============================================================
(function() {
  // 1. Inject Stylesheet
  const style = document.createElement('style');
  style.textContent = `
    .rakshika-preloader {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: #070b12;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      z-index: 999999;
      transition: opacity 0.4s ease, visibility 0.4s ease;
      opacity: 1; visibility: visible;
    }
    .rakshika-preloader.fade-out {
      opacity: 0; visibility: hidden;
    }
    .rakshika-preloader-logo {
      height: 70px; width: auto;
      margin-bottom: 20px;
      animation: pulseLogo 2s infinite ease-in-out;
    }
    .rakshika-preloader-spinner {
      width: 32px; height: 32px;
      border: 3px solid rgba(59, 130, 246, 0.1);
      border-radius: 50%;
      border-top-color: #3b82f6;
      animation: spinSpinner 0.8s infinite linear;
      margin-bottom: 16px;
    }
    .rakshika-preloader-text {
      color: #94a3b8;
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      letter-spacing: 0.05em;
    }
    @keyframes spinSpinner {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulseLogo {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(59,130,246,0.3)); }
      50% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(59,130,246,0.6)); }
    }
  `;
  document.head.appendChild(style);

  // 2. Inject HTML Preloader structure
  const preloaderDiv = document.createElement('div');
  preloaderDiv.className = 'rakshika-preloader';
  preloaderDiv.id = 'rakshikaPreloader';
  preloaderDiv.innerHTML = `
    <img src="assets/logo.png" alt="Rakshika Logo" class="rakshika-preloader-logo">
    <div class="rakshika-preloader-spinner"></div>
    <div class="rakshika-preloader-text" id="rakshikaPreloaderText">Loading Safety Environment...</div>
  `;
  document.body.insertBefore(preloaderDiv, document.body.firstChild);

  // 3. Expose global show/hide helper functions
  window.showRakshikaPreloader = function(text) {
    const p = document.getElementById('rakshikaPreloader');
    const t = document.getElementById('rakshikaPreloaderText');
    if (t && text) t.textContent = text;
    if (p) {
      p.classList.remove('fade-out');
    }
  };

  window.hideRakshikaPreloader = function() {
    const p = document.getElementById('rakshikaPreloader');
    if (p) {
      p.classList.add('fade-out');
    }
  };

  // 4. Hide on load
  window.addEventListener('load', () => {
    setTimeout(window.hideRakshikaPreloader, 500);
  });

  // Fallback timeout in case load event takes too long
  setTimeout(window.hideRakshikaPreloader, 2500);

  // 5. Page transition: intercept all link clicks to fade-out smoothly
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && !link.hash && link.target !== '_blank' && !link.href.startsWith('javascript:') && !link.href.startsWith('tel:')) {
      const url = link.href;
      if (url.startsWith(window.location.origin) || url.startsWith('/') || !url.includes('://')) {
        e.preventDefault();
        window.showRakshikaPreloader("Navigating securely...");
        setTimeout(() => {
          window.location.href = url;
        }, 300);
      }
    }
  });
})();
