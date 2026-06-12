/* ============================================================
   RAKSHIKA — POLICE DASHBOARD LOGIC  (js/police.js)
   Real-time SOS monitoring, Leaflet map, incident management
   ============================================================ */

(function () {
  'use strict';

  /* ---- State ---- */
  const state = {
    alerts: new Map(),       // id → alertObj
    firs: new Map(),         // id → firObj
    activeTab: 'sos',        // sos | fir
    focusedId: null,
    map: null,
    realtimeSub: null,
    coordSub: null,
    pollingTimer: null,
    timeline: [],            // { id, ts, label, kind }
    updateCount: 0,
  };

  /* ---- Supabase shorthand ---- */
  let DB = null;

  /* ---- UI Element refs ---- */
  let $alertList, $statActive, $statInvestigating, $statResolved, $statTotal;
  let $focusBadge, $detailName, $detailId, $detailStatus, $detailLat, $detailLng, $detailTime;
  let $detailType, $detailThreat, $detailStatusSelect;
  let $timelineFeed, $toastContainer, $notifCount, $clockEl;
  let $incidentTableBody;

  /* ================================================================
     INIT
  ================================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    _cacheElements();
    _startClock();
    _initMap();
    _initDB();
    _initSidebar();
    _bindGlobalActions();
    _bindDetailActions();
  });

  function _cacheElements() {
    $alertList         = document.getElementById('alertList');
    $statActive        = document.getElementById('statActive');
    $statInvestigating = document.getElementById('statInvestigating');
    $statResolved      = document.getElementById('statResolved');
    $statTotal         = document.getElementById('statTotal');
    $focusBadge        = document.getElementById('focusBadge');
    $detailName        = document.getElementById('detailName');
    $detailId          = document.getElementById('detailId');
    $detailStatus      = document.getElementById('detailStatus');
    $detailType        = document.getElementById('detailType');
    $detailThreat      = document.getElementById('detailThreat');
    $detailStatusSelect = document.getElementById('detailStatusSelect');
    $detailLat         = document.getElementById('detailLat');
    $detailLng         = document.getElementById('detailLng');
    $detailTime        = document.getElementById('detailTime');
    $timelineFeed      = document.getElementById('timelineFeed');
    $toastContainer    = document.getElementById('toastContainer');
    $notifCount        = document.getElementById('notifCount');
    $clockEl           = document.getElementById('cmdClock');
    $incidentTableBody = document.getElementById('incidentTableBody');
  }

  function _bindDetailActions() {
    $detailStatusSelect?.addEventListener('change', () => {
      if (state.focusedId) {
        _updateStatus(state.focusedId, $detailStatusSelect.value);
      }
    });
  }

  /* ================================================================
     CLOCK
  ================================================================ */
  function _startClock() {
    function tick() {
      if (!$clockEl) return;
      const now = new Date();
      $clockEl.textContent = now.toLocaleTimeString('en-IN', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ================================================================
     MAP INIT
  ================================================================ */
  function _initMap() {
    state.map = new RakshikaMap('mapViewport', {
      center: [20.5937, 78.9629],
      zoom: 5,
    });
  }

  /* ================================================================
     DB INIT  — Supabase real-time or polling fallback
  ================================================================ */
  function _initDB() {
    DB = window.rakshikaDb || null;

    // Authenticate officer/responder
    let currentOfficer = null;
    if (window.rakshikaAuth) {
      currentOfficer = window.rakshikaAuth.requireAuth('police');
    } else {
      try {
        const session = sessionStorage.getItem('rakshika_session');
        if (session) {
          currentOfficer = JSON.parse(session);
        }
      } catch (e) { console.warn('Failed to parse officer session:', e); }
    }

    // Update officer info in UI
    if (currentOfficer) {
      const nameEl = document.querySelector('.officer-info .name');
      if (nameEl && currentOfficer.name) {
        nameEl.textContent = currentOfficer.name;
      }
      const avatarEl = document.querySelector('.officer-avatar');
      if (avatarEl && currentOfficer.name) {
        avatarEl.textContent = currentOfficer.name.slice(0, 2).toUpperCase();
      }
    }

    if (DB && !DB.isMock) {
      _loadAlerts();
    } else {
      _loadMockAlerts();
    }

    _subscribeRealtime();
    _loadFirs();
    _listenBroadcast();
  }

  /* ---- Supabase ---- */
  async function _loadAlerts() {
    try {
      const { data } = await DB.client
        .from('sos_alerts')
        .select('*, profiles(full_name, phone)')
        .order('created_at', { ascending: false })
        .limit(80);
      (data || []).forEach(_ingestAlert);
      _renderAll();
    } catch (e) {
      console.warn('[Police] Supabase load error:', e);
      _loadMockAlerts();
    }
  }

  function _subscribeRealtime() {
    if (!DB) return;
    
    // Subscribe to SOS session events
    DB.subscribeToSOS((payload) => {
      _handleRealtimeEvent(payload);
    });

    // Subscribe to high-frequency live location logs
    DB.subscribeToLocation((payload) => {
      _handleLocationEvent(payload);
    });
  }

  function _handleRealtimeEvent(payload) {
    const row = payload.data;
    if (!row) return;

    if (payload.eventType === 'INSERT') {
      _ingestAlert(row);
      _renderAll();
      _showNewAlertToast(row);
      _flashBorder();
    } else if (payload.eventType === 'UPDATE') {
      _ingestAlert(row);
      _renderAll();
    } else if (payload.eventType === 'DELETE') {
      state.alerts.delete(row.id);
      _renderAll();
    }
  }

  function _handleLocationEvent(payload) {
    const log = payload.data;
    if (!log) return;
    const a = state.alerts.get(log.session_id);
    if (!a) return;
    a.lat = log.latitude;
    a.lng = log.longitude;
    a.updatedAt = log.timestamp || new Date().toISOString();
    
    // Update marker on map
    state.map.upsertMarker(a.id, a.lat, a.lng, _markerMeta(a));

    if (state.focusedId === a.id) {
      _renderDetail(a);
      _addTimeline(a.id, `Location update: ${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}`, 'coord');
      _renderTimeline(a.id);
    }
  }

  /* ---- Mock / BroadcastChannel fallback ---- */
  function _loadMockAlerts() {
    const demos = _generateMockAlerts(5);
    demos.forEach(_ingestAlert);
    _renderAll();
  }

  function _generateMockAlerts(n) {
    const names  = ['Priya Sharma', 'Ananya Singh', 'Kavya Reddy', 'Meera Patel', 'Riya Gupta'];
    const lats   = [12.9716, 19.0760, 13.0827, 28.7041, 22.5726];
    const lngs   = [77.5946, 72.8777, 80.2707, 77.1025, 88.3639];
    const statuses = ['active', 'active', 'investigating', 'active', 'resolved'];
    return Array.from({ length: n }, (_, i) => ({
      id: 'mock-' + (i + 1),
      user_id: 'user-' + (i + 1),
      latitude: lats[i] + (Math.random() - 0.5) * 0.02,
      longitude: lngs[i] + (Math.random() - 0.5) * 0.02,
      status: statuses[i],
      created_at: new Date(Date.now() - (i * 8 + 2) * 60000).toISOString(),
      updated_at: new Date(Date.now() - i * 30000).toISOString(),
      profiles: { full_name: names[i], phone: '+91 9' + Math.floor(Math.random() * 1e9).toString().padStart(9, '0') },
      _isMock: true,
    }));
  }

  function _listenBroadcast() {
    try {
      const bc = new BroadcastChannel('rakshika_sos');
      bc.onmessage = (evt) => {
        if (evt.data?.type === 'sos_insert') {
          _ingestAlert(evt.data.row);
          _renderAll();
          _showNewAlertToast(evt.data.row);
          _flashBorder();
        } else if (evt.data?.type === 'sos_update') {
          _ingestAlert(evt.data.row);
          _renderAll();
        }
      };
    } catch (e) { /* ignore if not supported */ }

    try {
      const firBc = new BroadcastChannel('rakshika_fir');
      firBc.onmessage = (evt) => {
        if (evt.data?.type === 'fir_insert' && evt.data?.dept === 'police') {
          _ingestFir(evt.data.row);
          _renderAll();
          _showToast('👮 New Police FIR!', `FIR filed by ${evt.data.row.full_name}.`, 'investigating');
          _flashBorder();
        }
      };
    } catch (e) {}
  }

  function _loadFirs() {
    state.firs = new Map();
    try {
      const list = JSON.parse(localStorage.getItem('rakshika_police_firs') || '[]');
      list.forEach(_ingestFir);
    } catch(e) { console.warn('Failed to load local police FIRs:', e); }
  }

  function _ingestFir(row) {
    let lat = null, lng = null;
    if (row.location && row.location.includes(',')) {
      const parts = row.location.split(',');
      const parsedLat = parseFloat(parts[0]);
      const parsedLng = parseFloat(parts[1]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        lat = parsedLat;
        lng = parsedLng;
      }
    }

    const fir = {
      id:           row.id,
      userName:     row.full_name || 'Anonymous',
      location:     row.location || '—',
      lat:          lat,
      lng:          lng,
      status:       row.status || 'pending',
      incidentType: row.incident_type || 'Other',
      description:  row.description || '',
      evidenceUrls: row.evidence_urls || '',
      createdAt:    row.created_at || new Date().toISOString(),
      updatedAt:    row.created_at || new Date().toISOString(),
    };

    state.firs.set(fir.id, fir);

    if (fir.lat && fir.lng && state.map) {
      state.map.upsertMarker(fir.id, fir.lat, fir.lng, {
        userName: fir.userName + ' (FIR)',
        status: fir.status,
        timestamp: fir.createdAt,
        alertId: fir.id,
        lat: fir.lat,
        lng: fir.lng,
      });
    }
  }

  /* ================================================================
     ALERT DATA MODEL
  ================================================================ */
  function _ingestAlert(row) {
    const existing = state.alerts.get(row.id);
    const userName = row.profiles?.full_name
      || (row._isMock ? row.profiles?.full_name : null)
      || 'Unknown User';

    const alert = {
      id:            row.id,
      userId:        row.user_id,
      userName,
      phone:         row.profiles?.phone || '—',
      lat:           row.latitude,
      lng:           row.longitude,
      status:        row.status || 'active',
      emergencyType: row.emergency_type || 'normal',
      threatLevel:   row.threat_level || 'medium',
      createdAt:     row.created_at,
      updatedAt:     row.updated_at,
      _isMock:       row._isMock || false,
    };

    // If new active alert, record in timeline
    if (!existing && alert.status === 'active') {
      _addTimeline(alert.id, `SOS activated by ${alert.userName}`, 'sos');
    }

    state.alerts.set(row.id, alert);

    // Put on map
    if (alert.lat && alert.lng) {
      state.map.upsertMarker(alert.id, alert.lat, alert.lng, _markerMeta(alert));
    }
  }

  function _markerMeta(a) {
    return {
      userName: a.userName,
      status: a.status,
      timestamp: a.updatedAt || a.createdAt,
      alertId: a.id,
      lat: a.lat,
      lng: a.lng,
    };
  }

  /* ================================================================
     RENDER — Alert List
  ================================================================ */
  function _renderAll() {
    _renderAlertList();
    _renderStats();
    _renderIncidentTable();
  }

  function _renderAlertList() {
    if (!$alertList) return;

    if (state.activeTab === 'fir') {
      const sortedFirs = [...state.firs.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (sortedFirs.length === 0) {
        $alertList.innerHTML = `
          <div class="empty-state">
            <i>📋</i>
            No police FIRs filed today.
          </div>`;
        return;
      }
      $alertList.innerHTML = sortedFirs.map(f => _firCardHTML(f)).join('');
      _bindAlertCardEvents();
      return;
    }

    const sorted = [...state.alerts.values()].sort((a, b) => {
      const order = { active: 0, investigating: 1, resolved: 2 };
      const oa = order[a.status] ?? 99;
      const ob = order[b.status] ?? 99;
      if (oa !== ob) return oa - ob;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (sorted.length === 0) {
      $alertList.innerHTML = `
        <div class="empty-state">
          <i>🛡️</i>
          All clear — no active SOS alerts.
        </div>`;
      return;
    }

    $alertList.innerHTML = sorted.map(a => _alertCardHTML(a)).join('');
    _bindAlertCardEvents();
  }

  function _firCardHTML(f) {
    const relTime = _relativeTime(f.createdAt);
    const focused = state.focusedId === f.id ? 'focused-alert' : '';
    const statusClass = `${f.status}-alert`;
    const chipClass = `chip-${f.status}`;
    const chipLabel = f.status.toUpperCase();
    const locationStr = f.location || 'Location pending…';

    let actionBtnHTML = '';
    if (f.status === 'pending') {
      actionBtnHTML = `
        <button class="btn btn-amber" data-action="acknowledge" data-id="${f.id}" style="background:#f59e0b;color:black">
          <i>🔍</i> Approve
        </button>`;
    } else if (f.status === 'acknowledged' || f.status === 'approved') {
      actionBtnHTML = `
        <button class="btn btn-blue" data-action="assign" data-id="${f.id}" style="background:#3b82f6;color:white">
          <i>👤</i> Investigate
        </button>`;
    } else if (f.status === 'assigned' || f.status === 'in_progress' || f.status === 'investigating') {
      actionBtnHTML = `
        <button class="btn btn-green" data-action="resolve" data-id="${f.id}">
          <i>✅</i> Resolve
        </button>`;
    }

    return `
      <div class="alert-card ${statusClass} ${focused}" data-id="${f.id}" id="card-${f.id}">
        <div class="alert-card-top">
          <div>
            <div class="alert-user-name">${_esc(f.userName)}</div>
            <div class="alert-coords">📍 ${locationStr}</div>
            <div style="font-size:.7rem;color:#94a3b8;margin-top:4px">
              🧾 FIR ID: ${f.id.slice(0, 10)}… | Type: ${f.incidentType}
            </div>
          </div>
          <div style="text-align:right">
            <span class="status-chip ${chipClass}">${chipLabel}</span>
            <div class="alert-time">${relTime}</div>
          </div>
        </div>
        <div class="alert-actions" style="margin-top:8px">
          <button class="btn btn-blue" data-action="focus" data-id="${f.id}">
            <i>👁</i> View Detail
          </button>
          ${actionBtnHTML}
        </div>
      </div>`;
  }

  function _alertCardHTML(a) {
    const relTime = _relativeTime(a.createdAt);
    const focused = state.focusedId === a.id ? 'focused-alert' : '';
    const statusClass = `${a.status}-alert`;
    const chipClass = `chip-${a.status}`;
    const chipLabel = a.status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const coordStr = (a.lat && a.lng)
      ? `${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}`
      : 'Location pending…';

    let actionBtnHTML = '';
    if (a.status === 'active') {
      actionBtnHTML = `
        <button class="btn btn-amber" data-action="acknowledge" data-id="${a.id}" style="background:#f59e0b;color:black">
          <i>🔍</i> Acknowledge
        </button>`;
    } else if (a.status === 'acknowledged') {
      actionBtnHTML = `
        <button class="btn btn-blue" data-action="assign" data-id="${a.id}" style="background:#3b82f6;color:white">
          <i>👤</i> Assign
        </button>`;
    } else if (a.status === 'assigned') {
      actionBtnHTML = `
        <button class="btn" data-action="in_progress" data-id="${a.id}" style="background:#f97316;color:white">
          <i>⚙️</i> In Progress
        </button>`;
    } else if (a.status !== 'resolved') {
      actionBtnHTML = `
        <button class="btn btn-green" data-action="resolve" data-id="${a.id}">
          <i>✅</i> Resolve
        </button>`;
    }

    return `
      <div class="alert-card ${statusClass} ${focused}" data-id="${a.id}" id="card-${a.id}">
        <div class="alert-card-top">
          <div>
            <div class="alert-user-name">${_esc(a.userName)}</div>
            <div class="alert-coords">📍 ${coordStr}</div>
            <div style="font-size:.7rem;color:#94a3b8;margin-top:4px">
              ⚠️ Threat: <span class="threat-${a.threatLevel || 'medium'}" style="font-weight:bold">${(a.threatLevel || 'medium').toUpperCase()}</span> | Type: ${(a.emergencyType || 'normal').toUpperCase()}
            </div>
          </div>
          <div style="text-align:right">
            <span class="status-chip ${chipClass}">${chipLabel}</span>
            <div class="alert-time">${relTime}</div>
          </div>
        </div>
        <div class="alert-actions" style="margin-top:8px">
          <button class="btn btn-blue" data-action="focus" data-id="${a.id}">
            <i>🗺</i> Locate
          </button>
          ${actionBtnHTML}
          ${a.status !== 'resolved' && a.status !== 'active' && a.status !== 'acknowledged' && a.status !== 'assigned' && a.status !== 'in_progress' ? `
            <button class="btn btn-green" data-action="resolve" data-id="${a.id}">
              <i>✅</i> Resolve
            </button>` : ''}
          <button class="btn btn-ghost" data-action="replay" data-id="${a.id}">
            <i>▶</i> Replay
          </button>
        </div>
      </div>`;
  }

  function _bindAlertCardEvents() {
    $alertList.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id     = btn.dataset.id;
        const isFir  = state.activeTab === 'fir';
        if (action === 'focus')         _focusAlert(id);
        else if (action === 'acknowledge') _updateStatus(id, isFir ? 'approved' : 'acknowledged');
        else if (action === 'assign')    _updateStatus(id, isFir ? 'investigating' : 'assigned');
        else if (action === 'in_progress') _updateStatus(id, 'in_progress');
        else if (action === 'resolve')  _updateStatus(id, 'resolved');
        else if (action === 'replay')   _replayPath(id);
      });
    });

    // Clicking anywhere on card focuses it
    $alertList.querySelectorAll('.alert-card').forEach(card => {
      card.addEventListener('click', () => _focusAlert(card.dataset.id));
    });
  }

  /* ================================================================
     RENDER — Stats
  ================================================================ */
  function _renderStats() {
    let active = 0, investigating = 0, resolved = 0;
    state.alerts.forEach(a => {
      if (a.status === 'active') active++;
      else if (a.status === 'resolved') resolved++;
      else investigating++; // acknowledged, assigned, in_progress, investigating
    });

    if ($statActive)        $statActive.textContent        = active;
    if ($statInvestigating) $statInvestigating.textContent = investigating;
    if ($statResolved)      $statResolved.textContent      = resolved;
    if ($statTotal)         $statTotal.textContent         = state.alerts.size;

    // Update notification badge
    if ($notifCount) {
      $notifCount.textContent = active;
      $notifCount.style.display = active > 0 ? 'flex' : 'none';
    }
  }

  /* ================================================================
     RENDER — Incident table
  ================================================================ */
  function _renderIncidentTable() {
    if (!$incidentTableBody) return;
    const combined = [...state.alerts.values(), ...state.firs.values()]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);

    if (combined.length === 0) {
      $incidentTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#4a5568">No incidents yet.</td></tr>`;
      return;
    }

    $incidentTableBody.innerHTML = combined.map((a, idx) => {
      const isFir = state.firs.has(a.id);
      const name = isFir ? `${a.userName} (FIR)` : a.userName;
      const locationVal = a.lat ? `${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}` : (a.location || '—');
      return `
        <tr>
          <td style="font-family:monospace;font-size:.72rem">#${String(idx + 1).padStart(3, '0')}</td>
          <td>${_esc(name)}</td>
          <td style="font-family:monospace;font-size:.74rem">${locationVal}</td>
          <td><span class="status-chip chip-${a.status}">${a.status}</span></td>
          <td style="font-family:monospace;font-size:.72rem">${_formatTime(a.createdAt)}</td>
          <td>
            ${a.status !== 'resolved'
              ? `<button class="btn btn-green" style="padding:4px 8px;font-size:.7rem" onclick="window.policeResolve('${a.id}')">Resolve</button>`
              : `<span style="color:#10b981;font-size:.75rem">✓ Done</span>`
            }
          </td>
        </tr>`;
    }).join('');
  }

  /* ================================================================
     ACTIONS
  ================================================================ */
  function _focusAlert(id) {
    state.focusedId = id;
    let isFir = false;
    let a = state.alerts.get(id);
    if (!a) {
      a = state.firs.get(id);
      if (a) isFir = true;
    }
    if (!a) return;

    // Map
    if (a.lat && a.lng) state.map.focusAlert(id);

    // Update detail panel
    _renderDetail(a);
    
    // Toggle movement timeline panel visibility (not applicable to FIRs)
    const timelineCard = $timelineFeed?.closest('.panel-card');
    if (timelineCard) {
      if (isFir) {
        timelineCard.style.display = 'none';
      } else {
        timelineCard.style.display = '';
        _renderTimeline(id);
      }
    }

    // Highlight card
    document.querySelectorAll('.alert-card').forEach(c => c.classList.remove('focused-alert'));
    const card = document.getElementById('card-' + id);
    if (card) { card.classList.add('focused-alert'); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

    // Show focus badge
    if ($focusBadge) {
      $focusBadge.textContent = '🎯 ' + a.userName;
      $focusBadge.style.display = 'inline-flex';
    }
  }

  function _renderDetail(a) {
    const isFir = !state.alerts.has(a.id);

    if ($detailName)   $detailName.textContent   = a.userName;
    if ($detailId)     $detailId.textContent      = a.id.slice(0, 12) + '…';
    if ($detailStatus) {
      $detailStatus.innerHTML = `<span class="status-chip chip-${a.status}">${a.status}</span>`;
    }
    if ($detailType)   $detailType.textContent   = (a.emergencyType || a.incidentType || 'normal').toUpperCase();
    if ($detailThreat) {
      $detailThreat.innerHTML = `<span class="threat-${a.threatLevel || 'medium'}" style="font-weight:bold">${(a.threatLevel || 'medium').toUpperCase()}</span>`;
    }
    if ($detailStatusSelect) {
      if (isFir) {
        $detailStatusSelect.innerHTML = `
          <option value="pending">⏳ Pending</option>
          <option value="approved">🟡 Approved</option>
          <option value="investigating">🔵 Investigating</option>
          <option value="resolved">🟢 Resolved</option>
        `;
      } else {
        $detailStatusSelect.innerHTML = `
          <option value="active">🔴 Active</option>
          <option value="acknowledged">🟡 Acknowledged</option>
          <option value="assigned">🔵 Assigned</option>
          <option value="in_progress">🟠 In Progress</option>
          <option value="resolved">🟢 Resolved</option>
        `;
      }
      $detailStatusSelect.value = a.status;
    }
    if ($detailLat) $detailLat.textContent  = a.lat ? a.lat.toFixed(6) : '—';
    if ($detailLng) $detailLng.textContent  = a.lng ? a.lng.toFixed(6) : '—';
    if ($detailTime) $detailTime.textContent = _formatTime(a.updatedAt || a.createdAt);

    // Show/hide description and evidence fields
    const descRow = document.getElementById('detailDescRow');
    const evidenceRow = document.getElementById('detailEvidenceRow');
    const descVal = document.getElementById('detailDesc');
    const evidenceVal = document.getElementById('detailEvidence');

    if (isFir) {
      if (descRow && descVal) {
        descRow.style.display = 'flex';
        descVal.textContent = a.description || 'No description provided.';
      }
      if (evidenceRow && evidenceVal) {
        evidenceRow.style.display = 'flex';
        const evList = (a.evidenceUrls || '')
          .split(/[|\n,]/)
          .map(url => url.trim())
          .filter(Boolean);

        if (evList.length > 0) {
          evidenceVal.innerHTML = evList.map((url, i) => {
            const isVid = /\.(mp4|webm|ogg|mov|avi|mkv|flv|m4v|3gp)$/i.test(url.split('?')[0]);
            const isImg = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url.split('?')[0]);
            if (isVid) {
              return `<div class="ev-video-wrap">
                <div class="ev-video-label">🎥 Video Evidence ${i + 1}</div>
                <video class="ev-video-player" src="${url}" controls muted playsinline preload="metadata">
                  Your browser does not support video.
                </video>
                <div style="text-align:right;margin-top:4px">
                  <a class="evidence-item-link" href="${url}" download target="_blank" rel="noopener">⬇️ Download</a>
                </div>
              </div>`;
            } else if (isImg) {
              return `<div class="ev-video-wrap">
                <div class="ev-video-label">🖼️ Image Evidence ${i + 1}</div>
                <img class="ev-img-preview" src="${url}" alt="Evidence image ${i + 1}" loading="lazy" />
                <div style="text-align:right;margin-top:4px">
                  <a class="evidence-item-link" href="${url}" target="_blank" rel="noopener">🔎 View Full</a>
                </div>
              </div>`;
            } else {
              return `<a class="evidence-item-link" href="${url}" target="_blank" rel="noopener">
                <span>🔗</span>
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px">${url}</span>
              </a>`;
            }
          }).join('');
        } else {
          evidenceVal.innerHTML = `<span style="font-size:0.75rem;color:var(--text-3);font-style:italic">No attachments.</span>`;
        }
      }
    } else {
      if (descRow) descRow.style.display = 'none';
      if (evidenceRow) evidenceRow.style.display = 'none';
    }
  }

  function _renderTimeline(id) {
    if (!$timelineFeed) return;
    const entries = state.timeline.filter(e => e.id === id);

    if (entries.length === 0) {
      $timelineFeed.innerHTML = `<div style="color:#4a5568;font-size:.78rem;padding:10px">No history yet.</div>`;
      return;
    }

    $timelineFeed.innerHTML = entries.map((e, i) => {
      const isLast = i === entries.length - 1;
      const nodeClass = e.kind === 'sos' ? 'sos-node' : e.kind === 'resolved' ? 'resolved-node' : 'coord-node';
      return `
        <div class="timeline-entry">
          <div class="timeline-line-wrap">
            <div class="timeline-node ${nodeClass}"></div>
            ${!isLast ? '<div class="timeline-vline"></div>' : ''}
          </div>
          <div class="timeline-content">
            <div class="timeline-event-title">${e.label}</div>
            <div class="timeline-event-meta">${_formatTime(e.ts)}</div>
          </div>
        </div>`;
    }).join('');
  }

  function _addTimeline(id, label, kind = 'coord') {
    state.timeline.push({ id, label, kind, ts: new Date().toISOString() });
  }

  async function _updateStatus(id, newStatus) {
    let isFir = false;
    let item = state.alerts.get(id);
    if (!item) {
      item = state.firs.get(id);
      if (item) isFir = true;
    }
    if (!item) return;

    item.status = newStatus;

    if (isFir) {
      state.firs.set(id, item);

      // Update in localStorage
      try {
        const list = JSON.parse(localStorage.getItem('rakshika_police_firs') || '[]');
        const idx = list.findIndex(x => x.id === id);
        if (idx !== -1) {
          list[idx].status = newStatus;
          localStorage.setItem('rakshika_police_firs', JSON.stringify(list));
        }
      } catch (e) { console.warn('Failed to update local storage:', e); }

      // Broadcast status change
      try {
        const statusBc = new BroadcastChannel('rakshika_status_update');
        statusBc.postMessage({ type: 'status_update', dept: 'police', id, status: newStatus });
        statusBc.close();
      } catch (e) {}
    } else {
      state.alerts.set(id, item);

      // Update marker icon
      state.map.upsertMarker(id, item.lat, item.lng, _markerMeta(item));
      _addTimeline(id, `Status changed to "${newStatus.replace('_', ' ')}"`, newStatus === 'resolved' ? 'resolved' : 'coord');

      // Supabase or Mock persist
      if (DB) {
        try {
          await DB.updateSOSStatus(id, newStatus);
        } catch (e) {
          console.warn('Failed to persist status:', e);
        }
      }
    }

    _renderAll();
    if (state.focusedId === id) _renderDetail(item);
    if (!isFir && state.focusedId === id) _renderTimeline(id);

    const toastTitles = {
      active: '🔴 SOS Alert Active',
      acknowledged: '🟡 SOS Acknowledged',
      assigned: '🔵 Responder Assigned',
      in_progress: '🟠 Dispatch In Progress',
      resolved: '🟢 Case Resolved',
      approved: '🟢 FIR Approved',
      investigating: '🔵 Case Under Investigation'
    };

    _showToast(
      toastTitles[newStatus] || '🔍 Status Updated',
      `${item.userName}'s ${isFir ? 'FIR' : 'alert'} marked as ${newStatus.replace('_', ' ')}.`,
      newStatus === 'resolved' ? 'resolved' : 'investigating'
    );
  }

  async function _replayPath(id) {
    const a = state.alerts.get(id);
    if (!a) return;

    if (state.focusedId !== id) _focusAlert(id);

    _showToast('🔍 Path Replay', `Fetching movement logs for ${a.userName}...`, 'info');
    
    let logs = [];
    if (DB) {
      const res = await DB.getLocationHistory(id);
      if (res.data) logs = res.data;
    }

    if (logs.length < 2) {
      _showToast('⚠️ No Path Found', 'Not enough location logs recorded for this session yet.', 'warning');
      return;
    }

    const path = logs.map(l => [l.latitude, l.longitude]);
    state.map._pathCoords.set(id, path);

    _showToast('▶ Path Replay', `Replaying ${logs.length} movement logs for ${a.userName}`, 'info');
    _addTimeline(id, 'Path replay started', 'coord');

    state.map.replayPath(id, ({ step, total }) => {
      const log = logs[step - 1];
      const timeStr = log ? new Date(log.timestamp).toLocaleTimeString() : '';
      if ($timelineFeed) {
        _addTimeline(id, `Step ${step}/${total}: Ping at ${timeStr}`, 'coord');
        _renderTimeline(id);
      }
    });
  }

  // Exposed for inline onclick in table
  window.policeResolve = (id) => _updateStatus(id, 'resolved');

  /* ================================================================
     FIT ALL BUTTON
  ================================================================ */
  function _bindGlobalActions() {
    const fitBtn = document.getElementById('btnFitAll');
    if (fitBtn) fitBtn.addEventListener('click', () => state.map.fitAll());

    const clearPathsBtn = document.getElementById('btnClearPaths');
    if (clearPathsBtn) clearPathsBtn.addEventListener('click', () => {
      state.map.clearPaths();
      _showToast('🗺 Paths Cleared', 'All tracking paths removed from map.', 'info');
    });

    // Simulate new SOS for demo
    const demoBtn = document.getElementById('btnDemoSOS');
    if (demoBtn) demoBtn.addEventListener('click', _simulateNewSOS);

    // Tab toggles
    const tabSOS = document.getElementById('tabSOS');
    const tabFIR = document.getElementById('tabFIR');
    if (tabSOS && tabFIR) {
      tabSOS.addEventListener('click', () => {
        tabSOS.classList.add('active');
        tabFIR.classList.remove('active');
        state.activeTab = 'sos';
        document.getElementById('feedTitle').textContent = 'Live SOS Feed';
        const liveDot = document.getElementById('feedLiveDot');
        if (liveDot) liveDot.style.display = 'block';
        _renderAlertList();
      });
      tabFIR.addEventListener('click', () => {
        tabFIR.classList.add('active');
        tabSOS.classList.remove('active');
        state.activeTab = 'fir';
        document.getElementById('feedTitle').textContent = 'Filed Police FIRs';
        const liveDot = document.getElementById('feedLiveDot');
        if (liveDot) liveDot.style.display = 'none';
        _renderAlertList();
      });
    }
  }

  /* ================================================================
     DEMO: Simulate new SOS
  ================================================================ */
  async function _simulateNewSOS() {
    const names = ['Sunita Devi', 'Pallavi Nair', 'Shreya Joshi', 'Neha Kumar'];
    const lats  = [18.5204, 17.3850, 23.0225, 26.8467];
    const lngs  = [73.8567, 78.4867, 72.5714, 80.9462];
    const idx   = Math.floor(Math.random() * names.length);
    const threatLevels = ['low', 'medium', 'high', 'critical'];
    const threat = threatLevels[Math.floor(Math.random() * threatLevels.length)];
    const id = 'demo-' + Date.now();

    const mockRow = {
      id: id,
      user_id: 'demo-user',
      latitude: lats[idx],
      longitude: lngs[idx],
      status: 'active',
      emergency_type: 'panic',
      threat_level: threat,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: { full_name: names[idx], phone: '+91 98765 43210' },
      _isMock: true,
    };

    _ingestAlert(mockRow);
    _renderAll();
    _showNewAlertToast(mockRow);
    _flashBorder();

    // Insert 5 simulated tracking logs drifting slightly
    if (DB) {
      for (let i = 0; i < 5; i++) {
        const offsetLat = (i * 0.002);
        const offsetLng = (i * 0.001);
        await DB.insertLocationLog({
          session_id: id,
          latitude: lats[idx] + offsetLat,
          longitude: lngs[idx] + offsetLng,
          accuracy: 10,
          timestamp: new Date(Date.now() + i * 10000).toISOString()
        });
      }
    }
  }

  /* ================================================================
     TOAST NOTIFICATIONS
  ================================================================ */
  function _showNewAlertToast(row) {
    const name = row.profiles?.full_name || 'Unknown';
    _showToast('🚨 New SOS Alert!', `Emergency from ${name}. Tap to locate.`, 'sos');
  }

  function _showToast(title, desc, type = 'info') {
    if (!$toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast${type === 'sos' ? ' sos-toast' : ''}`;
    toast.innerHTML = `
      <div class="toast-icon">${type === 'sos' ? '🆘' : type === 'resolved' ? '✅' : type === 'investigating' ? '🔍' : 'ℹ️'}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        <div class="toast-desc">${desc}</div>
      </div>
      <button class="toast-close">✕</button>`;
    $toastContainer.prepend(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 6000);
  }

  /* ================================================================
     FLASH BORDER
  ================================================================ */
  function _flashBorder() {
    document.body.classList.add('new-alert-flash');
    // Play alert beep if available
    try {
      const audio = new Audio('../assets/alarm.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
    setTimeout(() => document.body.classList.remove('new-alert-flash'), 2000);
  }

  /* ================================================================
     MOBILE SIDEBAR
  ================================================================ */
  function _initSidebar() {
    const menuBtn  = document.getElementById('mobileMenuBtn');
    const overlay  = document.getElementById('sidebarOverlay');
    const sidebar  = document.getElementById('policeSidebar');
    const closeBtn = document.getElementById('sidebarClose');

    function open()  { sidebar?.classList.add('open'); overlay?.classList.add('open'); }
    function close() { sidebar?.classList.remove('open'); overlay?.classList.remove('open'); }

    menuBtn?.addEventListener('click', open);
    overlay?.addEventListener('click', close);
    closeBtn?.addEventListener('click', close);
  }

  /* ================================================================
     HELPERS
  ================================================================ */
  function _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function _relativeTime(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m ago`;
  }

  function _formatTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  }

})();
