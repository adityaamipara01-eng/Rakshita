/**
 * Rakshika Admin Command Center JS
 * Controls layout state, role access, and interactive case workflow.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Session Authorization check
  let currentUser = null;
  let currentRole = 'superadmin';

  try {
    const session = sessionStorage.getItem('rakshika_session');
    if (session) {
      currentUser = JSON.parse(session);
      currentRole = sessionStorage.getItem('rak_role') || currentUser.role || 'superadmin';
    } else {
      // Force redirect to login page if no session
      window.location.href = 'admin_login.html';
      return;
    }
  } catch (e) {
    console.error("Session fetch error:", e);
    window.location.href = 'admin_login.html';
    return;
  }

  // Update profile details on load
  updateProfileUI();

  // Initialize role selector element on load
  const switcher = document.getElementById('adminRoleSwitcher');
  if (switcher) {
    switcher.value = currentRole;
  }

  // 2. Initial State Data Seeding
  let cases = [
    { id: 'CAS-3021', name: 'Priya Sharma', type: 'Emergency SOS', time: '10 mins ago', evidence: 'GPS Log & Audio', threat: 'CRITICAL', status: 'Pending' },
    { id: 'CAS-4109', name: 'Anjali Verma', type: 'Cyber Stalking', time: '1 hour ago', evidence: 'Screenshot Logs', threat: 'HIGH', status: 'Pending' },
    { id: 'CAS-2983', name: 'Sneha Patel', type: 'Blackmail', time: '2 hours ago', evidence: 'Chat Export PDF', threat: 'MEDIUM', status: 'Pending' },
    { id: 'CAS-8821', name: 'Ritu Sen', type: 'Fraud', time: 'Yesterday', evidence: 'Screenshot Logs', threat: 'LOW', status: 'Verified' },
    { id: 'CAS-1563', name: 'Megha Rao', type: 'Phishing', time: '2 days ago', evidence: 'Suspicious URL Link', threat: 'HIGH', status: 'Verified' }
  ];

  let officers = [
    { id: 'OFF-101', name: 'Inspector Rawat', dept: 'Police Control Room', rank: 'Senior PCR Dispatcher', active: 2, status: 'Available', phone: '+91 98765 20101' },
    { id: 'OFF-102', name: 'Sub-Inspector Negi', dept: 'Police Control Room', rank: 'Patrol Commander', active: 3, status: 'Busy', phone: '+91 98765 20102' },
    { id: 'OFF-103', name: 'Officer Kiran', dept: 'Police Control Room', rank: 'Emergency Dispatcher', active: 0, status: 'Available', phone: '+91 98765 20103' },
    { id: 'OFF-201', name: 'Agent Verma', dept: 'Cyber Crime Branch', rank: 'Digital Forensics Expert', active: 1, status: 'Available', phone: '+91 98765 20201' },
    { id: 'OFF-202', name: 'Agent Shreya', dept: 'Cyber Crime Branch', rank: 'Threat Analyst', active: 4, status: 'Busy', phone: '+91 98765 20202' },
    { id: 'OFF-203', name: 'Cyber Spec Roy', dept: 'Cyber Crime Branch', rank: 'OSINT Investigator', active: 0, status: 'Available', phone: '+91 98765 20203' }
  ];

  let investigations = [
    { caseId: 'CAS-8821', officer: 'Agent Verma', dept: 'Cyber Crime Branch', time: '10 Jun 2026, 12:30', status: 'Evidence Review', deadline: '24 hours' },
    { caseId: 'CAS-1563', officer: 'Agent Shreya', dept: 'Cyber Crime Branch', time: '11 Jun 2026, 16:45', status: 'Investigating', deadline: '48 hours' }
  ];

  let policeRescues = [
    { id: 'SOS-3021', name: 'Priya Sharma', coords: '28.6139, 77.2090', type: 'Panic SOS', unit: 'PCR Car-32', response: 'En Route (Est. 3 mins)' }
  ];

  let cyberReports = [
    { id: 'CYB-4109', category: 'Cyber Stalking', score: '82%', target: 'Anjali Verma', link: 'instagram.com/fake_anjali1', status: 'Under Review' },
    { id: 'CYB-2983', category: 'Blackmail/Extortion', score: '65%', target: 'Sneha Patel', link: 'drive.google.com/private_ex', status: 'Under Review' }
  ];

  let evidenceVault = [
    { id: 'EVI-8821', type: 'Screenshot', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', time: '10 Jun 2026', custody: 'Officer Rawat -> Vault-01', status: 'Secure' },
    { id: 'EVI-1563', type: 'URL Link', hash: '8f43818e69e0618ff7e41e3a1f9e2b1af75b9f71c4c1a84f3959ef177651a5c6', time: '11 Jun 2026', custody: 'Agent Verma -> Vault-03', status: 'Secure' }
  ];

  let notifications = [
    { id: 1, type: 'danger', title: '🚨 SOS ALERT TRIGGERED', msg: 'Priya Sharma triggered Panic SOS in Delhi West.', time: 'Just now', unread: true },
    { id: 2, type: 'info', title: '📂 Evidence Uploaded', msg: 'New screenshot logs submitted for Case CAS-2983.', time: '15 mins ago', unread: true }
  ];

  let pendingRoutingCaseId = null;
  let selectedRoutingDept = null;
  let pendingOfficerCaseId = null;
  let selectedDeptForOfficer = null;

  // 3. Tab Navigation Logic
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const activeTabId = item.getAttribute('data-tab');
      switchTab(activeTabId);
    });
  });

  function switchTab(tabId) {
    document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));

    const tabTrigger = document.querySelector(`.admin-nav-item[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(tabId);

    if (tabTrigger) tabTrigger.classList.add('active');
    if (tabContent) tabContent.classList.add('active');

    // Update Titles
    const titleEl = document.getElementById('viewTitle');
    const subtitleEl = document.getElementById('viewSubtitle');

    if (tabId === 'tabVerification') {
      titleEl.textContent = 'Case Verification';
      subtitleEl.textContent = 'Verify user data, check evidence, and route complaints.';
    } else if (tabId === 'tabOfficers') {
      titleEl.textContent = 'Officer Directory';
      subtitleEl.textContent = 'Manage responding patrol officers and cyber agents.';
    } else if (tabId === 'tabInvestigations') {
      titleEl.textContent = 'Investigations Log';
      subtitleEl.textContent = 'Track the progress of assigned safety and cyber casework.';
    } else if (tabId === 'tabPoliceMonitor') {
      titleEl.textContent = 'Police PCR Monitor';
      subtitleEl.textContent = 'Real-time monitoring of local units and physical emergencies.';
    } else if (tabId === 'tabCyberMonitor') {
      titleEl.textContent = 'Cyber Crime Monitor';
      subtitleEl.textContent = 'Identify phishing loops, malicious links, and extortion reports.';
    } else if (tabId === 'tabEvidence') {
      titleEl.textContent = 'Evidence Vault';
      subtitleEl.textContent = 'Review secure cryptographic chains of custody for local files.';
    } else if (tabId === 'tabAnalytics') {
      titleEl.textContent = 'AI Threat Analytics';
      subtitleEl.textContent = 'Inspect predictive high risk hotspots and response latency graphs.';
    }
  }

  // 4. Role-Based Access Control Filtering
  window.simulateRoleChange = function(role) {
    currentRole = role;
    sessionStorage.setItem('rak_role', role);
    updateProfileUI();
    applyRBAC();
  };

  function updateProfileUI() {
    const roleLabels = {
      superadmin: 'Super Admin',
      policeadmin: 'Police PCR Admin',
      cyberadmin: 'Cyber Crime Admin'
    };

    const names = {
      superadmin: currentUser ? currentUser.name : 'Admin Aditya',
      policeadmin: 'PCR Officer Aditya',
      cyberadmin: 'Cyber Agent Aditya'
    };

    document.getElementById('admName').textContent = names[currentRole];
    document.getElementById('admRoleLabel').textContent = roleLabels[currentRole];
    document.getElementById('currentRoleBadge').textContent = roleLabels[currentRole];
    document.getElementById('admAvatar').textContent = names[currentRole].split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  function applyRBAC() {
    const secPoliceTitle = document.getElementById('secPoliceTitle');
    const secPoliceItem = document.getElementById('secPoliceItem');
    const secCyberTitle = document.getElementById('secCyberTitle');
    const secCyberItem = document.getElementById('secCyberItem');

    // Reset visibility
    secPoliceTitle.style.display = 'block';
    secPoliceItem.style.display = 'flex';
    secCyberTitle.style.display = 'block';
    secCyberItem.style.display = 'flex';

    if (currentRole === 'policeadmin') {
      // Hide Cyber monitor
      secCyberTitle.style.display = 'none';
      secCyberItem.style.display = 'none';
      // If active tab was cyber, switch to verification
      if (document.getElementById('tabCyberMonitor').classList.contains('active')) {
        switchTab('tabVerification');
      }
    } else if (currentRole === 'cyberadmin') {
      // Hide Police monitor
      secPoliceTitle.style.display = 'none';
      secPoliceItem.style.display = 'none';
      // If active tab was police, switch to verification
      if (document.getElementById('tabPoliceMonitor').classList.contains('active')) {
        switchTab('tabVerification');
      }
    }
    
    // Refresh tables to dynamically filter cases or assignments by role
    renderCaseTable();
    renderInvestigationTable();
  }

  // 5. Data Render Utilities
  function renderCaseTable() {
    const tbody = document.getElementById('caseVerificationTableBody');
    tbody.innerHTML = '';

    // Filter cases based on role
    let filteredCases = cases;
    if (currentRole === 'policeadmin') {
      filteredCases = cases.filter(c => c.type === 'Emergency SOS');
    } else if (currentRole === 'cyberadmin') {
      filteredCases = cases.filter(c => c.type !== 'Emergency SOS');
    }

    document.getElementById('pendingCount').textContent = filteredCases.filter(c => c.status === 'Pending').length;

    if (filteredCases.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No cases found in this pipeline.</td></tr>`;
      return;
    }

    filteredCases.forEach(c => {
      let badgeClass = 'badge-pending';
      if (c.status === 'Under Review') badgeClass = 'badge-review';
      else if (c.status === 'Verified') badgeClass = 'badge-verified';
      else if (c.status === 'Rejected') badgeClass = 'badge-rejected';
      else if (c.status === 'Escalated') badgeClass = 'badge-escalated';

      let actionsHtml = '';
      if (c.status === 'Pending' || c.status === 'Under Review') {
        actionsHtml = `
          <button class="admin-btn admin-btn-primary" onclick="openDeptRouteModal('${c.id}')">Verify</button>
          <button class="admin-btn admin-btn-outline" onclick="changeCaseStatus('${c.id}', 'Escalated')">Escalate</button>
          <button class="admin-btn admin-btn-danger" onclick="changeCaseStatus('${c.id}', 'Rejected')">Reject</button>
        `;
      } else {
        actionsHtml = `<span style="font-size:0.75rem; color:var(--text-muted);">No actions remaining</span>`;
      }

      const threatColor = c.threat === 'CRITICAL' || c.threat === 'HIGH' ? 'var(--primary)' : 'var(--text-secondary)';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:'Share Tech Mono'; font-weight:bold; color:var(--primary-indigo);">${c.id}</td>
        <td><strong>${c.name}</strong></td>
        <td>${c.type}</td>
        <td>${c.time}</td>
        <td><i data-lucide="file" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> ${c.evidence}</td>
        <td style="font-weight:bold; color:${threatColor}">${c.threat}</td>
        <td><span class="admin-badge ${badgeClass}">${c.status}</span></td>
        <td style="text-align:right; display:flex; gap:6px; justify-content:flex-end;">${actionsHtml}</td>
      `;
      tbody.appendChild(tr);
    });

    lucide.createIcons();
  }

  function renderOfficersGrid() {
    const grid = document.getElementById('officersGrid');
    grid.innerHTML = '';

    // Filter officers by role
    let filteredOfficers = officers;
    if (currentRole === 'policeadmin') {
      filteredOfficers = officers.filter(o => o.dept === 'Police Control Room');
    } else if (currentRole === 'cyberadmin') {
      filteredOfficers = officers.filter(o => o.dept === 'Cyber Crime Branch');
    }

    filteredOfficers.forEach(o => {
      let statusBadge = 'badge-available';
      if (o.status === 'Busy') statusBadge = 'badge-busy';
      else if (o.status === 'Offline') statusBadge = 'badge-offline';

      const card = document.createElement('div');
      card.className = 'officer-card';
      card.innerHTML = `
        <div class="officer-card-header">
          <div class="officer-info">
            <h4>${o.name}</h4>
            <span>${o.rank}</span>
          </div>
          <div class="officer-badge-container">
            <span class="admin-badge ${statusBadge}">${o.status}</span>
          </div>
        </div>
        <div class="officer-details">
          <div>
            <div class="detail-label">Department</div>
            <div class="detail-val" style="font-size:0.7rem;">${o.dept}</div>
          </div>
          <div>
            <div class="detail-label">Active Cases</div>
            <div class="detail-val">${o.active}</div>
          </div>
          <div>
            <div class="detail-label">Contact</div>
            <div class="detail-val" style="font-family:'Share Tech Mono';">${o.phone}</div>
          </div>
          <div>
            <div class="detail-label">ID</div>
            <div class="detail-val" style="font-family:'Share Tech Mono';">${o.id}</div>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="admin-btn admin-btn-primary w-full" style="justify-content:center;" onclick="triggerOfficerAssignment('${o.name}', '${o.dept}')" ${o.status === 'Offline' ? 'disabled' : ''}>
            <i data-lucide="link"></i> Assign Case
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
    lucide.createIcons();
  }

  function renderInvestigationTable() {
    const tbody = document.getElementById('investigationTableBody');
    tbody.innerHTML = '';

    let filteredInvs = investigations;
    if (currentRole === 'policeadmin') {
      filteredInvs = investigations.filter(i => i.dept === 'Police Control Room');
    } else if (currentRole === 'cyberadmin') {
      filteredInvs = investigations.filter(i => i.dept === 'Cyber Crime Branch');
    }

    if (filteredInvs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No active investigations currently tracked.</td></tr>`;
      return;
    }

    filteredInvs.forEach(i => {
      let progressVal = 20;
      let badgeClass = 'badge-pending';
      
      if (i.status === 'Assigned') { progressVal = 10; badgeClass = 'badge-review'; }
      else if (i.status === 'Evidence Review') { progressVal = 30; badgeClass = 'badge-review'; }
      else if (i.status === 'Investigating') { progressVal = 60; badgeClass = 'badge-review'; }
      else if (i.status === 'FIR Drafted') { progressVal = 80; badgeClass = 'badge-escalated'; }
      else if (i.status === 'Action Taken') { progressVal = 95; badgeClass = 'badge-verified'; }
      else if (i.status === 'Closed') { progressVal = 100; badgeClass = 'badge-verified'; }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:'Share Tech Mono'; font-weight:bold; color:var(--primary-indigo);">${i.caseId}</td>
        <td><strong>${i.officer}</strong></td>
        <td>${i.dept}</td>
        <td>${i.time}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="admin-badge ${badgeClass}" style="min-width:110px; text-align:center;">${i.status}</span>
            <div style="flex:1; width:80px; height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
              <div style="width:${progressVal}%; height:100%; background:var(--primary-indigo);"></div>
            </div>
          </div>
        </td>
        <td style="font-family:'Share Tech Mono';">${i.deadline}</td>
        <td>
          <select class="form-input" style="font-size:0.75rem; padding:4px 8px; width:130px;" onchange="updateInvestigationStatus('${i.caseId}', this.value)">
            <option value="Assigned" ${i.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
            <option value="Evidence Review" ${i.status === 'Evidence Review' ? 'selected' : ''}>Evidence Review</option>
            <option value="Investigating" ${i.status === 'Investigating' ? 'selected' : ''}>Investigating</option>
            <option value="FIR Drafted" ${i.status === 'FIR Drafted' ? 'selected' : ''}>FIR Drafted</option>
            <option value="Action Taken" ${i.status === 'Action Taken' ? 'selected' : ''}>Action Taken</option>
            <option value="Closed" ${i.status === 'Closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderPoliceRescueTable() {
    const tbody = document.getElementById('policeActiveRescueBody');
    tbody.innerHTML = '';

    policeRescues.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:'Share Tech Mono'; font-weight:bold; color:var(--primary);">${r.id}</td>
        <td><strong>${r.name}</strong></td>
        <td style="font-family:'Share Tech Mono';">${r.coords}</td>
        <td><span class="admin-badge badge-rejected">${r.type}</span></td>
        <td><strong>${r.unit}</strong></td>
        <td style="color:var(--warning); font-weight:bold;">${r.response}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderCyberIntelTable() {
    const tbody = document.getElementById('cyberReportFeedBody');
    tbody.innerHTML = '';

    cyberReports.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:'Share Tech Mono'; font-weight:bold; color:var(--primary-indigo);">${r.id}</td>
        <td>${r.category}</td>
        <td style="color:var(--primary-indigo); font-weight:bold; font-family:'Share Tech Mono';">${r.score}</td>
        <td><strong>${r.target}</strong></td>
        <td><a href="#" style="color:var(--info); font-size:0.75rem;">${r.link}</a></td>
        <td><span class="admin-badge badge-review">${r.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderEvidenceVaultTable() {
    const tbody = document.getElementById('evidenceVaultBody');
    tbody.innerHTML = '';

    evidenceVault.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:'Share Tech Mono'; font-weight:bold; color:var(--primary-indigo);">${e.id}</td>
        <td><i data-lucide="${e.type === 'Screenshot' ? 'image' : 'link'}" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;"></i>${e.type}</td>
        <td style="font-family:'Share Tech Mono'; font-size:0.7rem; color:var(--text-secondary); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.hash}</td>
        <td>${e.time}</td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${e.custody}</td>
        <td><span class="admin-badge badge-verified"><i data-lucide="lock" style="width:10px;height:10px;margin-right:4px;"></i>${e.status}</span></td>
      `;
      tbody.appendChild(tr);
    });

    lucide.createIcons();
  }

  function renderNotificationFeed() {
    const feed = document.getElementById('notificationFeed');
    feed.innerHTML = '';

    if (notifications.length === 0) {
      feed.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.75rem;">No new notifications.</div>`;
      return;
    }

    notifications.forEach(n => {
      const el = document.createElement('div');
      el.className = 'notif-item' + (n.unread ? ' unread' : '');
      el.innerHTML = `
        <div class="notif-item-icon ${n.type}">
          <i data-lucide="${n.type === 'danger' ? 'alert-triangle' : (n.type === 'success' ? 'check-circle' : 'info')}" style="width:14px;height:14px;"></i>
        </div>
        <div class="notif-item-content">
          <strong style="color:white; font-size:0.75rem;">${n.title}</strong>
          <span style="color:var(--text-secondary); font-size:0.7rem;">${n.msg}</span>
          <span class="notif-time">${n.time}</span>
        </div>
      `;
      feed.appendChild(el);
    });

    lucide.createIcons();
  }

  // 6. Action Triggers & Workflow Logic
  window.changeCaseStatus = function(caseId, status) {
    const c = cases.find(x => x.id === caseId);
    if (c) {
      c.status = status;
      renderCaseTable();
      pushNotification('info', `Case status updated`, `Case ${caseId} status changed to ${status}.`);
    }
  };

  // Department Modal Router
  window.openDeptRouteModal = function(caseId) {
    pendingRoutingCaseId = caseId;
    document.getElementById('modalCaseId').textContent = caseId;
    
    // Clear selection style
    document.getElementById('modalOptionPolice').style.borderColor = 'var(--border-admin)';
    document.getElementById('modalOptionCyber').style.borderColor = 'var(--border-admin)';
    document.getElementById('radioDeptPolice').checked = false;
    document.getElementById('radioDeptCyber').checked = false;
    selectedRoutingDept = null;

    document.getElementById('assignmentModal').style.display = 'flex';
  };

  window.closeAssignmentModal = function() {
    document.getElementById('assignmentModal').style.display = 'none';
  };

  window.selectModalDept = function(dept) {
    selectedRoutingDept = dept;
    const isPolice = (dept === 'police');
    
    document.getElementById('modalOptionPolice').style.borderColor = isPolice ? 'var(--primary)' : 'var(--border-admin)';
    document.getElementById('modalOptionCyber').style.borderColor = !isPolice ? 'var(--primary-indigo)' : 'var(--border-admin)';
    
    document.getElementById('radioDeptPolice').checked = isPolice;
    document.getElementById('radioDeptCyber').checked = !isPolice;
  };

  window.confirmDeptRouting = function() {
    if (!selectedRoutingDept) {
      alert("Please select a department to route this case!");
      return;
    }

    const c = cases.find(x => x.id === pendingRoutingCaseId);
    if (c) {
      c.status = 'Under Review';
      
      const deptName = selectedRoutingDept === 'police' ? 'Police Control Room' : 'Cyber Crime Branch';
      pushNotification('info', `Case Routed`, `Case ${pendingRoutingCaseId} routed to ${deptName}.`);
      
      // Close Routing Modal
      closeAssignmentModal();
      
      // Refresh Verification Table
      renderCaseTable();

      // Launch Officer Assignment Modal automatically
      setTimeout(() => {
        openOfficerAssignModal(pendingRoutingCaseId, selectedRoutingDept);
      }, 300);
    }
  };

  // Officer Assignment Modal
  window.openOfficerAssignModal = function(caseId, dept) {
    pendingOfficerCaseId = caseId;
    selectedDeptForOfficer = dept;
    document.getElementById('assignModalCaseId').textContent = caseId;

    const selectContainer = document.getElementById('availableOfficersSelectBody');
    selectContainer.innerHTML = '';

    const deptName = dept === 'police' ? 'Police Control Room' : 'Cyber Crime Branch';
    const deptOfficers = officers.filter(o => o.dept === deptName && o.status !== 'Offline');

    if (deptOfficers.length === 0) {
      selectContainer.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted);">No officers available in ${deptName}.</p>`;
      return;
    }

    deptOfficers.forEach(o => {
      const oDiv = document.createElement('div');
      oDiv.style = "display:flex; justify-content:space-between; align-items:center; background:rgba(8,11,17,0.4); border:1px solid var(--border-admin); padding:10px 14px; border-radius:var(--radius-sm); cursor:pointer; margin-bottom:6px;";
      oDiv.onclick = () => {
        const rad = document.getElementById(`radOfficer-${o.id}`);
        if (rad) rad.checked = true;
      };
      oDiv.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:2px;">
          <strong style="font-size:0.85rem; color:white;">${o.name}</strong>
          <span style="font-size:0.7rem; color:var(--text-muted);">${o.rank} — (${o.active} active cases)</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="admin-badge ${o.status === 'Available' ? 'badge-verified' : 'badge-pending'}" style="font-size:0.6rem;">${o.status}</span>
          <input type="radio" name="officerAssignRadio" id="radOfficer-${o.id}" value="${o.name}" style="cursor:pointer;">
        </div>
      `;
      selectContainer.appendChild(oDiv);
    });

    document.getElementById('officerAssignModal').style.display = 'flex';
  };

  window.closeOfficerAssignModal = function() {
    document.getElementById('officerAssignModal').style.display = 'none';
  };

  window.confirmOfficerAssignment = function() {
    const radios = document.getElementsByName('officerAssignRadio');
    let selectedOfficer = null;
    for (let i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        selectedOfficer = radios[i].value;
        break;
      }
    }

    if (!selectedOfficer) {
      alert("Please select an officer to assign!");
      return;
    }

    // Update Case Status to Verified
    const c = cases.find(x => x.id === pendingOfficerCaseId);
    if (c) {
      c.status = 'Verified';
    }

    // Add to Active Investigations
    const deptName = selectedDeptForOfficer === 'police' ? 'Police Control Room' : 'Cyber Crime Branch';
    
    investigations.unshift({
      caseId: pendingOfficerCaseId,
      officer: selectedOfficer,
      dept: deptName,
      time: new Date().toLocaleString([], {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}),
      status: 'Assigned',
      deadline: '24 hours'
    });

    // Increment Officer's Active Cases count
    const o = officers.find(x => x.name === selectedOfficer);
    if (o) {
      o.active++;
      o.status = 'Busy';
    }

    // Seed Evidence Vault entry if needed
    if (!evidenceVault.find(x => x.id === 'EVI-' + pendingOfficerCaseId.split('-')[1])) {
      evidenceVault.unshift({
        id: 'EVI-' + pendingOfficerCaseId.split('-')[1],
        type: c && c.evidence ? c.evidence.split(' ')[0] : 'Log',
        hash: Array(64).fill(0).map(() => Math.floor(Math.random()*16).toString(16)).join(''),
        time: new Date().toLocaleDateString([], {day:'2-digit', month:'short', year:'numeric'}),
        custody: `${selectedOfficer} -> Vault-Local`,
        status: 'Secure'
      });
    }

    // Add notification alerts
    pushNotification('success', 'Case Assigned Successfully', `${selectedOfficer} assigned to investigate Case ${pendingOfficerCaseId}.`);

    // Close Modal
    closeOfficerAssignModal();

    // Rerender all components
    renderCaseTable();
    renderOfficersGrid();
    renderInvestigationTable();
    renderEvidenceVaultTable();
  };

  window.updateInvestigationStatus = function(caseId, status) {
    const inv = investigations.find(x => x.caseId === caseId);
    if (inv) {
      inv.status = status;
      pushNotification('info', 'Investigation Updated', `Case ${caseId} status updated to: ${status}.`);
      
      // If status is closed, free the officer
      if (status === 'Closed') {
        const o = officers.find(x => x.name === inv.officer);
        if (o) {
          o.active = Math.max(0, o.active - 1);
          o.status = o.active === 0 ? 'Available' : 'Busy';
        }
        renderOfficersGrid();
      }
      
      renderInvestigationTable();
    }
  };

  // URL Scanner Simulator
  window.scanSuspiciousLink = function() {
    const input = document.getElementById('suspiciousUrlInput');
    const resultBox = document.getElementById('scanResultBox');

    if (!input || !input.value.trim()) {
      alert("Please paste a link or domain to scan!");
      return;
    }

    const domain = input.value.trim();
    resultBox.style.display = 'block';
    resultBox.innerHTML = `<span style="color:var(--text-muted);"><i data-lucide="loader" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:6px;animation:spin 1s linear infinite;"></i> Querying threat directories...</span>`;
    lucide.createIcons();

    setTimeout(() => {
      let isRisk = domain.includes('verify') || domain.includes('login') || domain.includes('gift') || domain.includes('secure');
      if (isRisk) {
        resultBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#f87171; font-weight:bold;"><i data-lucide="shield-x" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;"></i> High Risk URL Detected</span>
            <span style="font-family:'Share Tech Mono'; color:#f87171; font-weight:bold;">Threat Score: 89/100</span>
          </div>
          <p style="margin-top:6px; color:var(--text-secondary); line-height:1.4;">Domain matches phishing layouts. SSL certificate issuer is unregistered. Spoofed login vectors identified targeting Civilian portals.</p>
        `;
      } else {
        resultBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#34d399; font-weight:bold;"><i data-lucide="shield-check" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;"></i> Clean Domain</span>
            <span style="font-family:'Share Tech Mono'; color:#34d399; font-weight:bold;">Threat Score: 12/100</span>
          </div>
          <p style="margin-top:6px; color:var(--text-secondary); line-height:1.4;">No malicious patterns discovered. SSL certified, legitimate registrar. Domain safe for civilian access.</p>
        `;
      }
      lucide.createIcons();
    }, 1500);
  };

  // Notification Feed Helpers
  function pushNotification(type, title, msg) {
    notifications.unshift({
      id: Date.now(),
      type: type,
      title: title,
      msg: msg,
      time: 'Just now',
      unread: true
    });
    renderNotificationFeed();
  }

  window.clearAllNotifications = function() {
    notifications = [];
    renderNotificationFeed();
  };

  // Logout Handler
  window.handleAdminLogout = function() {
    sessionStorage.removeItem('rakshika_session');
    sessionStorage.removeItem('rak_role');
    window.location.href = 'admin_login.html';
  };

  // 7. Initial Renders & Triggers
  applyRBAC();
  renderCaseTable();
  renderOfficersGrid();
  renderInvestigationTable();
  renderPoliceRescueTable();
  renderCyberIntelTable();
  renderEvidenceVaultTable();
  renderNotificationFeed();

  // 8. Real-time simulation integration hook
  // If in mock mode, when a user triggers SOS, the admin notification center will slide in!
  try {
    const safetyBc = window.safetyBc || new BroadcastChannel('rakshika_safety_check');
    safetyBc.onmessage = (e) => {
      if (e.data.type === 'REPLY') {
        const text = e.data.message || 'No custom details';
        pushNotification(
          e.data.status === 'safe' ? 'success' : 'danger',
          e.data.status === 'safe' ? '🛡️ Safety Reply Received' : '🚨 EMERGENCY HELP REQUESTED',
          `Priya Sharma replied: "${text}"`,
          'Just now'
        );
      }
    };
  } catch(err) {
    console.warn("Admin BroadcastChannel init fallback:", err);
  }
});
