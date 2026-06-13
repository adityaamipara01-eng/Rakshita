/* ============================================================
   RAKSHIKA — ADVANCED SOS DASHBOARD CONTROLLER v2.0
   js/dashboard.js
   Features:
     - SOS type selector: normal / silent / panic
     - Threat level selector: low / medium / high / critical
     - Panic full-screen overlay
     - Live tracking bar with coordinates
     - Active session badge
     - Shake-to-SOS via device accelerometer
     - Check-in timer with auto-SOS
     - Safety status panel
     - Map integration
     - Evidence + FIR modules
============================================================ */

(function () {
  'use strict';

  /* ============================================================
     STATE
  ============================================================ */
  const S = {
    safetyStatus:     'safe',       // safe | alert | emergency
    sosActive:        false,
    sosType:          'normal',     // normal | silent | panic
    threatLevel:      'medium',     // low | medium | high | critical
    silentMode:       false,
    currentUser:      null,
    sosAlertId:       null,
    trackingTimer:    null,
    checkinTimer:     null,
    checkinTotal:     0,
    checkinRemaining: 0,
    lastLat:          null,
    lastLng:          null,
    DB:               null,
    evidenceManager:  null,
    firManager:       null,
    dashMap:          null,
    shakeBuffer:      [],
    shakeLastTime:    0,
    shakeEnabled:     true,
    cases:            [],
    selectedCaseId:   null,
  };

  /* ============================================================
     DOM REFS
  ============================================================ */
  let $sosBtn, $sosBtnLabel, $sosBtnSub, $sosStatusText, $silentToggle;
  let $safetyChip, $clockEl;
  let $checkinDisplay, $checkinStart, $checkinStop, $checkinMins;
  let $trackingBar, $trackingCoordsText;
  let $panicOverlay, $overlayCoords, $overlayType, $overlayThreat;
  let $panicCancelBtn;
  let $activeSessionBadge, $sessionIdDisplay;

  /* ============================================================
     ENTRY POINT
  ============================================================ */
  function _initAll() {
    _cacheDOM();
    _startClock();
    _initSidebar();
    _initDB();
    _initSOSTypeSelector();
    _initThreatSelector();
    _initSOS();
    _initCheckinTimer();
    _initSafetyStatus();
    _initMap();
    _initEvidenceModule();
    _initFIRModule();
    _initShakeDetection();
    _syncFromSession();
    _initCaseTracking();
    _initFeatureLockdown();
    _initGuardianLinking();
  }

  if (document.readyState !== 'loading') {
    _initAll();
  } else {
    document.addEventListener('DOMContentLoaded', _initAll);
  }

  /* ============================================================
     DOM CACHE
  ============================================================ */
  function _cacheDOM() {
    $sosBtn              = document.getElementById('sosBigBtn');
    $sosBtnLabel         = document.getElementById('sosBtnLabel');
    $sosBtnSub           = document.getElementById('sosBtnSub');
    $sosStatusText       = document.getElementById('sosStatusText');
    $silentToggle        = document.getElementById('silentToggle');
    $safetyChip          = document.getElementById('safetyChip');
    $clockEl             = document.getElementById('dashClock');
    $checkinDisplay      = document.getElementById('checkinDisplay');
    $checkinStart        = document.getElementById('btnCheckinStart');
    $checkinStop         = document.getElementById('btnCheckinStop');
    $checkinMins         = document.getElementById('checkinMins');
    $trackingBar         = document.getElementById('trackingBar');
    $trackingCoordsText  = document.getElementById('trackingCoordsText');
    $panicOverlay        = document.getElementById('sosPanicOverlay');
    $overlayCoords       = document.getElementById('overlayCoords');
    $overlayType         = document.getElementById('overlayType');
    $overlayThreat       = document.getElementById('overlayThreat');
    $panicCancelBtn      = document.getElementById('panicCancelBtn');
    $activeSessionBadge  = document.getElementById('activeSessionBadge');
    $sessionIdDisplay    = document.getElementById('sessionIdDisplay');
  }

  /* ============================================================
     CLOCK
  ============================================================ */
  function _startClock() {
    const tick = () => {
      if ($clockEl) $clockEl.textContent = new Date().toLocaleTimeString('en-IN', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ============================================================
     DB INIT
  ============================================================ */
  function _initDB() {
    S.DB = window.rakshikaDb || null;

    if (window.rakshikaAuth) {
      S.currentUser = window.rakshikaAuth.requireAuth('user');
    } else {
      try {
        const session = sessionStorage.getItem('rakshika_session');
        if (session) S.currentUser = JSON.parse(session);
      } catch (e) { console.warn('Session parse error:', e); }
    }

    if (S.currentUser) {
      const nameEl = document.querySelector('.user-info .uname');
      if (nameEl && S.currentUser.name) nameEl.textContent = S.currentUser.name;
      const avatarEl = document.querySelector('.user-avatar');
      if (avatarEl && S.currentUser.name) avatarEl.textContent = S.currentUser.name.charAt(0).toUpperCase();
    }
  }

  /* ============================================================
     SESSION SYNC
  ============================================================ */
  function _syncFromSession() {
    const saved = sessionStorage.getItem('rak_sos_active');
    if (saved === 'true') {
      S.sosActive   = true;
      S.sosAlertId  = sessionStorage.getItem('rak_sos_id') || null;
      S.sosType     = sessionStorage.getItem('rak_sos_type') || 'normal';
      S.threatLevel = sessionStorage.getItem('rak_threat') || 'medium';
      S.silentMode  = sessionStorage.getItem('rak_silent') === 'true';

      // Restore last known coordinates
      const savedLat = parseFloat(sessionStorage.getItem('rak_last_lat'));
      const savedLng = parseFloat(sessionStorage.getItem('rak_last_lng'));
      if (!isNaN(savedLat) && !isNaN(savedLng)) {
        S.lastLat = savedLat;
        S.lastLng = savedLng;
      }

      window.rakshikaSos.activeSessionId = S.sosAlertId;
      window.rakshikaSos.state          = 'active';
      window.rakshikaSos.isSilentMode   = S.silentMode;
      window.rakshikaSos.threatLevel    = S.threatLevel;

      _updateSOSUI(true);
      _showTrackingBar(true);
      window.rakshikaSos.startLiveTrackingLoop(S.sosAlertId);
      _setSafetyStatus('emergency');
      dashToast('\uD83D\uDEA8 SOS Restored', 'Emergency tracking is still active.', 'error');

      // Auto-show nearest station after map initializes (map loads after this runs)
      setTimeout(function() {
        if (S.lastLat && S.lastLng) {
          // Use saved coordinates immediately
          if (typeof window.rakshikaShowNearestStation === 'function') {
            window.rakshikaShowNearestStation(S.lastLat, S.lastLng);
          }
        } else {
          // No saved coordinates — use geolocation
          if (typeof window.rakshikaLocateAndShow === 'function') {
            window.rakshikaLocateAndShow();
          }
        }
      }, 1200); // Wait for map to fully initialize
    }
  }

  /* ============================================================
     SOS TYPE SELECTOR
  ============================================================ */
  function _initSOSTypeSelector() {
    document.querySelectorAll('.sos-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (S.sosActive) return; // cannot change while active
        document.querySelectorAll('.sos-type-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        S.sosType  = btn.dataset.type;
        S.silentMode = (S.sosType === 'silent');
        if (window.rakshikaSos) window.rakshikaSos.isSilentMode = S.silentMode;
        const sw = document.getElementById('silentSwitch');
        if (sw) sw.classList.toggle('on', S.silentMode);
        sessionStorage.setItem('rak_silent', S.silentMode);
      });
    });
  }

  /* ============================================================
     THREAT LEVEL SELECTOR
  ============================================================ */
  function _initThreatSelector() {
    document.querySelectorAll('.threat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (S.sosActive) return;
        document.querySelectorAll('.threat-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        S.threatLevel = btn.dataset.threat;
        if (window.rakshikaSos) window.rakshikaSos.threatLevel = S.threatLevel;
        sessionStorage.setItem('rak_threat', S.threatLevel);
      });
    });
  }

  /* ============================================================
     SOS ENGINE
  ============================================================ */
  function _initSOS() {
    if (!$sosBtn) return;

    $sosBtn.addEventListener('click', async () => {
      if (S.sosActive) {
        _cancelSOS();
      } else {
        await _triggerSOS();
      }
    });

    // Panic cancel button on overlay
    $panicCancelBtn?.addEventListener('click', () => _cancelSOS());

    // Silent mode toggle (independent)
    $silentToggle?.addEventListener('click', () => {
      if (S.sosActive) return;
      S.silentMode = !S.silentMode;
      const sw = document.getElementById('silentSwitch');
      if (sw) sw.classList.toggle('on', S.silentMode);
      sessionStorage.setItem('rak_silent', S.silentMode);
      if (window.rakshikaSos) window.rakshikaSos.isSilentMode = S.silentMode;
      // sync type btn
      if (S.silentMode) {
        document.querySelectorAll('.sos-type-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('sosTypeSilent')?.classList.add('selected');
        S.sosType = 'silent';
      }
      dashToast(
        S.silentMode ? '🤫 Silent Mode ON' : '🔊 Silent Mode OFF',
        S.silentMode ? 'SOS tracking runs silently.' : 'Alarm enabled.',
        'info'
      );
    });
  }

  async function _triggerSOS() {
    S.sosActive = true;
    sessionStorage.setItem('rak_sos_active', 'true');
    sessionStorage.setItem('rak_sos_type', S.sosType);
    sessionStorage.setItem('rak_threat', S.threatLevel);
    sessionStorage.setItem('rak_silent', S.silentMode);

    _updateSOSUI(true);
    _showTrackingBar(true);
    _setSafetyStatus('emergency');

    // Show panic overlay for panic type
    if (S.sosType === 'panic') {
      _showPanicOverlay();
    }

    dashToast('🚨 SOS ACTIVATED', `${S.sosType.toUpperCase()} SOS — Threat: ${S.threatLevel.toUpperCase()}`, 'error');

    if (window.rakshikaSos) {
      window.rakshikaSos.isSilentMode = S.silentMode;
      window.rakshikaSos.threatLevel  = S.threatLevel;

      window.rakshikaSos.triggerInstantSOS((lat, lng) => {
        const alertId = window.rakshikaSos.activeSessionId;
        S.sosAlertId = alertId;
        sessionStorage.setItem('rak_sos_id', alertId);

        // Update session badge
        if ($activeSessionBadge) $activeSessionBadge.classList.add('visible');
        if ($sessionIdDisplay)   $sessionIdDisplay.textContent = (alertId || '—').slice(0, 10) + '…';

        // Update overlay coords
        if (lat && lng) {
          const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          if ($overlayCoords) $overlayCoords.textContent = coordStr;
          if ($trackingCoordsText) $trackingCoordsText.textContent = coordStr;
        }

        // Update map + show nearest station
        if (lat && lng) {
          S.lastLat = lat;
          S.lastLng = lng;
          // Save to sessionStorage so it survives a page refresh
          sessionStorage.setItem('rak_last_lat', lat);
          sessionStorage.setItem('rak_last_lng', lng);

          // Robust station finder (defined in dashboard.html inline script)
          if (typeof window.rakshikaShowNearestStation === 'function') {
            // Scroll map into view first
            const mapSection = document.getElementById('mapSection');
            if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => window.rakshikaShowNearestStation(lat, lng), 400);
          } else if (S.dashMap) {
            const nearest = S.dashMap.updateUserLocation(lat, lng);
            if (nearest) {
              const el = document.getElementById('nearestStationName');
              if (el) el.textContent = '\uD83D\uDEA8 ' + nearest.name + ' (' + nearest.dist.toFixed(1) + ' km)';
            }
          }

          // Fire custom event for additional listeners
          document.dispatchEvent(new CustomEvent('rak:sos:triggered', { detail: { lat, lng } }));
        }
      });
    }
  }

  function _cancelSOS() {
    S.sosActive = false;
    _updateSOSUI(false);
    _showTrackingBar(false);
    _hidePanicOverlay();
    _setSafetyStatus('safe');

    sessionStorage.removeItem('rak_sos_active');
    sessionStorage.removeItem('rak_sos_id');
    sessionStorage.removeItem('rak_last_lat');
    sessionStorage.removeItem('rak_last_lng');

    if ($activeSessionBadge) $activeSessionBadge.classList.remove('visible');

    if (window.rakshikaSos) window.rakshikaSos.resolveEmergency();
    
    // Reset map to normal (show all stations, remove route & user location)
    if (S.dashMap) {
      S.dashMap.clearUserLocation();
    }

    dashToast('✅ SOS Cancelled', 'Emergency tracking stopped.', 'success');
  }

  function _updateSOSUI(active) {
    if (!$sosBtn) return;
    $sosBtn.classList.toggle('active-sos', active);
    if ($sosBtnLabel) $sosBtnLabel.textContent = active ? 'STOP' : 'SOS';
    if ($sosBtnSub)   $sosBtnSub.textContent   = active ? 'TAP TO CANCEL' : 'TAP TO ALERT';
    if ($sosStatusText) {
      $sosStatusText.textContent = active
        ? `🔴 ${S.sosType.toUpperCase()} SOS ACTIVE — Tracking Location…`
        : 'Tap to send emergency alert';
      $sosStatusText.className = 'sos-status-text' + (active ? ' active' : '');
    }
    document.body.classList.toggle('emergency-active', active);

    // Disable type/threat selectors while active
    document.querySelectorAll('.sos-type-btn, .threat-btn').forEach(b => {
      b.style.opacity  = active ? '0.5' : '1';
      b.style.cursor   = active ? 'not-allowed' : 'pointer';
    });

    if (active) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ============================================================
     PANIC OVERLAY
  ============================================================ */
  function _showPanicOverlay() {
    if (!$panicOverlay) return;
    // Populate overlay info
    if ($overlayType)   $overlayType.textContent   = `⚡ ${S.sosType.toUpperCase()}`;
    if ($overlayThreat) $overlayThreat.textContent = `⚠ ${S.threatLevel.toUpperCase()}`;
    if ($overlayCoords) $overlayCoords.textContent = 'Acquiring GPS…';
    $panicOverlay.classList.add('visible');
    // Also vibrate device
    try { navigator.vibrate && navigator.vibrate([500, 200, 500, 200, 500]); } catch (e) {}
  }

  function _hidePanicOverlay() {
    if ($panicOverlay) $panicOverlay.classList.remove('visible');
  }

  /* ============================================================
     TRACKING BAR
  ============================================================ */
  function _showTrackingBar(show) {
    if (!$trackingBar) return;
    $trackingBar.classList.toggle('visible', show);
  }

  /* ============================================================
     SHAKE DETECTION (Shake phone 3× to trigger SOS)
  ============================================================ */
  function _initShakeDetection() {
    if (!window.DeviceMotionEvent) return;

    const SHAKE_THRESHOLD = 18;
    const SHAKE_COUNT_REQUIRED = 3;
    let shakeCount = 0;
    let shakeResetTimer = null;

    window.addEventListener('devicemotion', (e) => {
      if (!S.shakeEnabled || S.sosActive) return;
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      if (magnitude > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - S.shakeLastTime > 500) {
          S.shakeLastTime = now;
          shakeCount++;
          if (shakeResetTimer) clearTimeout(shakeResetTimer);
          shakeResetTimer = setTimeout(() => { shakeCount = 0; }, 3000);
          if (shakeCount >= SHAKE_COUNT_REQUIRED) {
            shakeCount = 0;
            S.sosType    = 'panic';
            S.threatLevel = 'critical';
            document.querySelectorAll('.sos-type-btn').forEach(b => b.classList.remove('selected'));
            document.getElementById('sosTypePanic')?.classList.add('selected');
            document.querySelectorAll('.threat-btn').forEach(b => b.classList.remove('selected'));
            document.getElementById('threatCritical')?.classList.add('selected');
            dashToast('📳 Shake Detected!', 'Triggering Panic SOS!', 'error');
            _triggerSOS();
          }
        }
      }
    });

    // Request permission on iOS 13+
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      document.body.addEventListener('click', () => {
        DeviceMotionEvent.requestPermission().catch(() => {});
      }, { once: true });
    }
  }

  /* ============================================================
     SAFETY STATUS
  ============================================================ */
  function _initSafetyStatus() {
    document.querySelectorAll('.safety-status-item').forEach(item => {
      item.addEventListener('click', () => {
        const status = item.dataset.status;
        if (status) _setSafetyStatus(status);
      });
    });
  }

  function _setSafetyStatus(status) {
    S.safetyStatus = status;
    const chips = [
      document.getElementById('safetyChip'),
      document.getElementById('safetyChipTop'),
      document.getElementById('safetyChipMobile'),
    ];
    const labels = { safe: '🟢 SAFE', alert: '🟡 ALERT', emergency: '🔴 EMERGENCY' };
    chips.forEach(chip => {
      if (!chip) return;
      chip.className = `safety-chip ${status}`;
      chip.innerHTML = `<div class="safety-dot"></div>${labels[status] || status.toUpperCase()}`;
    });
    document.querySelectorAll('.safety-status-item').forEach(item => {
      item.classList.toggle('current-status', item.dataset.status === status);
    });
    sessionStorage.setItem('rak_safety', status);
  }

  /* ============================================================
     CHECK-IN TIMER
  ============================================================ */
  function _initCheckinTimer() {
    $checkinStart?.addEventListener('click', () => {
      const mins = parseInt($checkinMins?.value || '30', 10);
      if (isNaN(mins) || mins < 1) return;
      _startCheckin(mins * 60);
    });
    $checkinStop?.addEventListener('click', () => {
      _stopCheckin();
      dashToast('✅ Checked In', 'You have checked in. Timer reset.', 'success');
    });
  }

  function _startCheckin(seconds) {
    _stopCheckin();
    S.checkinTotal     = seconds;
    S.checkinRemaining = seconds;
    _renderCheckin();
    S.checkinTimer = setInterval(() => {
      S.checkinRemaining--;
      _renderCheckin();
      if (S.checkinRemaining <= 0) {
        _stopCheckin();
        dashToast('⚠️ Check-in Expired!', 'Auto-SOS triggered!', 'error');
        if (!S.sosActive) _triggerSOS();
      } else if (S.checkinRemaining === 60) {
        dashToast('⚠️ 1 Minute Left', 'Check in soon or SOS will trigger!', 'warning');
        _setSafetyStatus('alert');
      }
    }, 1000);
    dashToast('⏱ Timer Started', `Check-in timer: ${Math.round(seconds / 60)} minutes.`, 'info');
    _setSafetyStatus('alert');
  }

  function _stopCheckin() {
    if (S.checkinTimer) { clearInterval(S.checkinTimer); S.checkinTimer = null; }
    S.checkinRemaining = 0;
    _renderCheckin();
  }

  function _renderCheckin() {
    if (!$checkinDisplay) return;
    if (S.checkinRemaining <= 0) {
      $checkinDisplay.textContent = '00:00';
      $checkinDisplay.className = 'checkin-display';
      return;
    }
    const m = Math.floor(S.checkinRemaining / 60);
    const s = S.checkinRemaining % 60;
    $checkinDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    $checkinDisplay.className = 'checkin-display' +
      (S.checkinRemaining <= 60 ? ' warning' : '') +
      (S.checkinRemaining <= 0  ? ' expired' : '');
  }

  /* ============================================================
     MAP INIT
  ============================================================ */
  function _initMap() {
    const container = document.getElementById('dashMapViewport');
    if (!container || typeof L === 'undefined' || typeof UserDashboardMap === 'undefined') return;

    S.dashMap = new UserDashboardMap('dashMapViewport', { center: [20.5937, 78.9629], zoom: 5 });
    window.dashMap = S.dashMap;

    // Filter controls event setup
    const stateFilterEl = document.getElementById('mapStateFilter');
    const cityFilterEl = document.getElementById('mapCityFilter');
    const searchInputEl = document.getElementById('mapSearchInput');
    const clearFiltersBtn = document.getElementById('btnClearMapFilters');

    const updateCityDropdown = () => {
      if (!cityFilterEl) return;
      const state = stateFilterEl ? stateFilterEl.value : '';
      if (!state) {
        cityFilterEl.innerHTML = '<option value="">All Cities</option>';
        cityFilterEl.disabled = true;
        return;
      }
      
      const cities = [...new Set(POLICE_STATIONS.filter(s => s.state === state).map(s => s.city))].sort();
      cityFilterEl.innerHTML = '<option value="">All Cities</option>' + cities.map(c => `<option value="${c}">${c}</option>`).join('');
      cityFilterEl.disabled = false;
    };

    const handleFiltersChange = () => {
      const stateVal = stateFilterEl ? stateFilterEl.value : '';
      const cityVal = cityFilterEl ? cityFilterEl.value : '';
      const searchVal = searchInputEl ? searchInputEl.value : '';
      S.dashMap.setFilters(stateVal, cityVal, searchVal);
    };

    stateFilterEl?.addEventListener('change', () => {
      updateCityDropdown();
      handleFiltersChange();
    });
    
    cityFilterEl?.addEventListener('change', handleFiltersChange);
    searchInputEl?.addEventListener('input', handleFiltersChange);

    clearFiltersBtn?.addEventListener('click', () => {
      if (stateFilterEl) stateFilterEl.value = '';
      if (cityFilterEl) { cityFilterEl.innerHTML = '<option value="">All Cities</option>'; cityFilterEl.disabled = true; }
      if (searchInputEl) searchInputEl.value = '';
      
      if (!S.sosActive && S.dashMap) {
        S.dashMap.clearUserLocation();
      } else {
        handleFiltersChange();
      }
    });

    const doLocateMe = async (silent = false) => {
      const pos = await _getCurrentPosition().catch(() => null);
      let lat, lng;
      if (!pos) { 
        // Fallback to Delhi coordinates for simulation / testing when geolocation is blocked or fails
        lat = 28.6139;
        lng = 77.2090;
        if (!silent) dashToast('ℹ Default Location Used', 'Using Delhi coordinates for testing.', 'info');
      } else {
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
      S.lastLat = lat;
      S.lastLng = lng;
      // Save coords to survive refresh
      sessionStorage.setItem('rak_last_lat', lat);
      sessionStorage.setItem('rak_last_lng', lng);
      const nearest = S.dashMap.updateUserLocation(lat, lng);
      if (nearest) {
        if (!silent) dashToast('📍 Location Found', `Nearest: ${nearest.name} (${nearest.dist.toFixed(1)} km)`, 'success');
        const el = document.getElementById('nearestStationName');
        if (el) el.textContent = `🚨 ${nearest.name} (${nearest.dist.toFixed(1)} km)`;
        // Open popup on nearest marker after fly animation
        setTimeout(() => {
          if (S.dashMap._stationMarkers) {
            S.dashMap._stationMarkers.forEach(m => {
              if (m.stationId === nearest.id) m.openPopup();
            });
          }
        }, 1600);
      }
    };

    document.getElementById('btnMyLocation')?.addEventListener('click', () => doLocateMe(false));
    document.getElementById('btnFitAllStations')?.addEventListener('click', () => {
      if (!S.sosActive && S.dashMap) {
        S.dashMap.clearUserLocation();
      } else if (S.dashMap) {
        S.dashMap.fitAll();
      }
    });
  }

  function _getCurrentPosition() {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(res, rej, {
        enableHighAccuracy: true, timeout: 8000, maximumAge: 5000
      });
    });
  }

  /* ============================================================
     EVIDENCE MODULE
  ============================================================ */
  function _initEvidenceModule() {
    if (typeof EvidenceManager === 'undefined') return;
    S.evidenceManager = new EvidenceManager({
      onUploadDone: (files) => {
        dashToast(`📂 ${files.length} File(s) Ready`, 'Attach them to your FIR below.', 'success');
      }
    });
    document.getElementById('btnUploadEvidence')?.addEventListener('click', async () => {
      await S.evidenceManager.uploadAll(S.currentUser?.id);
    });

    // --- Upload-type trigger buttons ---
    const fileInput = document.getElementById('evidenceFileInput');
    function _triggerPicker(accept) {
      if (!fileInput) return;
      fileInput.accept = accept;
      fileInput.value = '';           // reset so same file can be re-picked
      fileInput.click();
    }
    document.getElementById('btnTriggerImages')?.addEventListener('click', (e) => {
      e.stopPropagation();
      _triggerPicker('image/*');
    });
    document.getElementById('btnTriggerVideos')?.addEventListener('click', (e) => {
      e.stopPropagation();
      _triggerPicker('video/*');
    });
    document.getElementById('btnTriggerPDFs')?.addEventListener('click', (e) => {
      e.stopPropagation();
      _triggerPicker('application/pdf');
    });
  }

  /* ============================================================
     FIR MODULE
  ============================================================ */
  function _initFIRModule() {
    if (typeof FIRManager === 'undefined') return;
    S.firManager = new FIRManager({
      evidenceManager: S.evidenceManager,
      onSubmitted: ({ dept, fir }) => {
        _setSafetyStatus('alert');
        dashToast(
          dept === 'cyber' ? '💻 Sent to Cyber Cell' : '👮 Sent to Police',
          'Your FIR has been filed. Stay safe.',
          'success'
        );
        _reloadCaseTracking();
        if (fir && fir.id) {
          _selectTrackingCase(fir.id);
        }
      }
    });
    if (S.firManager && S.currentUser) S.firManager.setUser(S.currentUser);

    document.getElementById('firLocation')?.addEventListener('focus', async () => {
      if (S.lastLat && S.lastLng) {
        document.getElementById('firLocation').value = `${S.lastLat.toFixed(5)}, ${S.lastLng.toFixed(5)}`;
        return;
      }
      const pos = await _getCurrentPosition().catch(() => null);
      if (pos) {
        const input = document.getElementById('firLocation');
        if (input && !input.value) {
          input.value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        }
        S.lastLat = pos.coords.latitude;
        S.lastLng = pos.coords.longitude;
      }
    });
  }

  /* ============================================================
     MOBILE SIDEBAR
  ============================================================ */
  function _initSidebar() {
    const menuBtn = document.getElementById('dashMobileMenu');
    const overlay = document.getElementById('dashMobOverlay');
    const sidebar = document.getElementById('dashSidebar');

    const open  = () => { sidebar?.classList.add('open');  overlay?.classList.add('open');  };
    const close = () => { sidebar?.classList.remove('open'); overlay?.classList.remove('open'); };

    menuBtn?.addEventListener('click', open);
    overlay?.addEventListener('click', close);
    sidebar?.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
      if (window.innerWidth < 900) close();
    }));

    document.getElementById('btnLogout')?.addEventListener('click', () => {
      if (S.DB && S.DB.isReady && S.DB.isReady()) {
        S.DB.client.auth.signOut().then(() => window.location.href = 'index.html');
      } else {
        sessionStorage.clear();
        window.location.href = 'index.html';
      }
    });
  }

  /* ============================================================
     CASE TRACKING LOGIC
  ============================================================ */
  let $trackingCaseList, $trackingDetailPanel;

  function _initCaseTracking() {
    $trackingCaseList = document.getElementById('trackingCaseList');
    $trackingDetailPanel = document.getElementById('trackingDetailPanel');

    _reloadCaseTracking();

    // Listen to BroadcastChannel for real-time status updates from officers
    try {
      const bc = new BroadcastChannel('rakshika_status_update');
      bc.onmessage = (evt) => {
        const data = evt.data;
        if (data && data.type === 'status_update') {
          const { dept, id, status } = data;
          
          // Update in local state
          const index = S.cases.findIndex(c => c.id === id);
          if (index !== -1) {
            S.cases[index].status = status;
            
            // Re-save to appropriate localStorage key
            const localKey = dept === 'cyber' ? 'rakshika_cyber_firs' : 'rakshika_police_firs';
            try {
              const list = JSON.parse(localStorage.getItem(localKey) || '[]');
              const lIdx = list.findIndex(x => x.id === id);
              if (lIdx !== -1) {
                list[lIdx].status = status;
                localStorage.setItem(localKey, JSON.stringify(list));
              }
            } catch (e) { console.warn('Failed to update local storage:', e); }

            _renderTrackingList();
            
            // If the updated case is currently selected, re-render its details
            if (S.selectedCaseId === id) {
              _selectTrackingCase(id);
            }

            dashToast('🚦 Case Status Updated', `Your case #${id.slice(0, 8)} status is now ${status.toUpperCase()}.`, 'info');
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported or error:', e);
    }
  }

  function _reloadCaseTracking() {
    let policeFirs = [];
    let cyberFirs = [];
    
    try {
      policeFirs = JSON.parse(localStorage.getItem('rakshika_police_firs') || '[]');
    } catch(e) {}
    try {
      cyberFirs = JSON.parse(localStorage.getItem('rakshika_cyber_firs') || '[]');
    } catch(e) {}

    // Combine them, sort by created_at descending
    S.cases = [...policeFirs, ...cyberFirs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    _renderTrackingList();
  }

  function _renderTrackingList() {
    if (!$trackingCaseList) return;

    if (S.cases.length === 0) {
      $trackingCaseList.innerHTML = `<div style="font-size:0.78rem;color:var(--text-3);font-style:italic;text-align:center;padding:10px 0">No cases filed yet.</div>`;
      return;
    }

    $trackingCaseList.innerHTML = S.cases.map(c => {
      const activeClass = S.selectedCaseId === c.id ? 'active' : '';
      const deptName = c.department === 'cyber' ? 'Cyber Cell' : 'Police';
      const color = c.department === 'cyber' ? '#8b5cf6' : '#3b82f6';
      const dateStr = new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return `
        <div class="tracking-case-item ${activeClass}" data-id="${c.id}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="case-item-title">Case #${c.id.slice(0, 8)}</span>
            <span class="status-chip ${c.status === 'resolved' ? 'safe' : 'alert'}" style="font-size:0.58rem;padding:2px 6px;height:auto">${c.status.toUpperCase()}</span>
          </div>
          <div class="case-item-meta" style="display:flex;justify-content:space-between;margin-top:2px">
            <span style="color:${color};font-weight:600">${deptName}</span>
            <span>${dateStr}</span>
          </div>
        </div>`;
    }).join('');

    // Bind click handlers
    $trackingCaseList.querySelectorAll('.tracking-case-item').forEach(item => {
      item.addEventListener('click', () => {
        _selectTrackingCase(item.dataset.id);
      });
    });
  }

  function _selectTrackingCase(id) {
    S.selectedCaseId = id;
    const c = S.cases.find(x => x.id === id);
    if (!c || !$trackingDetailPanel) return;

    // Highlight selected item in list
    $trackingCaseList.querySelectorAll('.tracking-case-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === id);
    });

    $trackingDetailPanel.innerHTML = _caseDetailHTML(c);
  }

  function _caseDetailHTML(c) {
    const isPolice = c.department === 'police';
    const deptName = isPolice ? 'Police Department' : 'Cyber Crime Department';
    const deptColor = isPolice ? '#3b82f6' : '#8b5cf6';
    const statusText = c.status.toUpperCase();

    // Determine step status
    let s1 = 'completed', s2 = '', s3 = '', s4 = '';
    let fillWidth = '0%';

    const s = c.status.toLowerCase();
    if (s === 'pending') {
      s1 = 'active';
      fillWidth = '0%';
    } else if (s === 'acknowledged' || s === 'approved') {
      s1 = 'completed';
      s2 = 'active';
      fillWidth = '33%';
    } else if (s === 'assigned' || s === 'in_progress' || s === 'investigating') {
      s1 = 'completed';
      s2 = 'completed';
      s3 = 'active';
      fillWidth = '66%';
    } else if (s === 'resolved') {
      s1 = 'completed';
      s2 = 'completed';
      s3 = 'completed';
      s4 = 'completed';
      fillWidth = '100%';
    }

    const dateStr = new Date(c.created_at).toLocaleString('en-IN');
    
    // Parse evidence
    const evidenceList = (c.evidence_urls || '')
      .split(/[|\n,]/)
      .map(url => url.trim())
      .filter(Boolean);

    let evidenceHTML = '';
    if (evidenceList.length > 0) {
      evidenceHTML = `
        <div class="case-evidence-box">
          <div style="font-size:0.72rem;color:var(--text-3);font-family:var(--mono);text-transform:uppercase;margin-bottom:6px">Attached Evidence (${evidenceList.length})</div>
          <div class="evidence-links-grid">
            ${evidenceList.map(url => {
              const icon = url.startsWith('blob:') ? '📁' : (url.includes('drive.google') ? '📂' : '🔗');
              return `
                <a class="evidence-link-item" href="${url}" target="_blank" rel="noopener">
                  <span class="evidence-link-icon">${icon}</span>
                  <span class="evidence-link-text">${url}</span>
                </a>`;
            }).join('')}
          </div>
        </div>`;
    } else {
      evidenceHTML = `
        <div class="case-evidence-box">
          <div style="font-size:0.72rem;color:var(--text-3);font-family:var(--mono);text-transform:uppercase;margin-bottom:6px">Attached Evidence</div>
          <div style="font-size:0.76rem;color:var(--text-3);font-style:italic">No evidence attached.</div>
        </div>`;
    }

    return `
      <div class="case-header-tracking" style="border-bottom:1px solid var(--border);padding-bottom:12px;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h3 style="font-family:'Outfit',sans-serif;margin:0" id="trackCaseTitle">Case #${c.id.slice(0, 12)}…</h3>
          <p style="font-size:0.78rem;color:var(--text-3);margin:4px 0 0" id="trackCaseMeta">Dept: <strong style="color:${deptColor}">${deptName}</strong> · ${c.incident_type} · ${dateStr}</p>
        </div>
        <span class="safety-chip ${c.status === 'resolved' ? 'safe' : 'alert'}" style="font-size:0.7rem;padding:3px 10px;height:auto">${statusText}</span>
      </div>

      <!-- Stepper -->
      <div class="stepper-wrap">
        <div class="stepper-line-bg"></div>
        <div class="stepper-line-fill" style="width:${fillWidth}"></div>

        <div class="step-node ${s1}">
          <div class="step-circle">1</div>
          <div class="step-label">Submitted</div>
        </div>
        <div class="step-node ${s2}">
          <div class="step-circle">2</div>
          <div class="step-label">Approved</div>
        </div>
        <div class="step-node ${s3}">
          <div class="step-circle">3</div>
          <div class="step-label">Investigating</div>
        </div>
        <div class="step-node ${s4}">
          <div class="step-circle">4</div>
          <div class="step-label">Resolved</div>
        </div>
      </div>

      <div class="case-description-box" style="background:var(--bg-card-3);border:1px solid var(--border);padding:14px;border-radius:var(--r-md);margin-top:10px">
        <div style="font-size:0.72rem;color:var(--text-3);font-family:var(--mono);text-transform:uppercase;margin-bottom:4px">Complaint Description</div>
        <div style="font-size:0.8rem;line-height:1.6;color:var(--text-2)">${c.description}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
        <div style="background:var(--bg-card-3);border:1px solid var(--border);padding:10px 12px;border-radius:var(--r-sm)">
          <span style="font-size:0.7rem;color:var(--text-3);display:block;text-transform:uppercase;font-family:var(--mono)">Complainant</span>
          <span style="font-size:0.8rem;font-weight:600;color:var(--text-1)">${c.full_name}</span>
        </div>
        <div style="background:var(--bg-card-3);border:1px solid var(--border);padding:10px 12px;border-radius:var(--r-sm)">
          <span style="font-size:0.7rem;color:var(--text-3);display:block;text-transform:uppercase;font-family:var(--mono)">Incident Location</span>
          <span style="font-size:0.8rem;font-weight:600;color:var(--text-1)">📍 ${c.location}</span>
        </div>
      </div>

      ${evidenceHTML}
    `;
  }
  
  // Expose these for external access
  window._reloadCaseTracking = _reloadCaseTracking;
  window._selectTrackingCase = _selectTrackingCase;

  /* ============================================================
     GLOBAL TOAST
  ============================================================ */
  function dashToast(title, msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: '✅', error: '🚨', info: 'ℹ️', warning: '⚠️' };
    const el = document.createElement('div');
    el.className = `toast-item ${type}`;
    el.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${msg}</div>
      </div>
      <button class="toast-close" onclick="this.closest('.toast-item').remove()">✕</button>`;
    container.prepend(el);
    setTimeout(() => el.remove(), 6000);
  }

  window.dashToast = dashToast;

  /* ============================================================
     SAFETY CHECK & QUICK ACTIONS RECEIVER
  ============================================================ */
  function _initSafetyCheckReceiver() {
    try {
      window.safetyBc = new BroadcastChannel('rakshika_safety_check');
      window.safetyBc.onmessage = (e) => {
        // If a user email is specified, verify it matches our current user
        if (e.data.user_email && S.currentUser && e.data.user_email !== S.currentUser.email) {
          return;
        }

        if (e.data.type === 'REQUEST') {
          try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (err) {}
          const modal = document.getElementById('safetyCheckModal');
          const subText = document.getElementById('safetyCheckSubText');
          const inputReply = document.getElementById('userSafetyReply');
          if (subText && e.data.message) {
            subText.innerHTML = `<strong>Message from Guardian:</strong><br/>"${e.data.message}"<br/><br/>Please reply immediately.`;
          }
          if (inputReply) inputReply.value = ''; // clear previous
          if (modal) modal.style.display = 'flex';
        } else if (e.data.type === 'QUICK_ACTION') {
          if (e.data.action === 'call') {
            // Trigger fake incoming call using SOS service
            if (window.rakshikaSos) {
              dashToast('Incoming Call', 'Guardian is calling you...', 'info');
              window.rakshikaSos.scheduleFakeCall(0, 
                () => { console.log('Fake call ringing...'); },
                () => { console.log('Fake call hung up.'); }
              );
              // Stop ringing after 10s
              setTimeout(() => { if(window.rakshikaSos) window.rakshikaSos.cancelFakeCall(); }, 10000);
            }
          } else if (e.data.action === 'message') {
            dashToast('Message from Guardian', 'Please check your secure inbox.', 'info');
            try { navigator.vibrate && navigator.vibrate([100]); } catch (err) {}
          } else if (e.data.action === 'helping') {
            dashToast('Help is on the way!', 'Your Guardian has marked themselves as HELPING and is en route!', 'success');
            try { navigator.vibrate && navigator.vibrate([500]); } catch (err) {}
          }
        }
      };

      document.getElementById('btnReplySafe')?.addEventListener('click', () => {
        const replyInput = document.getElementById('userSafetyReply');
        const customMsg = replyInput ? replyInput.value.trim() : '';
        window.safetyBc.postMessage({ type: 'REPLY', status: 'safe', user_email: S.currentUser.email, message: customMsg });
        const modal = document.getElementById('safetyCheckModal');
        if (modal) modal.style.display = 'none';
        dashToast('Safety Confirmed', 'Guardian has been notified you are safe.', 'success');
      });

      document.getElementById('btnReplyHelp')?.addEventListener('click', () => {
        const replyInput = document.getElementById('userSafetyReply');
        const customMsg = replyInput ? replyInput.value.trim() : '';
        window.safetyBc.postMessage({ type: 'REPLY', status: 'help', user_email: S.currentUser.email, message: customMsg });
        const modal = document.getElementById('safetyCheckModal');
        if (modal) modal.style.display = 'none';
        
        // Trigger actual SOS
        if (!S.sosActive) {
          S.sosType = 'panic';
          S.threatLevel = 'high';
          _triggerSOS();
        }
        dashToast('Help Requested', 'Guardian notified and SOS activated!', 'error');
      });

      const userReplyInput = document.getElementById('userSafetyReply');
      if (userReplyInput) {
        userReplyInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            document.getElementById('btnReplySafe')?.click();
          }
        });
      }
    } catch (err) {
      console.warn("Safety Check BroadcastChannel init failed:", err);
    }
  }

  // initialize it
  _initSafetyCheckReceiver();

  /* ============================================================
     FEATURE LOCKDOWN
  ============================================================ */
  const S_AUTH = {
    unlocked: new Set(),
    pendingSection: null
  };

  function _initFeatureLockdown() {
    // Intercept nav clicks
    document.querySelectorAll('.sidebar-nav a[data-protected="true"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        if (S_AUTH.unlocked.has(targetId)) {
          _showAndScrollTo(targetId);
        } else {
          S_AUTH.pendingSection = targetId;
          _showAuthModal();
        }
      });
    });

    document.getElementById('authModalClose')?.addEventListener('click', _hideAuthModal);
    document.getElementById('authModalSubmit')?.addEventListener('click', _handleAuthSubmit);
    document.getElementById('authModalPassword')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') _handleAuthSubmit();
    });
  }

  function _showAuthModal() {
    const overlay = document.getElementById('authModalOverlay');
    const pwdInput = document.getElementById('authModalPassword');
    const err = document.getElementById('authModalError');
    if (overlay) overlay.style.display = 'flex';
    if (pwdInput) { pwdInput.value = ''; setTimeout(() => pwdInput.focus(), 100); }
    if (err) err.style.display = 'none';
  }

  function _hideAuthModal() {
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) overlay.style.display = 'none';
    S_AUTH.pendingSection = null;
  }

  async function _handleAuthSubmit() {
    const pwd = document.getElementById('authModalPassword')?.value;
    const err = document.getElementById('authModalError');
    if (!pwd) return;

    if (!S.currentUser || !window.rakshikaAuth) {
      dashToast('Error', 'Authentication service unavailable.', 'error');
      return;
    }

    const email = S.currentUser.email;
    const res = await window.rakshikaAuth.login(email, pwd, 'user');
    
    if (res.success) {
      if (S_AUTH.pendingSection) {
        S_AUTH.unlocked.add(S_AUTH.pendingSection);
        _showAndScrollTo(S_AUTH.pendingSection);
      }
      dashToast('✅ Access Granted', 'Feature unlocked securely.', 'success');
      _hideAuthModal();
    } else {
      if (err) {
        err.textContent = 'Incorrect password. Try again.';
        err.style.display = 'block';
      }
    }
  }

  function _showAndScrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('locked-section');
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  /* ============================================================
     GUARDIAN LINKING MODULE
  ============================================================ */
  function _initGuardianLinking() {
    const btnOpen = document.getElementById('btnAddGuardianModalOpen');
    const modal = document.getElementById('addGuardianModal');
    const btnClose = document.getElementById('addGuardianClose');
    const btnSubmit = document.getElementById('addGuardianSubmit');
    const searchInput = document.getElementById('guardianSearchInput');
    const errText = document.getElementById('addGuardianError');
    const successText = document.getElementById('addGuardianSuccess');
    const listContainer = document.getElementById('guardiansListContainer');

    if (!btnOpen || !modal || !btnClose || !btnSubmit || !searchInput || !listContainer) {
      console.warn("Guardian linking elements not found in DOM.");
      return;
    }

    _loadAndRenderGuardians();

    btnOpen.addEventListener('click', (e) => {
      e.preventDefault();
      searchInput.value = '';
      errText.style.display = 'none';
      successText.style.display = 'none';
      modal.style.display = 'flex';
      searchInput.focus();
    });

    btnClose.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'none';
    });

    btnSubmit.addEventListener('click', async (e) => {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (!val) {
        errText.textContent = "Please enter an email or phone number.";
        errText.style.display = "block";
        return;
      }

      errText.style.display = "none";
      successText.style.display = "none";
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Linking...";

      if (!S.currentUser || !window.rakshikaDb) {
        errText.textContent = "Database service not initialized.";
        errText.style.display = "block";
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Link Guardian";
        return;
      }

      const identifier = S.currentUser.id || S.currentUser.email;
      const res = await window.rakshikaDb.addGuardianLink(identifier, val);

      btnSubmit.disabled = false;
      btnSubmit.textContent = "Link Guardian";

      if (res.success) {
        successText.textContent = "Guardian linked successfully!";
        successText.style.display = "block";
        _loadAndRenderGuardians();
        setTimeout(() => {
          modal.style.display = 'none';
        }, 1200);
      } else {
        errText.textContent = res.error || "Failed to link guardian.";
        errText.style.display = "block";
      }
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        btnSubmit.click();
      }
    });
  }

  async function _loadAndRenderGuardians() {
    const listContainer = document.getElementById('guardiansListContainer');
    if (!listContainer || !S.currentUser || !window.rakshikaDb) return;

    const identifier = S.currentUser.id || S.currentUser.email;
    const res = await window.rakshikaDb.getLinkedGuardians(identifier);
    const btnOpen = document.getElementById('btnAddGuardianModalOpen');
    
    listContainer.innerHTML = '';

    if (res.data && res.data.length > 0) {
      res.data.forEach(guardian => {
        const item = document.createElement('div');
        item.className = 'guardian-item';
        item.style.position = 'relative';
        item.style.paddingRight = '32px';
        
        const avatar = guardian.name ? guardian.name.substring(0, 1).toUpperCase() : 'G';
        
        item.innerHTML = `
          <div class="guardian-avatar">${avatar}</div>
          <div>
            <div style="font-size:.75rem;font-weight:600">${guardian.name}</div>
            <div style="font-size:.64rem;color:var(--text-3);font-family:var(--mono)">${guardian.phone}</div>
          </div>
          <button style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--red-400);cursor:pointer;font-size:0.9rem;" title="Remove Guardian" onclick="window._removeGuardianLink('${guardian.link_id}')">✕</button>
        `;
        listContainer.appendChild(item);
      });
    } else {
      const emptyMsg = document.createElement('div');
      emptyMsg.id = 'emptyGuardiansMsg';
      emptyMsg.style.fontSize = '.7rem';
      emptyMsg.style.color = 'var(--text-3)';
      emptyMsg.style.fontStyle = 'italic';
      emptyMsg.style.marginRight = '8px';
      emptyMsg.textContent = 'No linked guardians';
      listContainer.appendChild(emptyMsg);
    }

    if (btnOpen) {
      listContainer.appendChild(btnOpen);
    }
  }

  window._removeGuardianLink = async function(linkId) {
    if (!confirm("Are you sure you want to unlink this guardian? They will no longer be able to track your SOS location.")) return;
    if (window.rakshikaDb) {
      await window.rakshikaDb.removeGuardianLink(linkId);
      if (typeof dashToast !== 'undefined') {
        dashToast('Success', 'Guardian unlinked.', 'success');
      }
      _loadAndRenderGuardians();
    }
  };

})();
