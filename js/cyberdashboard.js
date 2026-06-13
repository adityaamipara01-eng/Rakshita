/* ============================================================
   RAKSHIKA — CYBER CRIME DASHBOARD LOGIC
   js/cyberdashboard.js
   Features: Supabase/Mock data, risk detection, filters,
             evidence viewer, status management, analytics
============================================================ */

(function () {
  'use strict';

  /* ============================================================
     CONSTANTS
  ============================================================ */
  const CRIME_TYPES = [
    'Fraud', 'Blackmail', 'Harassment', 'Scam',
    'Nude Leak', 'Identity Theft', 'Cyberstalking',
    'Phishing', 'Other'
  ];

  const RISK_KEYWORDS = {
    high:   ['blackmail', 'nude', 'leak', 'suicide', 'kill', 'rape', 'assault', 'extort', 'threat'],
    medium: ['fraud', 'otp', 'money', 'bank', 'account', 'password', 'scam', 'fake', 'ransom'],
    low:    ['harassment', 'abuse', 'troll', 'stalk', 'offensive', 'hack'],
  };

  /* ============================================================
     STATE
  ============================================================ */
  const S = {
    reports:    [],         // all fetched
    filtered:   [],         // after search/filter
    selected:   null,       // currently viewed report id
    searchQuery: '',
    filterType:  'all',
    filterStatus:'all',
    DB: null,
  };

  /* ============================================================
     DOM REFS
  ============================================================ */
  let $tbody, $anaTotal, $anaPending, $anaResolved, $anaHighRisk;
  let $searchInput, $typeFilter, $statusFilter;
  let $evPanel, $rowCount, $toastWrap, $clockEl;

  /* ============================================================
     INIT
  ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    _cacheDOM();
    _startClock();
    _initSidebar();
    _bindFilters();
    _initDB();
    _bindAddReportModal();
  });

  function _cacheDOM() {
    $tbody       = document.getElementById('reportsTbody');
    $anaTotal    = document.getElementById('anaTotal');
    $anaPending  = document.getElementById('anaPending');
    $anaResolved = document.getElementById('anaResolved');
    $anaHighRisk = document.getElementById('anaHighRisk');
    $searchInput = document.getElementById('searchInput');
    $typeFilter  = document.getElementById('typeFilter');
    $statusFilter= document.getElementById('statusFilter');
    $evPanel     = document.getElementById('evidencePanel');
    $rowCount    = document.getElementById('rowCount');
    $toastWrap   = document.getElementById('toastWrap');
    $clockEl     = document.getElementById('cyberClock');
  }

  /* ============================================================
     CLOCK
  ============================================================ */
  function _startClock() {
    const tick = () => {
      if (!$clockEl) return;
      $clockEl.textContent = new Date().toLocaleTimeString('en-IN', {
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

    // Authenticate responder
    let currentOfficer = null;
    if (window.rakshikaAuth) {
      currentOfficer = window.rakshikaAuth.requireAuth('cyber');
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
      const nameEl = document.querySelector('.sb-officer-info .name');
      if (nameEl && currentOfficer.name) {
        nameEl.textContent = currentOfficer.name;
      }
      const avatarEl = document.querySelector('.sb-avatar');
      if (avatarEl && currentOfficer.name) {
        avatarEl.textContent = currentOfficer.name.slice(0, 2).toUpperCase();
      }
    }

    if (S.DB && S.DB.isReady && S.DB.isReady()) {
      _fetchReports();
      _subscribeRealtime();
    } else {
      // Graceful mock fallback for demo / offline
      _loadMockReports();
    }
    _loadUserFirs();
    _listenBroadcast();
  }

  /* ---- Supabase fetch ---- */
  async function _fetchReports() {
    try {
      const { data, error } = await S.DB.client
        .from('cyber_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      S.reports = (data || []).map(_enrichReport);
      _applyFilters();
    } catch (e) {
      console.warn('[Cyber] Supabase error:', e.message);
      _loadMockReports();
    }
  }

  function _subscribeRealtime() {
    try {
      S.DB.client
        .channel('cyber_reports_watch')
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'cyber_reports'
        }, ({ eventType, new: row, old }) => {
          if (eventType === 'INSERT') {
            const r = _enrichReport(row);
            S.reports.unshift(r);
            _applyFilters();
            _toast('🆕 New Report', `${r.user_name} filed a ${r.crime_type} report.`, 'info');
          } else if (eventType === 'UPDATE') {
            const idx = S.reports.findIndex(x => x.id === row.id);
            if (idx !== -1) S.reports[idx] = _enrichReport(row);
            if (S.selected === row.id) _renderEvidence(S.reports[idx]);
            _applyFilters();
          } else if (eventType === 'DELETE') {
            S.reports = S.reports.filter(x => x.id !== old.id);
            _applyFilters();
          }
        })
        .subscribe();
    } catch (e) { console.warn('[Cyber] Realtime sub error:', e); }
  }

  /* ---- Mock fallback ---- */
  function _loadMockReports() {
    const mocks = [
      {
        id: 'm1', user_name: 'Priya Sharma',
        crime_type: 'Blackmail',
        description: 'Ex-boyfriend threatening to leak private photos unless ₹50,000 is transferred. Sent OTP screenshots as proof.',
        evidence_url: 'https://drive.google.com/evidence1|https://t.me/screenshot1',
        status: 'active', created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'm2', user_name: 'Ananya Singh',
        crime_type: 'Fraud',
        description: 'Received fake job offer. Paid ₹15,000 as registration fee. Money transferred via UPI to unknown account.',
        evidence_url: 'https://upi-screenshot.png|https://bank-statement.pdf',
        status: 'investigating', created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'm3', user_name: 'Kavya Reddy',
        crime_type: 'Harassment',
        description: 'Receiving repeated abusive messages on Instagram from multiple fake accounts created to harass.',
        evidence_url: 'https://instagram.com/evidence|https://screenshot_chat.jpg',
        status: 'pending', created_at: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: 'm4', user_name: 'Meera Patel',
        crime_type: 'Nude Leak',
        description: 'Intimate photos shared on Telegram group without consent. Victim in extreme distress. Immediate action required.',
        evidence_url: 'https://t.me/channel_evidence|https://report_telegram.pdf',
        status: 'active', created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'm5', user_name: 'Sunita Devi',
        crime_type: 'Scam',
        description: 'Received call from fake bank representative. Shared OTP and lost ₹2 lakhs from account.',
        evidence_url: 'https://call-log.pdf',
        status: 'resolved', created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'm6', user_name: 'Riya Gupta',
        crime_type: 'Cyberstalking',
        description: 'Unknown person tracking live location using hidden app installed on phone. Sent threatening messages referencing her daily routine.',
        evidence_url: '',
        status: 'investigating', created_at: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: 'm7', user_name: 'Pallavi Nair',
        crime_type: 'Phishing',
        description: 'Fake government portal link shared via WhatsApp. Clicked link and personal details compromised.',
        evidence_url: 'https://fake-site.com/evidence|https://whatsapp-screenshot.jpg',
        status: 'pending', created_at: new Date(Date.now() - 21600000).toISOString(),
      },
    ];
    S.reports = mocks.map(_enrichReport);
    _applyFilters();
    _toast('ℹ Demo Mode', 'Loaded sample cyber reports. Connect Supabase for live data.', 'info');
  }

  /* ============================================================
     RISK DETECTION ENGINE (Keyword-based, no AI)
  ============================================================ */
  function _detectRisk(report) {
    const text = [
      report.description || '',
      report.crime_type  || '',
      report.evidence_url || '',
    ].join(' ').toLowerCase();

    // High risk — any single keyword triggers it
    for (const kw of RISK_KEYWORDS.high) {
      if (text.includes(kw)) return 'high';
    }
    // Count medium keyword hits
    let mediumHits = 0;
    for (const kw of RISK_KEYWORDS.medium) {
      if (text.includes(kw)) mediumHits++;
    }
    if (mediumHits >= 2) return 'high';
    if (mediumHits >= 1) return 'medium';

    // Low
    for (const kw of RISK_KEYWORDS.low) {
      if (text.includes(kw)) return 'low';
    }
    return 'low';
  }

  /* ============================================================
     ENRICH
  ============================================================ */
  function _enrichReport(row) {
    const r = { ...row };
    // Normalise status
    r.status = (r.status || 'pending').toLowerCase();
    if (!['pending','investigating','resolved','active'].includes(r.status)) r.status = 'pending';
    if (r.status === 'active') r.status = 'pending';

    // Normalise crime_type
    r.crime_type = r.crime_type || 'Other';

    // Detect risk
    r.risk = _detectRisk(r);

    // Parse evidence URLs into array
    r.evidenceList = (r.evidence_url || '')
      .split(/[|\n,]/)
      .map(s => s.trim())
      .filter(Boolean);

    return r;
  }

  /* ============================================================
     FILTERS
  ============================================================ */
  function _bindFilters() {
    $searchInput?.addEventListener('input', (e) => {
      S.searchQuery = e.target.value.trim().toLowerCase();
      _applyFilters();
    });
    $typeFilter?.addEventListener('change', (e) => {
      S.filterType = e.target.value;
      _applyFilters();
    });
    $statusFilter?.addEventListener('change', (e) => {
      S.filterStatus = e.target.value;
      _applyFilters();
    });

    // Clear filters button
    document.getElementById('btnClearFilters')?.addEventListener('click', () => {
      S.searchQuery = '';
      S.filterType  = 'all';
      S.filterStatus = 'all';
      if ($searchInput)  $searchInput.value  = '';
      if ($typeFilter)   $typeFilter.value   = 'all';
      if ($statusFilter) $statusFilter.value = 'all';
      _applyFilters();
    });
  }

  function _applyFilters() {
    S.filtered = S.reports.filter(r => {
      const q = S.searchQuery;
      const matchSearch = !q || (
        r.user_name?.toLowerCase().includes(q) ||
        r.crime_type?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
      const matchType = S.filterType === 'all' ||
        r.crime_type?.toLowerCase() === S.filterType.toLowerCase();
      const matchStatus = S.filterStatus === 'all' || r.status === S.filterStatus;
      return matchSearch && matchType && matchStatus;
    });

    _renderTable();
    _renderAnalytics();
  }

  /* ============================================================
     RENDER TABLE
  ============================================================ */
  function _renderTable() {
    if (!$tbody) return;

    if ($rowCount) $rowCount.textContent = S.filtered.length;

    if (S.filtered.length === 0) {
      $tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-table">
            <span class="empty-icon">🔍</span>
            No reports match your search/filter criteria.
          </td>
        </tr>`;
      return;
    }

    $tbody.innerHTML = S.filtered.map((r, i) => {
      const isSelected = S.selected === r.id ? 'selected-row' : '';
      const crimeClass = _crimeClass(r.crime_type);
      const ts = _fmtTime(r.created_at);
      const descShort = (r.description || '').slice(0, 80) + ((r.description || '').length > 80 ? '…' : '');

      return `
        <tr class="${isSelected} row-enter" data-id="${r.id}" style="animation-delay:${i * 0.03}s">
          <td>
            <span style="font-family:var(--text-mono);font-size:.7rem;color:var(--text-3)">#${String(i+1).padStart(3,'0')}</span>
          </td>
          <td class="td-name">${_esc(r.user_name || '—')}</td>
          <td class="td-type"><span class="crime-badge ${crimeClass}">${_esc(r.crime_type)}</span></td>
          <td class="td-desc" title="${_esc(r.description || '')}">${_esc(descShort)}</td>
          <td><span class="risk-badge ${r.risk}">${_riskIcon(r.risk)} ${r.risk.toUpperCase()}</span></td>
          <td><span class="status-badge ${r.status}">${_statusIcon(r.status)} ${r.status}</span></td>
          <td class="td-time">${ts}</td>
          <td class="td-actions">
            <button class="btn btn-ghost btn-sm btn-view" data-view="${r.id}">
              👁 View
            </button>
          </td>
        </tr>`;
    }).join('');

    // Bind row clicks
    $tbody.querySelectorAll('tr[data-id]').forEach(row => {
      row.addEventListener('click', () => _selectReport(row.dataset.id));
    });

    // Bind view buttons (stop propagation)
    $tbody.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _selectReport(btn.dataset.view);
      });
    });
  }

  /* ============================================================
     RENDER ANALYTICS
  ============================================================ */
  function _renderAnalytics() {
    const all      = S.reports;
    const total    = all.length;
    const pending  = all.filter(r => r.status === 'pending').length;
    const resolved = all.filter(r => r.status === 'resolved').length;
    const highRisk = all.filter(r => r.risk === 'high').length;

    _setNum($anaTotal,    total);
    _setNum($anaPending,  pending);
    _setNum($anaResolved, resolved);
    _setNum($anaHighRisk, highRisk);

    // Update sidebar badges
    const sb = document.getElementById('sbPendingCount');
    if (sb) sb.textContent = pending;
    const sbhr = document.getElementById('sbHighRiskCount');
    if (sbhr) sbhr.textContent = highRisk;
  }

  function _setNum(el, val) {
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = '';
    el.textContent = val;
  }

  /* ============================================================
     SELECT REPORT → Evidence Viewer
  ============================================================ */
  function _selectReport(id) {
    S.selected = id;
    const r = S.reports.find(x => x.id === id);
    if (!r) return;

    // Highlight table row
    document.querySelectorAll('.reports-table tbody tr').forEach(tr => {
      tr.classList.toggle('selected-row', tr.dataset.id === id);
    });

    _renderEvidence(r);

    // Scroll evidence panel into view on mobile
    if (window.innerWidth < 1200) {
      document.getElementById('evidenceSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function _renderEvidence(r) {
    if (!$evPanel) return;

    const riskColor = r.risk === 'high' ? 'var(--risk-high)' : r.risk === 'medium' ? 'var(--risk-medium)' : 'var(--risk-low)';

    $evPanel.innerHTML = `
      <!-- Report Header -->
      <div class="ev-head">
        <div class="ev-title">
          <span>📋</span>
          <span>Report Detail</span>
        </div>
        <span class="risk-badge ${r.risk}">${_riskIcon(r.risk)} ${r.risk.toUpperCase()} RISK</span>
      </div>

      <div class="ev-body">

        <!-- Meta rows -->
        <div class="ev-meta-row">
          <span class="ev-meta-label">👤 User</span>
          <span class="ev-meta-value">${_esc(r.user_name || '—')}</span>
        </div>
        <div class="ev-meta-row">
          <span class="ev-meta-label">🏷 Type</span>
          <span class="ev-meta-value"><span class="crime-badge ${_crimeClass(r.crime_type)}">${_esc(r.crime_type)}</span></span>
        </div>
        <div class="ev-meta-row">
          <span class="ev-meta-label">🔑 ID</span>
          <span class="ev-meta-value" style="font-family:var(--text-mono);font-size:.7rem;color:var(--text-3)">${r.id}</span>
        </div>
        <div class="ev-meta-row">
          <span class="ev-meta-label">🕐 Filed</span>
          <span class="ev-meta-value">${_fmtTimeFull(r.created_at)}</span>
        </div>

        <!-- Description -->
        <div>
          <div style="font-size:.72rem;color:var(--text-3);font-family:var(--text-mono);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">📝 Description</div>
          <div class="ev-description">${_esc(r.description || 'No description provided.')}</div>
        </div>

        <!-- Risk Analysis -->
        <div>
          <div style="font-size:.72rem;color:var(--text-3);font-family:var(--text-mono);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">⚠️ Risk Analysis</div>
          <div style="background:var(--bg-card-3);border:1px solid ${riskColor}33;border-radius:var(--r-sm);padding:10px 12px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span class="risk-badge ${r.risk}" style="font-size:.75rem">${_riskIcon(r.risk)} ${r.risk.toUpperCase()} RISK</span>
            </div>
            <div style="font-size:.74rem;color:var(--text-2);line-height:1.6">${_riskReason(r)}</div>
          </div>
        </div>

        <!-- Evidence Files (links + inline video players) -->
        <div>
          <div style="font-size:.72rem;color:var(--text-3);font-family:var(--text-mono);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">📎 Evidence (${r.evidenceList.length})</div>
          ${r.evidenceList.length > 0
            ? `<div class="evidence-links">
                ${r.evidenceList.map((url, i) => {
                  const isVid = _isVideoUrl(url);
                  const isImg = _isImageUrl(url);
                  return isVid
                    ? `<div class="ev-video-wrap">
                        <div class="ev-video-label">🎥 Video Evidence ${i+1}</div>
                        <video class="ev-video-player" src="${_esc(url)}" controls muted playsinline preload="metadata">
                          Your browser does not support video.
                        </video>
                        <div style="text-align:right;margin-top:4px">
                          <a class="evidence-link-copy" href="${_esc(url)}" download target="_blank" rel="noopener" title="Download video">⬇️ Download</a>
                          <button class="evidence-link-copy" style="margin-left:6px" onclick="navigator.clipboard.writeText('${_esc(url)}'); window.cyberToast && window.cyberToast('Copied!','Link copied','info')" title="Copy link">📋 Copy Link</button>
                        </div>
                      </div>`
                    : isImg
                    ? `<div class="ev-video-wrap">
                        <div class="ev-video-label">🖼️ Image Evidence ${i+1}</div>
                        <img class="ev-img-preview" src="${_esc(url)}" alt="Evidence image ${i+1}" loading="lazy" />
                        <div style="text-align:right;margin-top:4px">
                          <a class="evidence-link-copy" href="${_esc(url)}" target="_blank" rel="noopener">🔎 View Full</a>
                        </div>
                      </div>`
                    : `<a class="evidence-link-item" href="${_esc(url)}" target="_blank" rel="noopener">
                        <span class="evidence-link-icon">${_evidenceIcon(url)}</span>
                        <span class="evidence-link-text">${_esc(url)}</span>
                        <button class="evidence-link-copy" onclick="event.preventDefault(); navigator.clipboard.writeText('${_esc(url)}'); window.cyberToast && window.cyberToast('Copied!','Link copied to clipboard','info')" title="Copy link">📋</button>
                      </a>`;
                }).join('')}
              </div>`
            : `<div style="font-size:.76rem;color:var(--text-3);font-style:italic;padding:8px 0">No evidence files attached.</div>`
          }
        </div>

        <!-- Chat Log Placeholder -->
        <div>
          <div style="font-size:.72rem;color:var(--text-3);font-family:var(--text-mono);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">💬 Chat Log / Notes</div>
          <div class="chat-log-area" id="chatLogArea" contenteditable="true" spellcheck="false"
            data-placeholder="Add investigation notes, chat extracts…"
            style="min-height:80px;outline:none;">${_getChatLog(r.id)}</div>
          <div style="text-align:right;margin-top:6px">
            <button class="btn btn-ghost btn-sm" onclick="window.saveChatLog && window.saveChatLog('${r.id}')">💾 Save Note</button>
          </div>
        </div>

        <!-- Status Update -->
        <div>
          <div style="font-size:.72rem;color:var(--text-3);font-family:var(--text-mono);margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">🚦 Update Status</div>
          <div class="status-update-row">
            <button class="btn btn-pending ${r.status==='pending'?'active-status':''}" style="flex:1"
              onclick="window.updateCyberStatus('${r.id}','pending')">
              ⏳ Pending
            </button>
            <button class="btn btn-investigating ${r.status==='investigating'?'active-status':''}" style="flex:1"
              onclick="window.updateCyberStatus('${r.id}','investigating')">
              🔍 Investigate
            </button>
            <button class="btn btn-resolved ${r.status==='resolved'?'active-status':''}" style="flex:1"
              onclick="window.updateCyberStatus('${r.id}','resolved')">
              ✅ Resolved
            </button>
          </div>
        </div>

        <!-- Danger zone -->
        <div style="padding-top:8px;border-top:1px solid var(--border)">
          <button class="btn btn-danger btn-sm" style="width:100%" onclick="window.deleteCyberReport && window.deleteCyberReport('${r.id}')">
            🗑 Delete Report
          </button>
        </div>
      </div>`;
  }

  /* ============================================================
     STATUS UPDATE
  ============================================================ */
  window.updateCyberStatus = async function (id, newStatus) {
    const idx = S.reports.findIndex(r => r.id === id);
    if (idx === -1) return;
    const r = S.reports[idx];
    r.status = newStatus;
    _applyFilters();
    if (S.selected === id) _renderEvidence(r);

    _toast('🚦 Status Updated', `Case set to "${newStatus}".`,
      newStatus === 'resolved' ? 'success' : 'info');

    // If User FIR, update local storage and broadcast
    if (r._isUserFir || id.startsWith('local-')) {
      try {
        const list = JSON.parse(localStorage.getItem('rakshika_cyber_firs') || '[]');
        const lIdx = list.findIndex(x => x.id === id);
        if (lIdx !== -1) {
          list[lIdx].status = newStatus;
          localStorage.setItem('rakshika_cyber_firs', JSON.stringify(list));
        }
      } catch (e) { console.warn('Failed to update local storage:', e); }

      // Broadcast status change
      try {
        const statusBc = new BroadcastChannel('rakshika_status_update');
        statusBc.postMessage({ type: 'status_update', dept: 'cyber', id, status: newStatus });
        statusBc.close();
      } catch (e) {}
    } else {
      if (S.DB && S.DB.isReady && S.DB.isReady()) {
        try {
          await S.DB.client.from('cyber_reports').update({ status: newStatus }).eq('id', id);
        } catch (e) { console.warn('[Cyber] Update error:', e); }
      }
    }
  };

  /* ============================================================
     DELETE REPORT
  ============================================================ */
  window.deleteCyberReport = async function (id) {
    if (!confirm('Are you sure you want to delete this report? This cannot be undone.')) return;
    S.reports = S.reports.filter(r => r.id !== id);
    S.selected = null;
    if ($evPanel) $evPanel.innerHTML = _evEmpty();
    _applyFilters();
    _toast('🗑 Deleted', 'Report removed.', 'warning');

    if (S.DB && S.DB.isReady && S.DB.isReady()) {
      try {
        await S.DB.client.from('cyber_reports').delete().eq('id', id);
      } catch (e) { console.warn('[Cyber] Delete error:', e); }
    }
  };

  /* ============================================================
     CHAT LOG STORAGE (localStorage per report)
  ============================================================ */
  function _getChatLog(id) {
    try { return localStorage.getItem('cyberlog_' + id) || ''; } catch { return ''; }
  }

  window.saveChatLog = function (id) {
    const area = document.getElementById('chatLogArea');
    if (!area) return;
    try {
      localStorage.setItem('cyberlog_' + id, area.textContent);
      _toast('💾 Saved', 'Investigation note saved.', 'success');
    } catch { _toast('⚠ Error', 'Could not save note.', 'warning'); }
  };

  /* ============================================================
     ADD REPORT MODAL
  ============================================================ */
  function _bindAddReportModal() {
    const btnOpen  = document.getElementById('btnAddReport');
    const modal    = document.getElementById('addReportModal');
    const btnClose = document.getElementById('modalClose');
    const form     = document.getElementById('addReportForm');

    btnOpen?.addEventListener('click', () => modal?.classList.add('open'));
    btnClose?.addEventListener('click', () => modal?.classList.remove('open'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const newReport = {
        id: 'local-' + Date.now(),
        user_name:   fd.get('user_name')  || 'Anonymous',
        crime_type:  fd.get('crime_type') || 'Other',
        description: fd.get('description') || '',
        evidence_url:fd.get('evidence_url') || '',
        status:      'pending',
        created_at:  new Date().toISOString(),
      };

      if (S.DB && S.DB.isReady && S.DB.isReady()) {
        try {
          const { data, error } = await S.DB.client
            .from('cyber_reports')
            .insert([{
              user_name:    newReport.user_name,
              crime_type:   newReport.crime_type,
              description:  newReport.description,
              evidence_url: newReport.evidence_url,
              status:       'pending',
            }])
            .select()
            .single();
          if (error) throw error;
          newReport.id = data.id;
        } catch (err) {
          console.warn('[Cyber] Insert error:', err);
        }
      }

      S.reports.unshift(_enrichReport(newReport));
      _applyFilters();
      modal?.classList.remove('open');
      form.reset();
      _toast('✅ Report Filed', `${newReport.user_name}'s report added successfully.`, 'success');
    });
  }

  /* ============================================================
     TOAST
  ============================================================ */
  function _toast(title, msg, type = 'info') {
    if (!$toastWrap) return;
    const icons = { success: '✅', warning: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast-item ${type}`;
    el.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${msg}</div>
      </div>
      <button class="toast-close-btn" onclick="this.closest('.toast-item').remove()">✕</button>`;
    $toastWrap.prepend(el);
    setTimeout(() => el.remove(), 5500);
  }

  window.cyberToast = _toast;

  /* ============================================================
     SIDEBAR MOBILE
  ============================================================ */
  function _initSidebar() {
    const menuBtn  = document.getElementById('mobMenuBtn');
    const overlay  = document.getElementById('mobOverlay');
    const sidebar  = document.getElementById('cyberSidebar');

    const open  = () => { sidebar?.classList.add('open');  overlay?.classList.add('open');  };
    const close = () => { sidebar?.classList.remove('open'); overlay?.classList.remove('open'); };

    menuBtn?.addEventListener('click', open);
    overlay?.addEventListener('click', close);
    sidebar?.querySelectorAll('.sb-item').forEach(item => {
      item.addEventListener('click', () => { if (window.innerWidth < 920) close(); });
    });
  }

  /* ============================================================
     HELPERS
  ============================================================ */
  function _esc(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function _fmtTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)  return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ${m%60}m ago`;
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  }

  function _fmtTimeFull(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      day:'2-digit', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
    });
  }

  function _crimeClass(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('fraud'))       return 'fraud';
    if (t.includes('blackmail'))   return 'blackmail';
    if (t.includes('harassment') || t.includes('stalk')) return 'harassment';
    if (t.includes('scam') || t.includes('phish'))       return 'scam';
    if (t.includes('leak') || t.includes('nude'))        return 'leak';
    return 'other';
  }

  function _riskIcon(risk) {
    return risk === 'high' ? '🔴' : risk === 'medium' ? '🟡' : '🟢';
  }

  function _statusIcon(status) {
    return status === 'resolved' ? '✅' : status === 'investigating' ? '🔍' : '⏳';
  }

  function _isVideoUrl(url) {
    url = (url || '').toLowerCase().split('?')[0];
    return /\.(mp4|webm|ogg|mov|avi|mkv|flv|m4v|3gp)$/i.test(url) ||
           (url.includes('blob:') && url.includes('video'));
  }

  function _isImageUrl(url) {
    url = (url || '').toLowerCase().split('?')[0];
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
  }

  function _evidenceIcon(url) {
    url = (url || '').toLowerCase();
    if (_isVideoUrl(url))                                             return '🎥';
    if (_isImageUrl(url))                                             return '🖼️';
    if (url.includes('drive.google') || url.includes('docs.google')) return '📂';
    if (url.includes('t.me') || url.includes('telegram'))            return '💬';
    if (url.includes('.pdf'))                                         return '📄';
    if (url.includes('instagram') || url.includes('facebook'))       return '📱';
    if (url.includes('whatsapp'))                                     return '💬';
    return '🔗';
  }

  function _riskReason(r) {
    const text = ((r.description || '') + ' ' + (r.crime_type || '')).toLowerCase();
    const found = [];
    for (const kw of RISK_KEYWORDS.high)   { if (text.includes(kw)) found.push(`"${kw}"`); }
    for (const kw of RISK_KEYWORDS.medium) { if (text.includes(kw)) found.push(`"${kw}"`); }

    if (r.risk === 'high') {
      return `⚠️ <strong style="color:var(--risk-high)">HIGH RISK</strong> — contains keywords: ${found.slice(0,4).join(', ')}. Immediate police intervention recommended.`;
    } else if (r.risk === 'medium') {
      return `🟡 <strong style="color:var(--risk-medium)">MEDIUM RISK</strong> — contains keywords: ${found.slice(0,4).join(', ')}. Needs prompt attention.`;
    }
    return `🟢 <strong style="color:var(--risk-low)">LOW RISK</strong> — No critical keywords detected. Standard investigation protocol applies.`;
  }

  function _loadUserFirs() {
    let localList = [];
    try {
      localList = JSON.parse(localStorage.getItem('rakshika_cyber_firs') || '[]');
    } catch (e) { console.warn('Failed to parse local cyber FIRs:', e); }

    // Convert local FIRs to cyber dashboard format
    const userReports = localList.map(fir => {
      // Risk detection
      const risk = _detectRisk({
        description: fir.description,
        crime_type: fir.incident_type,
        evidence_url: fir.evidence_urls
      });
      
      return {
        id: fir.id,
        user_name: fir.full_name,
        crime_type: fir.incident_type,
        description: fir.description,
        evidence_url: fir.evidence_urls,
        status: fir.status || 'pending',
        created_at: fir.created_at || new Date().toISOString(),
        risk: risk,
        evidenceList: (fir.evidence_urls || '')
          .split(/[|\n,]/)
          .map(s => s.trim())
          .filter(Boolean),
        _isUserFir: true
      };
    });

    // Add user reports to S.reports at the beginning
    userReports.forEach(ur => {
      const idx = S.reports.findIndex(x => x.id === ur.id);
      if (idx === -1) {
        S.reports.unshift(ur);
      }
    });
  }

  function _listenBroadcast() {
    try {
      const bc = new BroadcastChannel('rakshika_fir');
      bc.onmessage = (evt) => {
        if (evt.data?.type === 'fir_insert' && evt.data?.dept === 'cyber') {
          const fir = evt.data.row;
          const risk = _detectRisk({
            description: fir.description,
            crime_type: fir.incident_type,
            evidence_url: fir.evidence_urls
          });
          
          const ur = {
            id: fir.id,
            user_name: fir.full_name,
            crime_type: fir.incident_type,
            description: fir.description,
            evidence_url: fir.evidence_urls,
            status: fir.status || 'pending',
            created_at: fir.created_at || new Date().toISOString(),
            risk: risk,
            evidenceList: (fir.evidence_urls || '')
              .split(/[|\n,]/)
              .map(s => s.trim())
              .filter(Boolean),
            _isUserFir: true
          };

          S.reports.unshift(ur);
          _applyFilters();
          _toast('💻 New Cyber FIR!', `FIR filed by ${ur.user_name}.`, 'info');
        }
      };
    } catch(e) {}
  }

  function _evEmpty() {
    return `
      <div class="ev-head">
        <div class="ev-title">📋 Report Detail</div>
      </div>
      <div class="ev-empty">
        <span class="ev-empty-icon">📂</span>
        Select a report from the table<br>to view evidence and details.
      </div>`;
  }

  // Init evidence panel to empty state
  document.addEventListener('DOMContentLoaded', () => {
    if ($evPanel) $evPanel.innerHTML = _evEmpty();
  });

})();
