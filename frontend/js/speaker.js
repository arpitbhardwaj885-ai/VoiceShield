/**
 * VoiceShield - Speaker Biometric Registry Controller
 * Handles voiceprint enrollment, reference audio ingestion, vector embedding preview, and profile management.
 * Relies on: js/config.js, js/utils.js, js/api.js, js/auth.js
 */

const Speaker = {
  profiles: [],
  stagedAudioFile: null,

  // DOM Elements cache
  elements: {
    speakersGrid: null,
    enrolledCount: null,
    enrollModal: null,
    enrollForm: null,
    speakerNameInput: null,
    referenceAudioInput: null,
    enrollDropzone: null,
    referenceFileLabel: null,
    btnSubmitEnroll: null,
    btnSubmitEnrollText: null,
    logoutBtn: null
  },

  /**
   * Initializes the speaker management workspace.
   */
  async init() {
    this.cacheElements();
    this.bindEvents();
    await this.loadProfiles();
  },

  /**
   * Cache DOM nodes.
   */
  cacheElements() {
    this.elements.speakersGrid = document.getElementById('speakersGrid');
    this.elements.enrolledCount = document.getElementById('enrolledCount');
    this.elements.enrollForm = document.getElementById('enrollForm');
    this.elements.speakerNameInput = document.getElementById('speakerNameInput');
    this.elements.referenceAudioInput = document.getElementById('referenceAudioInput');
    this.elements.enrollDropzone = document.getElementById('enrollDropzone');
    this.elements.referenceFileLabel = document.getElementById('referenceFileLabel');
    this.elements.btnSubmitEnroll = document.getElementById('btnSubmitEnroll');
    this.elements.btnSubmitEnrollText = document.getElementById('btnSubmitEnrollText');
    this.elements.logoutBtn = document.getElementById('logoutBtn');

    const modalEl = document.getElementById('enrollSpeakerModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      this.elements.enrollModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    }
  },

  /**
   * Register event handlers.
   */
  bindEvents() {
    const { logoutBtn, enrollDropzone, referenceAudioInput, btnSubmitEnroll } = this.elements;

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (typeof Auth !== 'undefined' && typeof Auth.logout === 'function') {
          Auth.logout();
        }
      });
    }

    if (enrollDropzone && referenceAudioInput) {
      enrollDropzone.addEventListener('click', () => referenceAudioInput.click());

      enrollDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        enrollDropzone.style.borderColor = 'var(--vs-cyan)';
        enrollDropzone.style.background = 'rgba(76, 201, 240, 0.08)';
      });

      enrollDropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        enrollDropzone.style.borderColor = 'rgba(255, 255, 255, 0.18)';
        enrollDropzone.style.background = 'rgba(3, 4, 7, 0.5)';
      });

      enrollDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        enrollDropzone.style.borderColor = 'rgba(255, 255, 255, 0.18)';
        enrollDropzone.style.background = 'rgba(3, 4, 7, 0.5)';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.stageReferenceFile(e.dataTransfer.files[0]);
        }
      });

      referenceAudioInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.stageReferenceFile(e.target.files[0]);
        }
      });
    }

    if (btnSubmitEnroll) {
      btnSubmitEnroll.addEventListener('click', () => this.handleEnrollment());
    }
  },

  /**
   * Staging and format validation for incoming reference speech.
   * @param {File} file 
   */
  stageReferenceFile(file) {
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    const allowed = CONFIG?.AUDIO?.ALLOWED_EXTENSIONS || ['wav', 'mp3', 'flac', 'm4a'];
    if (!allowed.includes(extension)) {
      alert(`Invalid format: .${extension}. Please provide clean WAV, MP3, FLAC, or M4A speech.`);
      return;
    }

    this.stagedAudioFile = file;

    const label = this.elements.referenceFileLabel;
    if (label) {
      label.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      label.classList.add('text-cyan');
    }
  },

  /**
   * Fetches biometric voiceprints from backend or uses simulated fallbacks.
   */
  async loadProfiles() {
    try {
      if (typeof API !== 'undefined' && typeof API.getSpeakers === 'function') {
        const res = await API.getSpeakers();
        this.profiles = res.data || [];
      } else {
        this.profiles = this.getMockSpeakerData();
      }
    } catch (err) {
      console.warn('[VoiceShield Speaker] API offline. Loading local biometric cache.', err);
      this.profiles = this.getMockSpeakerData();
    }

    this.renderProfiles();
    this.updateCounters();
  },

  /**
   * Updates metric indicators.
   */
  updateCounters() {
    if (this.elements.enrolledCount) {
      this.elements.enrolledCount.textContent = this.profiles.length.toString();
    }
  },

  /**
   * Generates dynamic cards for enrolled voiceprints.
   */
  renderProfiles() {
    const grid = this.elements.speakersGrid;
    if (!grid) return;

    if (this.profiles.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center text-secondary py-5 font-mono">
          <i class="fa-solid fa-users-slash fs-2 text-muted mb-3 d-block"></i>
          No biometric speaker voiceprints currently enrolled.
        </div>
      `;
      return;
    }

    grid.innerHTML = this.profiles.map(p => {
      const initials = p.name ? p.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'SP';
      const spectrumBars = this.generateSpectrumBars(p.id);

      return `
        <div class="col-lg-4 col-md-6">
          <div class="speaker-item-card">
            <div>
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div class="d-flex align-items-center gap-3">
                  <div class="speaker-avatar-circle">${initials}</div>
                  <div>
                    <h6 class="fw-bold text-white mb-0 text-truncate" style="max-width: 170px;" title="${p.name}">${p.name}</h6>
                    <span class="font-mono text-cyan small">ID: ${p.id}</span>
                  </div>
                </div>
                <span class="badge bg-success bg-opacity-25 text-success font-mono small">VERIFIED</span>
              </div>

              <div class="font-mono text-secondary small mb-1">Acoustic Embedding Fingerprint:</div>
              <div class="voiceprint-spectrum" title="512-dim Normalized Embedding Distribution">
                ${spectrumBars}
              </div>

              <div class="d-flex justify-content-between font-mono text-secondary text-xs mt-2">
                <span>Samples: ${p.sample_count || 1} Reference Audios</span>
                <span>Enrolled: ${p.enrolled_date || 'Recent'}</span>
              </div>
            </div>

            <div class="d-flex gap-2 mt-4 pt-2 border-top border-white border-opacity-10">
              <a href="analyze.html?speaker=${p.id}" class="btn-action-outline font-mono text-center flex-grow-1">
                <i class="fa-solid fa-magnifying-glass me-1"></i> Verify Against
              </a>
              <button class="btn btn-sm btn-outline-danger border-0" title="Delete Voiceprint" onclick="Speaker.deleteProfile('${p.id}')">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Deterministically produces visual vector bars based on profile string hash.
   * @param {string} id 
   * @returns {string}
   */
  generateSpectrumBars(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }

    const bars = [];
    for (let j = 0; j < 14; j++) {
      const height = 25 + Math.abs(Math.sin(hash + j) * 75);
      bars.push(`<div class="vp-bar" style="height: ${height.toFixed(0)}%;"></div>`);
    }
    return bars.join('');
  },

  /**
   * Compiles reference sample and submits enrollment payload.
   */
  async handleEnrollment() {
    const nameInput = this.elements.speakerNameInput;
    const name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
      alert('Please specify the subject / speaker name.');
      return;
    }

    if (!this.stagedAudioFile) {
      alert('Please attach an audio reference sample to extract the 512-dim vector baseline.');
      return;
    }

    const { btnSubmitEnroll, btnSubmitEnrollText } = this.elements;
    btnSubmitEnroll.disabled = true;
    btnSubmitEnrollText.textContent = 'Extracting d-vectors...';

    try {
      if (typeof API !== 'undefined' && typeof API.enrollSpeaker === 'function') {
        const res = await API.enrollSpeaker(name, this.stagedAudioFile);
        this.profiles.unshift(res.data);
      } else {
        // Fallback simulation
        await new Promise(resolve => setTimeout(resolve, 1200));
        const newProfile = {
          id: `spk_${Date.now().toString().slice(-4)}`,
          name: name,
          sample_count: 1,
          enrolled_date: new Date().toISOString().slice(0, 10)
        };
        this.profiles.unshift(newProfile);
      }

      this.renderProfiles();
      this.updateCounters();
      this.resetEnrollModal();

      if (this.elements.enrollModal) {
        this.elements.enrollModal.hide();
      }

      alert(`Biometric voiceprint for "${name}" successfully compiled and registered.`);
    } catch (err) {
      alert(`Enrollment failed: ${err.message}`);
    } finally {
      btnSubmitEnroll.disabled = false;
      btnSubmitEnrollText.textContent = 'Compile Embedding ➔';
    }
  },

  /**
   * Resets modal form and staged file references.
   */
  resetEnrollModal() {
    this.stagedAudioFile = null;
    if (this.elements.enrollForm) this.elements.enrollForm.reset();
    if (this.elements.referenceFileLabel) {
      this.elements.referenceFileLabel.textContent = 'Click or drop reference speech sample';
      this.elements.referenceFileLabel.classList.remove('text-cyan');
    }
  },

  /**
   * Deletes a registered voiceprint profile.
   * @param {string} id 
   */
  async deleteProfile(id) {
    const target = this.profiles.find(p => p.id === id);
    if (!target) return;

    if (!confirm(`Are you sure you want to purge the biometric voiceprint for "${target.name}"?`)) {
      return;
    }

    try {
      if (typeof API !== 'undefined' && typeof API.deleteSpeaker === 'function') {
        await API.deleteSpeaker(id);
      }
      this.profiles = this.profiles.filter(p => p.id !== id);
      this.renderProfiles();
      this.updateCounters();
    } catch (err) {
      alert(`Failed to delete profile: ${err.message}`);
    }
  },

  /**
   * Mock baseline profiles for standalone evaluation.
   */
  getMockSpeakerData() {
    return [
      {
        id: 'spk_01',
        name: 'Satya Nadella',
        sample_count: 4,
        enrolled_date: '2026-08-14'
      },
      {
        id: 'spk_02',
        name: 'Tim Cook',
        sample_count: 6,
        enrolled_date: '2026-07-29'
      },
      {
        id: 'spk_03',
        name: 'Sam Altman',
        sample_count: 3,
        enrolled_date: '2026-08-01'
      }
    ];
  }
};

// Mount controller on DOM load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Auth !== 'undefined' && typeof Auth.requireAuth === 'function') {
    Auth.requireAuth();
  }
  Speaker.init();
});