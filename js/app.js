/* ==========================================================================
   RAKSHIKA — UI COORDINATOR & APP CONTROLLER (JS)
   ========================================================================== */

/* --- Modal Overlays Toggle Helpers --- */
function openAuthModal(defaultRole = 'user') {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('active');
    toggleAuthTab('login');
    
    // Set the selected role dropdown value
    const roleSelect = document.getElementById('loginRole');
    if (roleSelect) {
      if (defaultRole === 'police') roleSelect.value = 'police';
      else if (defaultRole === 'cyber') roleSelect.value = 'cyber';
      else if (defaultRole === 'guardian') roleSelect.value = 'guardian';
      else roleSelect.value = 'user';
      
      updateLoginCredentialsHint();
    }
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function toggleAuthTab(tabName) {
  // Tabs
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  
  // Forms
  const formLogin = document.getElementById('formLogin');
  const formRegister = document.getElementById('formRegister');
  
  const title = document.getElementById('modalTitle');

  // Deactivate all
  [tabLogin, tabRegister].forEach(tab => tab?.classList.remove('active'));
  [formLogin, formRegister].forEach(form => form?.classList.remove('active'));

  if (tabName === 'login') {
    tabLogin?.classList.add('active');
    formLogin?.classList.add('active');
    if (title) title.innerText = "Access Portal";
    updateLoginCredentialsHint();
  } else if (tabName === 'register') {
    tabRegister?.classList.add('active');
    formRegister?.classList.add('active');
    if (title) title.innerText = "Create Protected Account";
  }
}

function updateLoginCredentialsHint() {
  const roleSelect = document.getElementById('loginRole');
  if (!roleSelect) return;
  const role = roleSelect.value;
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPass');
  if (emailInput && passInput) {
    // Only update placeholder — never auto-fill the actual value
    if (role === 'user') {
      emailInput.placeholder = 'e.g. user@safety.com';
    } else if (role === 'guardian') {
      emailInput.placeholder = 'e.g. guardian@safety.com';
    } else if (role === 'police') {
      emailInput.placeholder = 'e.g. police@control.com';
    } else if (role === 'cyber') {
      emailInput.placeholder = 'e.g. cyber@control.com';
    }
    passInput.placeholder = 'Enter your password';
    // Clear any previously filled values to keep form clean
    emailInput.value = '';
    passInput.value = '';
  }
}

// Database Credentials Modal
function openDbSettingsModal() {
  const modal = document.getElementById('dbSettingsModal');
  if (modal) {
    modal.classList.add('active');
    
    // Fill in existing values
    const settings = window.rakshikaDb.getSettings();
    document.getElementById('dbUrl').value = settings.url;
    document.getElementById('dbKey').value = settings.key;
  }
}

function closeDbSettingsModal() {
  document.getElementById('dbSettingsModal')?.classList.remove('active');
}

// Incident Threat Form Modal
function openIncidentModal() {
  document.getElementById('incidentModal')?.classList.add('active');
}

function closeIncidentModal() {
  document.getElementById('incidentModal')?.classList.remove('active');
}

/* --- Auth Submission Managers --- */
async function handleAuthSubmit(event) {
  event.preventDefault();
  
  const roleSelect = document.getElementById('loginRole');
  if (!roleSelect) return;
  const role = roleSelect.value;
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;

  const result = await window.rakshikaAuth.login(email, password, role);

  if (result.success) {
    closeAuthModal();
    if (role === 'user') {
      window.location.href = 'dashboard.html';
    } else if (role === 'police') {
      window.location.href = 'police.html';
    } else if (role === 'cyber') {
      window.location.href = 'cyberdashboard.html';
    } else if (role === 'guardian') {
      window.location.href = 'guardian.html';
    }
  } else if (result.pending) {
    // Show pending verification notice inside the modal
    showAuthNotice(
      '⏳ Account Pending Verification',
      'Your account has been registered but is awaiting Super Admin approval. You will be able to login once the admin verifies your credentials.',
      '#f59e0b'
    );
  } else {
    showAuthNotice('❌ Authentication Failed', result.message, '#ef4444');
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  
  const roleSelect = document.getElementById('regRole');
  const role = roleSelect ? roleSelect.value : 'user';
  
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPass').value;

  const result = await window.rakshikaAuth.register(name, email, password, phone, role);

  if (result.success) {
    if (result.pending) {
      // Police / Cyber Crime — show pending approval screen
      closeAuthModal();
      showPendingVerificationScreen(name, role);
    } else {
      closeAuthModal();
      if (role === 'user') {
        window.location.href = 'dashboard.html';
      } else if (role === 'guardian') {
        window.location.href = 'guardian.html';
      }
    }
  } else {
    showAuthNotice('❌ Registration Failed', result.message, '#ef4444');
  }
}

// Show a styled notice inside or below the auth modal
function showAuthNotice(title, message, color = '#ef4444') {
  // Remove old notice if any
  const old = document.getElementById('authNotice');
  if (old) old.remove();

  const notice = document.createElement('div');
  notice.id = 'authNotice';
  notice.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: rgba(10,13,20,0.97); border: 1px solid ${color}44;
    border-radius: 16px; padding: 32px 28px; max-width: 380px; width: 90%;
    z-index: 9999; text-align: center; box-shadow: 0 0 40px ${color}22;
    font-family: var(--font-body, Inter, sans-serif); color: #e2e8f0;
  `;
  notice.innerHTML = `
    <div style="font-size: 2rem; margin-bottom: 12px;">${title.split(' ')[0]}</div>
    <h3 style="color: ${color}; margin: 0 0 12px; font-size: 1.1rem;">${title.replace(/^\S+\s/, '')}</h3>
    <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.6; margin: 0 0 20px;">${message}</p>
    <button onclick="document.getElementById('authNotice').remove()" style="
      background: ${color}22; border: 1px solid ${color}55; color: ${color};
      padding: 8px 20px; border-radius: 8px; cursor: pointer; font-size: 0.85rem;
    ">OK</button>
  `;
  document.body.appendChild(notice);
}

// Full-screen pending verification page after signup
function showPendingVerificationScreen(name, role) {
  const roleLabel = role === 'police' ? 'Police Responder' : 'Cyber Crime Agent';
  const overlay = document.createElement('div');
  overlay.id = 'pendingVerifyScreen';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(5,7,10,0.98);
    z-index: 99999; display: flex; align-items: center; justify-content: center;
    font-family: var(--font-body, Inter, sans-serif);
  `;
  overlay.innerHTML = `
    <div style="text-align:center; max-width:440px; padding:32px;">
      <div style="font-size:4rem; margin-bottom:16px;">🛡️</div>
      <h1 style="color:#f59e0b; font-size:1.6rem; margin:0 0 8px;">Registration Submitted!</h1>
      <h2 style="color:#e2e8f0; font-size:1rem; font-weight:500; margin:0 0 24px;">Welcome, ${name}</h2>
      <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:12px; padding:20px; margin-bottom:24px; text-align:left;">
        <p style="color:#fbbf24; font-weight:600; margin:0 0 8px;">⏳ Pending Admin Verification</p>
        <p style="color:#94a3b8; font-size:0.875rem; line-height:1.6; margin:0;">
          Your <strong style="color:#e2e8f0;">${roleLabel}</strong> account has been created and is now
          awaiting verification by the <strong style="color:#e2e8f0;">Super Admin</strong>.
          <br><br>
          Once approved, you will be able to login with your credentials.
          This usually takes a few minutes.
        </p>
      </div>
      <div style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:12px; padding:16px; margin-bottom:24px; text-align:left; font-size:0.8rem; color:#94a3b8;">
        <strong style="color:#818cf8;">📋 What happens next?</strong><br><br>
        1. Admin reviews your registration<br>
        2. Admin verifies your credentials<br>
        3. Your account is activated<br>
        4. You can login with your role
      </div>
      <button onclick="document.getElementById('pendingVerifyScreen').remove(); window.location.href='index.html'" style="
        background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4);
        color: #fbbf24; padding: 12px 28px; border-radius: 10px;
        cursor: pointer; font-size: 0.95rem; font-weight:600;
        transition: all 0.2s;
      ">← Return to Home</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function handleLogout() {
  if (confirm("Are you sure you want to end your session?")) {
    await window.rakshikaAuth.logout();
  }
}

function handleDbSettingsSubmit(event) {
  event.preventDefault();
  const url = document.getElementById('dbUrl').value.trim();
  const key = document.getElementById('dbKey').value.trim();

  window.rakshikaDb.setCredentials(url, key);
  closeDbSettingsModal();
}

function clearDbSettings() {
  if (confirm("Reset to mock database mode? Cloud data sync will be disconnected.")) {
    window.rakshikaDb.setCredentials('', '');
    closeDbSettingsModal();
  }
}

/* ==========================================================================
   SOS DASHBOARD CONTROLLERS (Civilian View)
   ========================================================================== */

let isTrackingActive = false;

// Trigger immediate SOS without countdown
function triggerImmediateSOS() {
  startSOSCountdown(true);
}

// SOS Trigger button countdown flow
function startSOSCountdown(bypassDelay = false) {
  const sosBtnView = document.getElementById('sosButtonView');
  const countdownView = document.getElementById('countdownView');
  const cancelBtn = document.getElementById('cancelCountdownBtn');
  const overlay = document.getElementById('emergencyOverlay');
  const banner = document.getElementById('statusBanner');
  
  // Audio context initialization requires user interaction
  window.rakshikaSos._initAudioContext();

  if (bypassDelay) {
    // Jump straight to alarm active state
    if (sosBtnView) sosBtnView.style.display = 'none';
    if (countdownView) countdownView.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (overlay) overlay.classList.add('active');
    
    // Siren trigger & dispatch
    window.rakshikaSos.state = 'active';
    window.rakshikaSos.startAlarmAudio();
    window.rakshikaSos._dispatchEmergencySignal(onEmergencySignalFired);
    return;
  }

  // Normal 3s Countdown Flow
  if (sosBtnView) sosBtnView.style.display = 'none';
  if (countdownView) countdownView.style.display = 'flex';
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';

  const progressCircle = document.getElementById('countdownProgress');
  const numberText = document.getElementById('countdownNumber');

  // Total stroke dasharray offset circumference is 377
  if (progressCircle) progressCircle.style.strokeDashoffset = '0';

  window.rakshikaSos.startCountdown(
    // Ticking callback
    (secondsLeft) => {
      if (numberText) numberText.innerText = secondsLeft;
      if (progressCircle) {
        // Calculate stroke offset: 3s is full (0), 0s is empty (377)
        const offset = 377 - (secondsLeft / 3) * 377;
        progressCircle.style.strokeDashoffset = offset;
      }
    },
    // Complete callback (SOS Fired)
    (latitude, longitude) => {
      if (countdownView) countdownView.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';
      if (overlay) overlay.classList.add('active');
      
      onEmergencySignalFired(latitude, longitude);
    },
    // Cancel callback
    () => {
      // Revert UI to idle
      if (sosBtnView) sosBtnView.style.display = 'block';
      if (countdownView) countdownView.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';
    }
  );
}

// Cancel active countdown
function cancelSOSCountdown() {
  if (window.rakshikaSos && window.rakshikaSos.cancelTrigger) {
    window.rakshikaSos.cancelTrigger();
  }
}

// Callback when SOS successfully triggers
function onEmergencySignalFired(latitude, longitude) {
  const isSilent = window.rakshikaSos.isSilentMode;
  
  // Update safety banners
  const badge = document.getElementById('overallStatusBadge');
  badge.className = isSilent ? 'badge badge-warning' : 'badge badge-danger';
  badge.innerHTML = isSilent ? `<i data-lucide="shield"></i> Silent Shield Active` : `<i data-lucide="shield-alert"></i> EMERGENCY SOS`;
  
  const banner = document.getElementById('statusBanner');
  if (banner) {
    if (isSilent) {
      banner.className = 'glass-panel safety-status-banner warning';
      document.getElementById('statusBannerIcon').className = 'logo-shield';
      document.getElementById('statusBannerTitle').innerText = "Silent SOS Activated";
      document.getElementById('statusBannerDesc').innerText = "Coordinates are broadcasting silently to responder desks.";
    } else {
      banner.className = 'glass-panel safety-status-banner unresolved';
      document.getElementById('statusBannerIcon').className = 'logo-shield'; // changes color to red
      document.getElementById('statusBannerTitle').innerText = "Emergency Broadcast Active";
      document.getElementById('statusBannerDesc').innerText = "Sirens loop active. GPS coordinates dispatched to responders.";
    }
  }

  // Handle emergency overlay silent styling
  const overlay = document.getElementById('emergencyOverlay');
  if (overlay) {
    if (isSilent) {
      overlay.style.background = '#090d16'; // solid dark slate
      overlay.style.animation = 'none'; // remove flashing red border
      
      const sirenIcon = document.querySelector('.siren-icon');
      if (sirenIcon) sirenIcon.style.display = 'none';
      
      const title = document.querySelector('.emergency-title');
      if (title) title.innerText = "Silent Alert Broadcasting";
      
      const subtitle = document.querySelector('.emergency-subtitle');
      if (subtitle) subtitle.innerText = "Background tracking active. Dispatches coordinated discreetly.";
    } else {
      overlay.style.background = ''; // restore normal
      overlay.style.animation = ''; // restore normal flashing
      
      const sirenIcon = document.querySelector('.siren-icon');
      if (sirenIcon) sirenIcon.style.display = 'block';
      
      const title = document.querySelector('.emergency-title');
      if (title) title.innerText = "SOS Alarm Fired";
      
      const subtitle = document.querySelector('.emergency-subtitle');
      if (subtitle) subtitle.innerText = "Emergency signals broadcasted. Sirens playing. Listening for audio cues.";
    }
  }

  // Update active emergency card stats
  document.getElementById('overlayCoords').innerText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  document.getElementById('overlayDispatchStatus').innerText = "Dispatched Unit";
  document.getElementById('overlayDispatchStatus').style.color = "var(--primary)";

  // Update map coordinates user marker
  if (window.rakshikaMap) {
    window.rakshikaMap.updateUserLocation(latitude, longitude);
    window.rakshikaMap.drawSafeRoute(latitude, longitude);
  }

  // Sync to police page via BroadcastChannel / Supabase connection
  // (Done inside _dispatchEmergencySignal database insert)
  
  // Subscribe to changes to dispatch status
  const activeId = sessionStorage.getItem('rakshika_active_sos_id');
  if (activeId) {
    // Check status regularly
    const statusChecker = setInterval(async () => {
      if (window.rakshikaSos.state !== 'active') {
        clearInterval(statusChecker);
        return;
      }
      
      const result = await window.rakshikaDb.getActiveSOS();
      if (result.data) {
        const currentAlert = result.data.find(a => a.id === activeId);
        if (!currentAlert) {
          // Warning: resolved by police!
          clearInterval(statusChecker);
          resolveEmergencyAlert();
          alert("Responders have marked this emergency alert as resolved. Standing down.");
        } else if (currentAlert.status === 'dispatching') {
          // Dispatch status updated
          document.getElementById('overlayDispatchStatus').innerText = "Force En Route";
          document.getElementById('overlayDispatchStatus').style.color = "var(--success)";
        }
      }
    }, 2500);
  }

  lucide.createIcons();
}

// Stop sirens and close alarm overlays
async function resolveEmergencyAlert() {
  const overlay = document.getElementById('emergencyOverlay');
  const sosBtnView = document.getElementById('sosButtonView');
  
  if (overlay) overlay.classList.remove('active');
  if (sosBtnView) sosBtnView.style.display = 'block';

  // De-escalate database state
  await window.rakshikaSos.resolveEmergency(() => {
    // Reset banner to secure
    document.getElementById('overallStatusBadge').className = 'badge badge-success';
    document.getElementById('overallStatusBadge').innerHTML = `<i data-lucide="shield-check"></i> System Secured`;
    
    const banner = document.getElementById('statusBanner');
    if (banner) {
      banner.className = 'glass-panel safety-status-banner';
      document.getElementById('statusBannerTitle').innerText = "All Secure";
      document.getElementById('statusBannerDesc').innerText = "Your emergency signals are idle. Responders are on standby.";
    }

    if (window.rakshikaMap) {
      window.rakshikaMap.clearSafeRoute();
    }

    // Reset silent toggle state
    const silentToggle = document.getElementById('silentModeToggle');
    if (silentToggle) silentToggle.checked = false;
    window.rakshikaSos.isSilentMode = false;
  });

  lucide.createIcons();
}

/* ==========================================================================
   CHECK-IN SAFETY TIMER UI CONTROLLERS
   ========================================================================== */

function startCheckInTimer() {
  const intervalSelect = document.getElementById('timerInterval');
  const btnStart = document.getElementById('btnStartTimer');
  const btnStop = document.getElementById('btnStopTimer');
  const timerDigits = document.getElementById('timerDigits');
  
  if (!intervalSelect || !timerDigits) return;

  const minutes = parseInt(intervalSelect.value);

  // Update layout buttons
  btnStart.style.display = 'none';
  btnStop.style.display = 'inline-flex';
  intervalSelect.style.display = 'none';

  timerDigits.className = 'timer-digits active';

  // Start SOS countdown check-in
  window.rakshikaSos.startCheckIn(
    minutes,
    // OnTick
    (secondsRemaining) => {
      const mins = Math.floor(secondsRemaining / 60);
      const secs = secondsRemaining % 60;
      timerDigits.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      // Critical alert style at under 30s remaining
      if (secondsRemaining < 30) {
        timerDigits.className = 'timer-digits critical';
      }
    },
    // OnExpired (Alarm triggers)
    () => {
      // Revert Check-in controls
      stopCheckInTimer();
      // Panic alert immediately
      triggerImmediateSOS();
    }
  );
}

function stopCheckInTimer() {
  const intervalSelect = document.getElementById('timerInterval');
  const btnStart = document.getElementById('btnStartTimer');
  const btnStop = document.getElementById('btnStopTimer');
  const timerDigits = document.getElementById('timerDigits');

  window.rakshikaSos.stopCheckIn();

  // Reset UI
  if (btnStart) btnStart.style.display = 'inline-flex';
  if (btnStop) btnStop.style.display = 'none';
  if (intervalSelect) intervalSelect.style.display = 'block';
  if (timerDigits) {
    timerDigits.className = 'timer-digits';
    timerDigits.innerText = '00:00';
  }
}

/* ==========================================================================
   FAKE CALL SIMULATOR UI CONTROLLERS
   ========================================================================== */

function triggerFakeCall(delaySeconds = 5) {
  alert(`Scheduling fake rescue call in ${delaySeconds} seconds. Lock your phone or hold it naturally.`);
  
  const overlay = document.getElementById('fakeCallOverlay');
  const callerName = document.getElementById('fakeCallerName');
  
  const contacts = ['Dad', 'Mom', 'Brother', 'Corporate Security', 'Police Dispatcher'];
  const randomContact = contacts[Math.floor(Math.random() * contacts.length)];
  
  if (callerName) callerName.innerText = randomContact;

  window.rakshikaSos.scheduleFakeCall(
    delaySeconds,
    // On Ringing (overlay pops)
    () => {
      overlay.classList.add('active');
    },
    // On Hangup
    () => {
      overlay.classList.remove('active');
    }
  );
}

function declineFakeCall() {
  if (window.rakshikaSos) {
    window.rakshikaSos.cancelFakeCall();
  }
}

let fakeCallTicker = null;

function acceptFakeCall() {
  const status = document.getElementById('fakeCallStatus');
  const btnAccept = document.getElementById('btnAcceptCall');
  
  // Stop ringing sound chime
  window.rakshikaSos._stopRingtoneSynth();

  status.innerText = "00:00";
  btnAccept.style.display = 'none';

  let callSeconds = 0;
  fakeCallTicker = setInterval(() => {
    callSeconds++;
    const mins = Math.floor(callSeconds / 60);
    const secs = callSeconds % 60;
    status.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, 1000);

  // Re-bind decline buttons to terminate call
  const btnDecline = document.querySelector('.call-btn-decline');
  btnDecline.onclick = () => {
    clearInterval(fakeCallTicker);
    btnAccept.style.display = 'inline-flex';
    status.innerText = "Incoming Call...";
    declineFakeCall();
  };
}

/* ==========================================================================
   INCIDENT THREAT LOGGER SUBMISSIONS
   ========================================================================== */

async function handleIncidentSubmit(event) {
  event.preventDefault();
  
  const category = document.getElementById('incCategory').value;
  const location = document.getElementById('incLocation').value.trim();
  const description = document.getElementById('incDesc').value.trim();
  const anonymous = document.getElementById('incAnonymous').checked;
  const user = window.rakshikaAuth.getCurrentUser();

  const incidentData = {
    category,
    location,
    description,
    anonymous,
    user_name: user ? user.name : 'Civilian User',
    latitude: 28.6139, // Default
    longitude: 77.2090
  };

  // Grab location coordinates if possible to map hot spot
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      incidentData.latitude = position.coords.latitude;
      incidentData.longitude = position.coords.longitude;
      await submitReport(incidentData);
    }, async () => {
      await submitReport(incidentData);
    });
  } else {
    await submitReport(incidentData);
  }
}

async function submitReport(incidentData) {
  const result = await window.rakshikaDb.reportIncident(incidentData);
  if (!result.error) {
    alert("Threat details logged successfully. Cyber patrol and hot-spot maps updated.");
    
    // Reset form
    document.getElementById('incLocation').value = '';
    document.getElementById('incDesc').value = '';
    closeIncidentModal();
    
    // Reload table if on police page
    if (typeof loadIncidentsTable === 'function') {
      loadIncidentsTable();
    }
  } else {
    alert(`Submission error: ${result.error}`);
  }
}

/* ==========================================================================
   GPS PATH ROUTING UTILITIES
   ========================================================================== */

function toggleLocationTracking() {
  const btn = document.getElementById('btnStartTracking');
  const dot = document.getElementById('trackingDot');
  const statusText = document.getElementById('trackingStatusText');
  const bar = document.getElementById('trackingStatusBar');

  isTrackingActive = !isTrackingActive;

  if (isTrackingActive) {
    // Start tracking
    btn.className = 'btn btn-primary';
    btn.innerHTML = `<i data-lucide="navigation-off"></i> Stop Tracking`;
    dot.className = 'tracking-dot active';
    statusText.innerText = 'Broadcasting Coordinates...';
    
    // Fetch and plot
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        window.rakshikaMap.updateUserLocation(lat, lng, position.coords.accuracy);
        window.rakshikaMap.drawSafeRoute(lat, lng);
        document.getElementById('trackingCoordsText').innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      });
    }
  } else {
    // Stop tracking
    btn.className = 'btn btn-secondary';
    btn.innerHTML = `<i data-lucide="navigation"></i> Start Tracking`;
    dot.className = 'tracking-dot';
    statusText.innerText = 'GPS Tracking Suspended';
    
    if (window.rakshikaMap) {
      window.rakshikaMap.clearSafeRoute();
    }
  }

  lucide.createIcons();
}

function toggleSilentModeState(checkbox) {
  if (window.rakshikaSos) {
    window.rakshikaSos.isSilentMode = checkbox.checked;
    console.log("SOS Engine: Silent Mode SOS toggled to:", checkbox.checked);
  }
}
