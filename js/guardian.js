/**
 * Guardian Dashboard JS
 * Handles UI state, map tracking, and dynamic civilian safety monitoring.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Authenticate guardian
  let currentUser = null;
  if (window.rakshikaAuth) {
    currentUser = window.rakshikaAuth.requireAuth('guardian');
  } else {
    try {
      const session = sessionStorage.getItem('rakshika_session');
      if (session) currentUser = JSON.parse(session);
    } catch (e) { console.warn('Session parse error:', e); }
  }

  if (currentUser) {
    const greetingEl = document.getElementById('guardianGreeting');
    if (greetingEl) greetingEl.textContent = `Hi, ${currentUser.name}`;
    const avatarEl = document.getElementById('guardianAvatar');
    if (avatarEl) {
      avatarEl.textContent = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
  }

  // Navigation
  const navDashboard = document.getElementById('navDashboard');
  const navHistory = document.getElementById('navHistory');
  const dashboardSection = document.getElementById('dashboardSection');
  const historySection = document.getElementById('historySection');

  const switchView = (activeNav, activeSection) => {
    [navDashboard, navHistory].forEach(el => el.classList.remove('active'));
    [dashboardSection, historySection].forEach(el => el.classList.add('hidden'));
    [dashboardSection, historySection].forEach(el => el.classList.remove('active'));
    
    activeNav.classList.add('active');
    activeSection.classList.remove('hidden');
    activeSection.classList.add('active');

    // Invalidate map size if switching back to dashboard
    if (activeSection === dashboardSection && window.guardianMap) {
      window.guardianMap.invalidateSize();
    }
  };

  navDashboard.addEventListener('click', (e) => { e.preventDefault(); switchView(navDashboard, dashboardSection); });
  navHistory.addEventListener('click', (e) => { e.preventDefault(); switchView(navHistory, historySection); });

  // Map Initialization with Police Stations
  let map, userMarker, userCircle, safePointMarker, routeLine;
  let stationMarkers = [];
  let userLat = null, userLng = null;

  const initMap = () => {
    map = L.map('guardianMap', { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    window.guardianMap = map;

    // Plot all police stations on load
    if (typeof POLICE_STATIONS !== 'undefined' && typeof haversine !== 'undefined') {
      plotPoliceStations(null, null);
    }
  };

  // ---- Police Station Plotting ----
  const makeStationIcon = (isNearest) => {
    const color = isNearest ? '#10b981' : '#3b82f6';
    const borderColor = isNearest ? '#34d399' : '#60a5fa';
    const size = isNearest ? 44 : 36;
    return L.divIcon({
      html: `<div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:3px solid ${borderColor};
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 12px ${color}66;
        "><span style="transform:rotate(45deg);font-size:${isNearest?'18px':'15px'}">🚔</span></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size],
      popupAnchor: [0, -size],
      className: '',
    });
  };

  const plotPoliceStations = (uLat, uLng) => {
    stationMarkers.forEach(m => map.removeLayer(m));
    stationMarkers = [];

    if (typeof POLICE_STATIONS === 'undefined') return;

    let nearest = null;
    let nearestDist = Infinity;

    const stations = POLICE_STATIONS.map(st => {
      let dist = null;
      if (uLat !== null && uLng !== null) {
        dist = haversine(uLat, uLng, st.lat, st.lng);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = { ...st, dist };
        }
      }
      return { ...st, dist };
    });

    stations.forEach(st => {
      const isNearest = nearest && st.id === nearest.id;
      const icon = makeStationIcon(isNearest);
      const marker = L.marker([st.lat, st.lng], { icon }).addTo(map);
      marker.stationId = st.id;

      const distStr = st.dist !== null ? `${st.dist.toFixed(1)} km away` : 'Distance unknown';
      const nearestLabel = isNearest ? `<span style="color:#10b981;font-weight:700">⭐ NEAREST TO YOU</span><br>` : '';

      marker.bindPopup(`
        <div style="min-width:180px;line-height:1.6">
          ${nearestLabel}
          <strong style="font-size:.9rem">🚔 ${st.name}</strong><br>
          <span style="font-size:.75rem;color:#94a3b8">
            📍 ${st.city}, ${st.district}, ${st.state}<br>
            📞 ${st.phone}<br>
            📏 ${distStr}
          </span>
          <div style="margin-top:8px">
            <a href="tel:${st.phone}" style="color:#3b82f6;font-size:.75rem;font-weight:600">📲 Call Now</a>
          </div>
        </div>`, { maxWidth: 240 });

      if (isNearest) marker.openPopup();
      stationMarkers.push(marker);
    });

    renderGuardianStationList(uLat, uLng, nearest);
    return nearest;
  };

  const renderGuardianStationList = (uLat, uLng, nearest) => {
    const listEl = document.getElementById('guardianStationList');
    if (!listEl || typeof POLICE_STATIONS === 'undefined') return;

    let displayStations = [];
    if (uLat !== null && uLng !== null) {
      displayStations = POLICE_STATIONS
        .map(st => ({ ...st, dist: haversine(uLat, uLng, st.lat, st.lng) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 8);
    } else {
      displayStations = POLICE_STATIONS.slice(0, 8).map(st => ({ ...st, dist: null }));
    }

    if (displayStations.length === 0) {
      listEl.innerHTML = `<div style="font-size:.78rem;color:#94a3b8;font-style:italic;">No stations found.</div>`;
      return;
    }

    listEl.innerHTML = displayStations.map((st, i) => {
      const isFirst = i === 0 && uLat !== null && uLng !== null;
      const distText = st.dist !== null ? `${st.dist.toFixed(1)} km away` : `${st.city}, ${st.state}`;
      return `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;
        background:rgba(30,41,59,0.6);border-radius:8px;
        border:1px solid ${isFirst ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'};
        cursor:pointer;transition:all .18s ease;margin-bottom:6px"
        onclick="(function(){var s=window.POLICE_STATIONS&&window.POLICE_STATIONS.find(function(x){return x.id==='${st.id}'});if(s&&window.guardianMap){window.guardianMap.flyTo([s.lat,s.lng],16)}})()">
        <span style="font-size:1.2rem;flex-shrink:0">${isFirst ? '⭐' : '🚔'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.82rem;margin-bottom:2px;
            color:${isFirst ? '#10b981' : '#e2e8f0'}">${st.name}</div>
          <div style="font-size:.72rem;color:#94a3b8;font-family:'Share Tech Mono',monospace">${distText}</div>
          <a href="tel:${st.phone}" onclick="event.stopPropagation()"
            style="font-size:.7rem;color:#60a5fa;text-decoration:none;font-weight:600">📲 ${st.phone}</a>
        </div>
      </div>`;
    }).join('');
  };

  // Geolocation for guardian
  const locateGuardian = () => {
    if (!navigator.geolocation) {
      showToast('Error', 'Geolocation not supported by your browser.', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;

        const guardianIcon = L.divIcon({
          html: `<div style="position:relative">
            <div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;
              border:3px solid #93c5fd;box-shadow:0 0 12px #3b82f6;"></div>
            <div style="position:absolute;top:-8px;left:-8px;width:30px;height:30px;
              border-radius:50%;border:2px solid rgba(59,130,246,0.4);
              animation:pulseBlue 1.5s ease-out infinite;"></div>
          </div>`,
          iconSize: [14, 14], iconAnchor: [7, 7], className: ''
        });

        if (!window._guardianLocMarker) {
          window._guardianLocMarker = L.marker([userLat, userLng], { icon: guardianIcon, zIndexOffset: 1000 })
            .addTo(map).bindPopup('<strong>📍 Your Location</strong>');
        } else {
          window._guardianLocMarker.setLatLng([userLat, userLng]);
        }

        const nearest = plotPoliceStations(userLat, userLng);
        if (nearest) {
          showToast('📍 Located', `Nearest: ${nearest.name} (${nearest.dist.toFixed(1)} km)`, 'success');
          map.flyTo([userLat, userLng], 13, { duration: 1.2 });
        }
      },
      (err) => {
        showToast('⚠ Location Error', 'Could not get your location. Showing all stations.', 'warning');
        plotPoliceStations(null, null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const btnShowNearest = document.getElementById('btnShowNearestStations');
  if (btnShowNearest) {
    btnShowNearest.addEventListener('click', locateGuardian);
  }

  const btnFitAll = document.getElementById('btnFitAllGuardianStations');
  if (btnFitAll) {
    btnFitAll.addEventListener('click', () => {
      if (typeof POLICE_STATIONS === 'undefined' || !map) return;
      const points = POLICE_STATIONS.map(s => [s.lat, s.lng]);
      if (userLat) points.push([userLat, userLng]);
      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      }
    });
  }

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes pulseBlue {
      0% { transform:scale(1); opacity:0.6; }
      70% { transform:scale(2.5); opacity:0; }
      100% { transform:scale(2.5); opacity:0; }
    }
    @keyframes pulseRed {
      0% { transform:scale(1); opacity:0.6; }
      70% { transform:scale(2.5); opacity:0; }
      100% { transform:scale(2.5); opacity:0; }
    }
  `;
  document.head.appendChild(styleEl);

  // Toast Functionality
  const showToast = (title, msg, type = 'info') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<strong>${title}</strong><br><span style="font-size:0.8rem">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
  };

  // Dynamic Monitored Users State
  let civilians = [];
  let monitoredUser = null;

  async function loadLinkedCivilians() {
    if (!currentUser || !window.rakshikaDb) return;
    const res = await window.rakshikaDb.getLinkedCivilians(currentUser.id || currentUser.email);
    civilians = res.data || [];

    // Fallback simulation mode for testing
    if (civilians.length === 0 && currentUser.email === 'guardian@safety.com') {
      civilians.push({
        id: 'mock-user-priya',
        name: 'Priya Sharma',
        email: 'user@safety.com',
        phone: '+91 98765 43210',
        relation: 'Demo Account'
      });
    }

    renderCiviliansList();
    if (civilians.length > 0) {
      window._selectCivilian(civilians[0].id);
    } else {
      document.getElementById('pageTitle').textContent = "No Linked Users";
      document.getElementById('pageSubtitle').textContent = "Ask civilians to add your email or phone to monitor them.";
      showEmptyStateUI();
    }
  }

  function renderCiviliansList() {
    const container = document.getElementById('linkedUsersListContainer');
    if (!container) return;

    if (civilians.length === 0) {
      container.innerHTML = `
        <div style="font-size:0.75rem;color:var(--text-3);padding:12px;font-style:italic;line-height:1.4;">
          No civilians linked yet.
        </div>
      `;
      return;
    }

    container.innerHTML = civilians.map(c => {
      const isActive = monitoredUser && c.id === monitoredUser.id;
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=${isActive?'3b82f6':'475569'}&color=fff`;
      const relationText = c.relation || 'Civilian';
      const statusId = `statusDot-${c.id}`;
      return `
        <div class="linked-user-item ${isActive ? 'active' : ''}" onclick="window._selectCivilian('${c.id}')" style="cursor:pointer;">
          <img src="${avatarUrl}" alt="${c.name}" />
          <div class="linked-user-info">
            <span>${c.name}</span>
            <small>${relationText}</small>
          </div>
          <div class="status-dot safe" id="${statusId}"></div>
        </div>
      `;
    }).join('');
  }

  window._selectCivilian = function(civilianId) {
    const civilian = civilians.find(c => c.id === civilianId);
    if (!civilian) return;

    monitoredUser = civilian;
    renderCiviliansList();

    // Update UI headers
    document.getElementById('pageTitle').textContent = `Monitoring: ${civilian.name}`;
    document.getElementById('pageSubtitle').textContent = `Keep track of ${civilian.name}'s safety in real-time.`;

    // Reset SOS banner / tracking if we switch
    if (isSOSActive && currentActiveSOSId) {
      stopSOSUI();
    }

    // Enable action controls if they were disabled
    document.getElementById('btnCallUser').disabled = false;
    document.getElementById('btnMsgUser').disabled = false;
    document.getElementById('btnSendSafetyCheck').disabled = false;
    document.getElementById('btnSimulateSOS').disabled = false;

    // Update Quick Actions buttons
    document.getElementById('btnCallUser').innerHTML = `<i data-lucide="phone"></i> Call ${civilian.name}`;
    document.getElementById('btnMsgUser').innerHTML = `<i data-lucide="message-square"></i> Send Message`;

    if (window.lucide) window.lucide.createIcons();

    // Populate history for this civilian
    populateHistory();

    // Check if this civilian currently has an active SOS
    if (window.rakshikaDb) {
      window.rakshikaDb.getActiveSOS().then(res => {
        if (res.data && res.data.length > 0) {
          const activeSOS = res.data.find(s => s.user_id === civilian.id || s.user_id === civilian.email || s.user_phone === civilian.phone || (civilian.id === 'mock-user-priya' && s.user_name === 'Priya Sharma'));
          if (activeSOS) {
            activateSOSUI(activeSOS);
          }
        }
      });
    }
  };

  function showEmptyStateUI() {
    document.getElementById('btnCallUser').disabled = true;
    document.getElementById('btnMsgUser').disabled = true;
    document.getElementById('btnSendSafetyCheck').disabled = true;
    document.getElementById('btnSimulateSOS').disabled = true;
  }

  // Realtime Integration State
  let isSOSActive = false;
  let currentActiveSOSId = null;
  let pathCoordinates = [];

  const MOCK_START = [28.6139, 77.2090]; // Default start fallback
  const SAFE_POINT = [28.6150, 77.2150]; // Nearby Police Station

  // Icons
  const pulseIcon = L.divIcon({
    html: `<div style="position:relative">
      <div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 0 10px #ef4444;"></div>
      <div style="position:absolute;top:-8px;left:-8px;width:30px;height:30px;border-radius:50%;border:2px solid rgba(239,68,68,0.5);animation:pulseRed 1.5s infinite;"></div>
    </div>`,
    iconSize: [14, 14], iconAnchor: [7, 7], className: ''
  });

  const safeIcon = L.divIcon({
    html: `<div style="font-size:24px;">🚔</div>`,
    iconSize: [24, 24], iconAnchor: [12, 12], className: ''
  });

  // Activate SOS UI
  const updateNearestStation = (lat, lng) => {
    const nearest = plotPoliceStations(lat, lng);
    const targetPoint = nearest ? [nearest.lat, nearest.lng] : SAFE_POINT;
    const targetName = nearest ? nearest.name : 'Police Station';

    if (!safePointMarker) {
      safePointMarker = L.marker(targetPoint, { icon: safeIcon }).addTo(map);
    } else {
      safePointMarker.setLatLng(targetPoint);
    }
    safePointMarker.bindPopup(`<b>Nearest Safe Zone</b><br>🚔 ${targetName}${nearest ? `<br>📞 ${nearest.phone}` : ''}`);

    if (!routeLine) {
      routeLine = L.polyline([[lat, lng], targetPoint], { color: '#ef4444', weight: 4, dashArray: '5, 5' }).addTo(map);
    } else {
      routeLine.setLatLngs([[lat, lng], targetPoint]);
    }

    if (typeof haversine !== 'undefined') {
      const dist = haversine(lat, lng, targetPoint[0], targetPoint[1]);
      document.getElementById('safePointDist').textContent = `${targetName} (${dist.toFixed(2)} km)`;
    } else {
      const dist = Math.sqrt(Math.pow(targetPoint[0]-lat, 2) + Math.pow(targetPoint[1]-lng, 2)) * 111;
      document.getElementById('safePointDist').textContent = `${targetName} (${dist.toFixed(2)} km)`;
    }
    document.getElementById('lastUpdatedText').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  };

  const activateSOSUI = (sosData) => {
    if (isSOSActive && currentActiveSOSId === sosData.id) return;
    isSOSActive = true;
    currentActiveSOSId = sosData.id;

    // UI Updates
    document.getElementById('activeAlertBanner').classList.remove('hidden');
    
    // Toggle status dot for monitored user in sidebar
    if (monitoredUser) {
      const dot = document.getElementById(`statusDot-${monitoredUser.id}`);
      if (dot) {
        dot.classList.remove('safe');
        dot.classList.add('danger');
      }
    }
    
    const now = new Date(sosData.created_at || Date.now());
    document.getElementById('alertTime').textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    showToast('🚨 SOS ALERT TRIGGERED', `${sosData.user_name || (monitoredUser ? monitoredUser.name : 'Civilian')} needs immediate assistance!`, 'error');

    const startLat = sosData.latitude || MOCK_START[0];
    const startLng = sosData.longitude || MOCK_START[1];
    
    pathCoordinates = [[startLat, startLng]];
    
    if (!userMarker) {
      userMarker = L.marker([startLat, startLng], { icon: pulseIcon }).addTo(map);
      userMarker.bindPopup(`<b>${sosData.user_name || (monitoredUser ? monitoredUser.name : 'Civilian')}</b><br>Live Location`);
    } else {
      userMarker.setLatLng([startLat, startLng]);
    }
    
    updateNearestStation(startLat, startLng);

    map.setView([startLat, startLng], 15);
  };

  const handleLocationUpdate = (lat, lng) => {
    if (!isSOSActive) return;
    const newPos = [lat, lng];
    pathCoordinates.push(newPos);
    if (userMarker) userMarker.setLatLng(newPos);
    updateNearestStation(lat, lng);
  };

  const stopSOSUI = () => {
    isSOSActive = false;
    currentActiveSOSId = null;
    document.getElementById('activeAlertBanner').classList.add('hidden');
    
    if (monitoredUser) {
      const dot = document.getElementById(`statusDot-${monitoredUser.id}`);
      if (dot) {
        dot.classList.add('safe');
        dot.classList.remove('danger');
      }
    }
    
    if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
    if (safePointMarker) { map.removeLayer(safePointMarker); safePointMarker = null; }
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    
    document.getElementById('safePointDist').textContent = 'Unknown';
    document.getElementById('lastUpdatedText').textContent = 'Tracking stopped';
    showToast('Resolved', 'SOS Alert has been resolved.', 'success');
  };

  // Real-time Database Subscriptions
  if (window.rakshikaDb) {
    // 1. Listen for SOS Alert Triggers or Resolves
    window.rakshikaDb.subscribeToSOS((payload) => {
      const data = payload.data;
      // Match incoming SOS user with any of our linked civilians
      const linkedUser = civilians.find(c => c.id === data.user_id || c.email === data.user_id || c.phone === data.user_phone || (data.user_name === 'Priya Sharma' && c.id === 'mock-user-priya'));
      
      if (!linkedUser) return;

      // Update sidebar status dot
      const dot = document.getElementById(`statusDot-${linkedUser.id}`);
      if (dot) {
        if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && data.status !== 'resolved')) {
          dot.className = 'status-dot danger';
        } else {
          dot.className = 'status-dot safe';
        }
      }

      // If it's the currently selected civilian, update UI
      if (monitoredUser && monitoredUser.id === linkedUser.id) {
        if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && data.status !== 'resolved')) {
          activateSOSUI(data);
        } else if (payload.eventType === 'UPDATE' && data.status === 'resolved') {
          if (currentActiveSOSId === data.id) {
            stopSOSUI();
          }
        }
      }
    });

    // 2. Listen for Location Tracking Updates
    window.rakshikaDb.subscribeToLocation((payload) => {
      const data = payload.data;
      if (isSOSActive && data.session_id === currentActiveSOSId) {
        handleLocationUpdate(data.latitude, data.longitude);
      }
    });
  }

  // Fallback Simulation Logic (if needed manually)
  const simulateSOSClick = () => {
    if (!monitoredUser) return;
    if (window.rakshikaDb && window.rakshikaDb.triggerSOS) {
      window.rakshikaDb.triggerSOS({
        user_name: monitoredUser.name,
        user_phone: monitoredUser.phone,
        user_id: monitoredUser.id || monitoredUser.email,
        latitude: MOCK_START[0],
        longitude: MOCK_START[1]
      }).then(res => {
        if (res.data) activateSOSUI(res.data);
      });
    } else {
      activateSOSUI({ id: 'mock-1', user_name: monitoredUser.name, latitude: MOCK_START[0], longitude: MOCK_START[1] });
    }
  };
  
  // Broadcast Channel for cross-dashboard actions
  window.safetyBc = window.BroadcastChannel ? new BroadcastChannel('rakshika_safety_check') : null;

  // Button Listeners
  document.getElementById('btnSimulateSOS').addEventListener('click', simulateSOSClick);
  document.getElementById('btnAcknowledgeAlert').addEventListener('click', stopSOSUI);
  
  document.getElementById('btnCallUser').addEventListener('click', () => {
    if (!monitoredUser) return;
    showToast('Calling...', `Initiating secure call to ${monitoredUser.name}...`, 'info');
    if (window.safetyBc) window.safetyBc.postMessage({ type: 'QUICK_ACTION', user_email: monitoredUser.email, action: 'call' });
  });

  document.getElementById('btnMsgUser').addEventListener('click', () => {
    if (!monitoredUser) return;
    showToast('Message', 'Opening secure messaging channel...', 'info');
    if (window.safetyBc) window.safetyBc.postMessage({ type: 'QUICK_ACTION', user_email: monitoredUser.email, action: 'message' });
  });

  const markHelpingBtn = document.getElementById('btnMarkHelping');
  if (markHelpingBtn) {
    markHelpingBtn.classList.remove('hidden');
    markHelpingBtn.addEventListener('click', () => {
      if (!monitoredUser) return;
      showToast('Status Updated', 'You are marked as HELPING.', 'success');
      if (window.safetyBc) window.safetyBc.postMessage({ type: 'QUICK_ACTION', user_email: monitoredUser.email, action: 'helping' });
    });
  }

  document.getElementById('btnRecenterMap').addEventListener('click', () => {
    if (userMarker) map.setView(userMarker.getLatLng(), 15);
  });

  document.getElementById('btnRouteUser').addEventListener('click', () => {
    if (userMarker) {
      if (monitoredUser) {
        showToast('Routing', `Opening navigation to ${monitoredUser.name}'s location...`, 'success');
      } else {
        showToast('Routing', 'Opening navigation to user\'s location...', 'success');
      }
    } else {
      showToast('Error', 'User location not active.', 'warning');
    }
  });

  document.getElementById('btnSendSafetyCheck').addEventListener('click', () => {
    if (!monitoredUser) return;
    const inputEl = document.getElementById('safetyCheckMsg');
    const msg = inputEl ? inputEl.value : 'Are you safe?';
    showToast('Sent', `Safety check request sent to ${monitoredUser.name}.`, 'success');
    document.getElementById('safetyReplyBox').classList.add('hidden');
    if (window.safetyBc) window.safetyBc.postMessage({ type: 'REQUEST', user_email: monitoredUser.email, message: msg });
  });

  const safetyInput = document.getElementById('safetyCheckMsg');
  if (safetyInput) {
    safetyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btnSendSafetyCheck').click();
      }
    });
  }

  if (window.safetyBc) {
    window.safetyBc.onmessage = (e) => {
      if (e.data.type === 'REPLY') {
        const replyingUser = civilians.find(c => c.email === e.data.user_email);
        if (!replyingUser) return;

        const box = document.getElementById('safetyReplyBox');
        
        let customMsgHtml = '';
        if (e.data.message) {
          customMsgHtml = `<div style="margin-top:6px; padding:6px; background:#f1f5f9; border-radius:4px; font-style:italic; font-size:0.8rem; color:#475569;">"${e.data.message}"</div>`;
        }

        // Only update dashboard UI reply box if it corresponds to the currently monitored user
        if (monitoredUser && monitoredUser.id === replyingUser.id) {
          if (box) {
            box.classList.remove('hidden');
            if (e.data.status === 'safe') {
              box.innerHTML = `<span class="text-green-600 font-bold">Reply:</span> YES, I am safe.<span class="text-xs text-gray-400 ml-2">Just now</span>${customMsgHtml}`;
            } else if (e.data.status === 'help') {
              box.innerHTML = `<span class="text-red-600 font-bold">Reply:</span> I NEED HELP!<span class="text-xs text-gray-400 ml-2">Just now</span>${customMsgHtml}`;
            }
          }
        }

        if (e.data.status === 'safe') {
          showToast('Reply Received', `${replyingUser.name} marked SAFE. Msg: ` + (e.data.message || '(none)'), 'success');
        } else if (e.data.status === 'help') {
          showToast('EMERGENCY', `${replyingUser.name} needs HELP! Msg: ` + (e.data.message || '(none)'), 'error');
        }
      }
    };
  }

  // History Population
  const populateHistory = () => {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    const name = monitoredUser ? monitoredUser.name : 'Civilian';
    const mockHistory = [
      { date: '10 Jun 2026, 14:30', user: name, duration: '12m 45s', status: 'Resolved' },
      { date: '02 May 2026, 21:15', user: name, duration: '4m 10s', status: 'False Alarm' },
      { date: '15 Jan 2026, 18:40', user: name, duration: '22m 05s', status: 'Police Escorted' }
    ];

    tbody.innerHTML = mockHistory.map(h => {
      let badgeClass = h.status === 'False Alarm' || h.status === 'Resolved' ? 'safe' : 'danger';
      return `
        <tr>
          <td>${h.date}</td>
          <td>${h.user}</td>
          <td>${h.duration}</td>
          <td><span class="badge ${badgeClass}">${h.status}</span></td>
          <td><button class="btn btn-ghost btn-sm">View Report</button></td>
        </tr>
      `;
    }).join('');
  };

  // Initialization
  initMap();
  loadLinkedCivilians();
});
