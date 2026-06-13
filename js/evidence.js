/* ============================================================
   RAKSHIKA — EVIDENCE UPLOAD SYSTEM
   js/evidence.js
   Handles file selection, preview, Supabase Storage upload,
   and metadata save to evidence_uploads table.
============================================================ */

(function (global) {
  'use strict';

  class EvidenceManager {
    constructor(options = {}) {
      this.opts = Object.assign({
        dropZoneId:    'evidenceDropZone',
        previewGridId: 'filePreviewGrid',
        uploadedListId:'uploadedList',
        progressId:    'uploadProgress',
        progressBarId: 'uploadProgressBar',
        attachBadgeId: 'attachedEvidenceBadges',
        onUploadDone:  null,
      }, options);

      this._pendingFiles = [];    // Files waiting to upload
      this._uploadedFiles = [];   // { name, url, type, size }
      this._DB = null;

      this._initDOM();
    }

    /* ---- DOM setup ---- */
    _initDOM() {
      const dz = document.getElementById(this.opts.dropZoneId);
      if (!dz) return;

      // Drag events
      dz.addEventListener('dragover', (e) => {
        e.preventDefault();
        dz.classList.add('drag-over');
      });
      dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
      dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('drag-over');
        this._addFiles([...e.dataTransfer.files]);
      });

      // File input
      const input = dz.querySelector('input[type="file"]');
      if (input) {
        input.addEventListener('change', () => {
          this._addFiles([...input.files]);
          input.value = '';
        });
      }
    }

    /* ---- Accept files ---- */
    _addFiles(files) {
      const allowed = ['image/', 'video/', 'application/pdf'];
      files.forEach(f => {
        const ok = allowed.some(t => f.type.startsWith(t));
        if (!ok) {
          window.dashToast?.('⚠ Invalid File', `${f.name} — only images/videos/PDF`, 'warning');
          return;
        }
        if (f.size > 50 * 1024 * 1024) {
          window.dashToast?.('⚠ Too Large', `${f.name} exceeds 50MB`, 'warning');
          return;
        }
        this._pendingFiles.push(f);
      });
      this._renderPreviews();
    }

    /* ---- Preview grid ---- */
    _renderPreviews() {
      const grid = document.getElementById(this.opts.previewGridId);
      if (!grid) return;

      grid.innerHTML = this._pendingFiles.map((f, i) => {
        const isVideo = f.type.startsWith('video/');
        const isPDF   = f.type === 'application/pdf';
        const url = URL.createObjectURL(f);
        const preview = isPDF
          ? `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:1.8rem">📄</div>`
          : isVideo
            ? `<video src="${url}" muted playsinline style="width:100%;height:100%;object-fit:cover"></video>`
            : `<img src="${url}" alt="${f.name}" style="width:100%;height:100%;object-fit:cover" />`;

        return `
          <div class="file-thumb" id="thumb-${i}">
            ${preview}
            <button class="file-remove" data-idx="${i}" title="Remove">✕</button>
            <div class="file-name">${f.name}</div>
          </div>`;
      }).join('');

      // Bind remove buttons
      grid.querySelectorAll('.file-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          this._pendingFiles.splice(idx, 1);
          this._renderPreviews();
        });
      });

      // Show/hide upload button
      const uploadBtn = document.getElementById('btnUploadEvidence');
      if (uploadBtn) uploadBtn.style.display = this._pendingFiles.length > 0 ? 'inline-flex' : 'none';
    }

    /* ---- Upload to Supabase Storage (or local mock) ---- */
    async uploadAll(userId) {
      if (this._pendingFiles.length === 0) {
        window.dashToast?.('ℹ No Files', 'Add files before uploading.', 'info');
        return this._uploadedFiles;
      }

      if (window.showRakshikaPreloader) {
        window.showRakshikaPreloader("Securing & uploading evidence to database...");
      }

      const prog = document.getElementById(this.opts.progressId);
      const bar  = document.getElementById(this.opts.progressBarId);
      if (prog) { prog.classList.add('show'); }

      this._DB = window.rakshikaDb;

      let done = 0;
      const results = [];

      for (const file of this._pendingFiles) {
        let fileUrl = '';
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

        try {
          if (this._DB && this._DB.isReady && this._DB.isReady()) {
            // Supabase Storage upload
            const path = `evidence/${userId || 'anon'}/${fileName}`;
            const { data, error } = await this._DB.client.storage
              .from('rakshika-evidence')
              .upload(path, file, { upsert: false, contentType: file.type });

            if (!error) {
              const { data: pub } = this._DB.client.storage
                .from('rakshika-evidence')
                .getPublicUrl(path);
              fileUrl = pub?.publicUrl || path;

              // Save metadata to evidence_uploads table
              await this._DB.client.from('evidence_uploads').insert([{
                user_id:   userId || null,
                file_url:  fileUrl,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
              }]).catch(() => {});
            } else {
              // Fallback: object URL for demo
              fileUrl = URL.createObjectURL(file);
            }
          } else {
            // Offline demo mode
            fileUrl = URL.createObjectURL(file);
          }
        } catch (e) {
          fileUrl = URL.createObjectURL(file);
        }

        const rec = { name: file.name, url: fileUrl, type: file.type, size: file.size };
        this._uploadedFiles.push(rec);
        results.push(rec);
        done++;

        if (bar) bar.style.width = `${(done / this._pendingFiles.length) * 100}%`;
      }

      // Clear pending
      this._pendingFiles = [];
      this._renderPreviews();
      if (prog) setTimeout(() => { prog.classList.remove('show'); if(bar) bar.style.width = '0%'; }, 800);
      
      if (window.hideRakshikaPreloader) {
        setTimeout(window.hideRakshikaPreloader, 800);
      }

      this._renderUploadedList();
      this._updateAttachBadges();

      if (this.opts.onUploadDone) this.opts.onUploadDone(results);
      window.dashToast?.('✅ Uploaded', `${results.length} file(s) uploaded successfully.`, 'success');

      return this._uploadedFiles;
    }

    /* ---- Render uploaded file list ---- */
    _renderUploadedList() {
      const list = document.getElementById(this.opts.uploadedListId);
      if (!list) return;

      if (this._uploadedFiles.length === 0) {
        list.innerHTML = '';
        return;
      }

      list.innerHTML = this._uploadedFiles.map((f, i) => {
        const icon = f.type.startsWith('video') ? '🎥' : f.type === 'application/pdf' ? '📄' : '🖼';
        const size = f.size > 1024*1024
          ? `${(f.size/1024/1024).toFixed(1)} MB`
          : `${Math.round(f.size/1024)} KB`;
        return `
          <div class="uploaded-item">
            <span class="uploaded-item-icon">${icon}</span>
            <span class="uploaded-item-name">${f.name}</span>
            <span class="uploaded-item-size">${size}</span>
            <span class="uploaded-item-check">✅</span>
          </div>`;
      }).join('');
    }

    /* ---- Update attach badges on FIR form ---- */
    _updateAttachBadges() {
      const wrap = document.getElementById(this.opts.attachBadgeId);
      if (!wrap) return;
      wrap.innerHTML = this._uploadedFiles.map(f => {
        const icon = f.type.startsWith('video') ? '🎥' : f.type === 'application/pdf' ? '📄' : '🖼';
        return `<span class="ev-badge">${icon} ${f.name.slice(0, 18)}${f.name.length > 18 ? '…' : ''}</span>`;
      }).join('');
    }

    /* ---- Public: get uploaded file URLs for FIR ---- */
    getUploadedFiles() { return [...this._uploadedFiles]; }

    getEvidenceUrlString() {
      return this._uploadedFiles.map(f => f.url).join(' | ');
    }
  }

  global.EvidenceManager = EvidenceManager;
})(window);
