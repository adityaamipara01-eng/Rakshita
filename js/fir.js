/* ============================================================
   RAKSHIKA — FIR (First Information Report) SYSTEM
   js/fir.js
   Handles: form, validation, department routing modal,
   saving to police_fir or cyber_fir in Supabase,
   and realtime broadcasting.
============================================================ */

(function (global) {
  'use strict';

  /* ============================================================
     FIR MANAGER
  ============================================================ */
  class FIRManager {
    constructor(options = {}) {
      this.opts = Object.assign({
        formId:           'firForm',
        deptModalId:      'deptModal',
        evidenceManager:  null,  // EvidenceManager instance
        onSubmitted:      null,
      }, options);

      this._pendingFIR = null;   // holds form data while routing modal is open
      this._DB = null;
      this._currentUser = null;

      this._bind();
    }

    setUser(user) { this._currentUser = user; }

    /* ---- Bind form events ---- */
    _bind() {
      const form = document.getElementById(this.opts.formId);
      if (!form) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!this._validate(form)) return;

        const fd = new FormData(form);
        const evidenceUrls = this.opts.evidenceManager
          ? this.opts.evidenceManager.getEvidenceUrlString()
          : '';

        this._pendingFIR = {
          full_name:     fd.get('full_name') || 'Anonymous',
          incident_type: fd.get('incident_type') || 'Other',
          description:   fd.get('description')  || '',
          location:      fd.get('location')      || '',
          incident_time: fd.get('incident_time') || new Date().toISOString(),
          evidence_urls: evidenceUrls,
          status:        'pending',
          created_at:    new Date().toISOString(),
          user_id:       this._currentUser?.id || null,
        };

        // Show department routing modal
        this._openDeptModal();
      });

      // Department choice buttons
      document.getElementById('btnPolice')?.addEventListener('click', () => this._submit('police'));
      document.getElementById('btnCyber')?.addEventListener('click',  () => this._submit('cyber'));

      // Close modal
      document.getElementById('deptModalClose')?.addEventListener('click', () => this._closeDeptModal());
      document.getElementById(this.opts.deptModalId)?.addEventListener('click', (e) => {
        if (e.target.id === this.opts.deptModalId) this._closeDeptModal();
      });
    }

    /* ---- Validation ---- */
    _validate(form) {
      const required = ['full_name', 'incident_type', 'description', 'location'];
      let ok = true;
      required.forEach(name => {
        const el = form.elements[name];
        if (!el || !el.value.trim()) {
          el?.classList.add('error-field');
          ok = false;
        } else {
          el?.classList.remove('error-field');
        }
      });

      if (!ok) {
        window.dashToast?.('⚠ Incomplete FIR', 'Please fill in all required fields.', 'warning');
      }
      return ok;
    }

    /* ---- Modal ---- */
    _openDeptModal() {
      const modal = document.getElementById(this.opts.deptModalId);
      if (modal) modal.classList.add('open');
    }

    _closeDeptModal() {
      const modal = document.getElementById(this.opts.deptModalId);
      if (modal) modal.classList.remove('open');
    }

    /* ---- Submit to correct table ---- */
    async _submit(dept) {
      this._closeDeptModal();
      if (!this._pendingFIR) return;

      if (window.showRakshikaPreloader) {
        window.showRakshikaPreloader(`Routing FIR securely to ${dept === 'cyber' ? 'Cyber Crime Cell' : 'Police Station'}...`);
      }

      const tableName = dept === 'cyber' ? 'cyber_fir' : 'police_fir';
      const fir = { ...this._pendingFIR, department: dept };

      this._DB = window.rakshikaDb;

      let savedId = 'local-' + Date.now();

      if (this._DB && this._DB.isReady && this._DB.isReady()) {
        try {
          const { data, error } = await this._DB.client
            .from(tableName)
            .insert([fir])
            .select()
            .single();
          if (error) throw error;
          savedId = data?.id || savedId;
          window.dashToast?.('🗂 FIR Filed', `Your complaint was sent to the ${dept === 'cyber' ? 'Cyber Crime' : 'Police'} Department.`, 'success');
        } catch (e) {
          console.warn('[FIR] Supabase error:', e);
          window.dashToast?.('🗂 FIR Saved (Local)', 'Demo mode: FIR saved locally.', 'info');
        }
      } else {
        window.dashToast?.('🗂 FIR Saved (Demo)', `Routed to ${dept === 'cyber' ? 'Cyber Crime' : 'Police'} Department.`, 'success');
      }

      // Save locally for Case Tracking and persist demo FIRs
      const localKey = dept === 'cyber' ? 'rakshika_cyber_firs' : 'rakshika_police_firs';
      let localList = [];
      try {
        localList = JSON.parse(localStorage.getItem(localKey) || '[]');
      } catch (e) {}
      
      const enrichedFir = { 
        ...fir, 
        id: savedId, 
        status: 'pending', 
        created_at: new Date().toISOString() 
      };
      
      localList.unshift(enrichedFir);
      localStorage.setItem(localKey, JSON.stringify(localList));

      // Broadcast via BroadcastChannel for same-browser demo
      try {
        const bc = new BroadcastChannel('rakshika_fir');
        bc.postMessage({ type: 'fir_insert', dept, row: enrichedFir });
        bc.close();
      } catch (e) {}

      // Trigger audio alert
      try {
        const ac = new AudioContext();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.frequency.value = 440;
        gain.gain.value = 0.12;
        osc.start();
        setTimeout(() => { gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5); osc.stop(ac.currentTime + 0.5); }, 200);
      } catch {}

      // Clear form
      document.getElementById(this.opts.formId)?.reset();
      this._pendingFIR = null;

      if (this.opts.onSubmitted) this.opts.onSubmitted({ dept, fir: enrichedFir });

      if (window.hideRakshikaPreloader) {
        setTimeout(window.hideRakshikaPreloader, 600);
      }

      // Show confirmation card
      this._showConfirmation(dept, enrichedFir);
    }

    /* ---- Confirmation ---- */
    _showConfirmation(dept, fir) {
      const el = document.getElementById('firConfirmation');
      if (!el) return;
      const icon = dept === 'cyber' ? '💻' : '👮';
      const deptName = dept === 'cyber' ? 'Cyber Crime Department' : 'Police Department';
      const color = dept === 'cyber' ? '#8b5cf6' : '#3b82f6';

      el.innerHTML = `
        <div style="background:var(--bg-card-2);border:1px solid ${color}33;border-left:4px solid ${color};
          border-radius:var(--r-lg);padding:18px;display:flex;gap:14px;align-items:flex-start;animation:fadeInUp .4s ease-out">
          <span style="font-size:1.8rem">${icon}</span>
          <div>
            <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:.95rem;margin-bottom:4px">
              FIR Successfully Submitted
            </div>
            <div style="font-size:.8rem;color:var(--text-2);margin-bottom:8px">
              Your complaint has been sent to the <strong style="color:${color}">${deptName}</strong>.
              Authorities will review your case shortly.
            </div>
            <div style="font-family:var(--mono);font-size:.72rem;color:var(--text-3)">
              FIR ID: <strong style="color:var(--text-2)">${fir.id || 'Filed'}</strong> ·
              Type: ${fir.incident_type} ·
              ${new Date().toLocaleString('en-IN')}
            </div>
          </div>
        </div>`;
      el.style.display = 'block';
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { el.style.display = 'none'; }, 12000);
    }
  }

  global.FIRManager = FIRManager;
})(window);
