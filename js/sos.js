/* ==========================================================================
   RAKSHIKA — EMERGENCY & SOS ENGINE (JS)
   ========================================================================== */

class SosService {
  constructor() {
    this.state = 'idle'; // idle, countdown, active
    this.countdownTimer = null;
    this.countdownValue = 3;
    
    // Siren Audio settings
    this.audioContext = null;
    this.sirenOscillator = null;
    this.sirenGain = null;
    this.alarmAudio = new Audio('assets/alarm.mp3');
    this.alarmAudio.loop = true;
    this.isAudioPlaying = false;
    
    // Check-in Timer settings
    this.checkInTimer = null;
    this.checkInRemainingSeconds = 0;
    
    // Fake Call settings
    this.fakeCallTimer = null;
    this.fakeCallRingtoneInterval = null;

    // Periodic live location tracking settings
    this.locationUpdateInterval = null;
    this.isSilentMode = false;
    this.threatLevel = 'medium'; // low, medium, high, critical
    this.activeSessionId = null;
  }

  /* --- Web Audio API Synth Fallbacks --- */
  _initAudioContext() {
    if (this.isSilentMode) return;
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Synthesize warning beep during countdown (only if not silent mode)
  playBeep(frequency = 800, duration = 0.15) {
    if (this.isSilentMode) return;
    try {
      this._initAudioContext();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }
  }

  // Synthesize a continuous modulating police siren sound
  startSynthSiren() {
    if (this.isSilentMode) return;
    try {
      this._initAudioContext();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      if (this.sirenOscillator) return; // Already running

      this.sirenOscillator = this.audioContext.createOscillator();
      this.sirenGain = this.audioContext.createGain();
      
      this.sirenOscillator.type = 'sawtooth';
      this.sirenOscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      
      this.sirenGain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
      
      // Frequency Modulator (Siren fluctuation)
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      
      lfo.frequency.setValueAtTime(2, this.audioContext.currentTime); // 2 fluctuations per second
      lfoGain.gain.setValueAtTime(250, this.audioContext.currentTime); // sweep range +/- 250Hz
      
      lfo.connect(lfoGain);
      lfoGain.connect(this.sirenOscillator.frequency);
      
      this.sirenOscillator.connect(this.sirenGain);
      this.sirenGain.connect(this.audioContext.destination);
      
      lfo.start();
      this.sirenOscillator.start();
    } catch (e) {
      console.error("Failed to start synth siren:", e);
    }
  }

  stopSynthSiren() {
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
      } catch (e) {}
      this.sirenOscillator = null;
    }
    if (this.sirenGain) {
      this.sirenGain.disconnect();
      this.sirenGain = null;
    }
  }

  /* --- Siren Player Manager --- */
  startAlarmAudio() {
    if (this.isSilentMode) return;
    if (this.isAudioPlaying) return;
    this.isAudioPlaying = true;
    
    // Attempt file playback
    this.alarmAudio.play()
      .then(() => {
        console.log("Playing alarm.mp3 asset loop.");
      })
      .catch((err) => {
        console.warn("alarm.mp3 file blocked or missing, using Web Audio synthesizer.", err);
        this.startSynthSiren();
      });
  }

  stopAlarmAudio() {
    this.isAudioPlaying = false;
    this.alarmAudio.pause();
    this.alarmAudio.currentTime = 0;
    this.stopSynthSiren();
  }

  /* --- SOS Countdown Trigger Workflows --- */
  startCountdown(onTick, onComplete, onCancel) {
    if (this.state !== 'idle') return;
    
    this.state = 'countdown';
    this.countdownValue = 3;
    this.playBeep(600, 0.2); // Initial beep
    
    onTick(this.countdownValue);

    this.countdownTimer = setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue > 0) {
        this.playBeep(600, 0.2);
        onTick(this.countdownValue);
      } else {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.state = 'active';
        
        // Play siren sound (skipped automatically if in silent mode)
        if (!this.isSilentMode) {
          this.startAlarmAudio();
        }
        
        // Trigger GPS Location fetch & Database entry
        this._dispatchEmergencySignal(onComplete);
      }
    }, 1000);

    this.cancelTrigger = () => {
      if (this.state === 'countdown') {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.state = 'idle';
        this.playBeep(300, 0.3); // Low tone for cancel
        onCancel();
      }
    };
  }

  triggerInstantSOS(onComplete) {
    if (this.state !== 'idle') return;
    this.state = 'active';
    if (!this.isSilentMode) {
      this.startAlarmAudio();
    }
    this._dispatchEmergencySignal(onComplete);
  }

  // Cancel countdown or active emergency
  async resolveEmergency(onResolved) {
    this.stopAlarmAudio();
    this.stopLiveTrackingLoop();
    this.state = 'idle';

    const activeSosId = this.activeSessionId || sessionStorage.getItem('rakshika_active_sos_id');
    if (activeSosId) {
      await window.rakshikaDb.updateSOSStatus(activeSosId, 'resolved');
      sessionStorage.removeItem('rakshika_active_sos_id');
      this.activeSessionId = null;
    }

    if (onResolved) onResolved();
  }

  // Locate user and push alert to database
  _dispatchEmergencySignal(callback) {
    const user = window.rakshikaAuth ? window.rakshikaAuth.getCurrentUser() : null;
    
    const alertData = {
      user_id: user ? (user.id || user.email) : 'anon-user',
      user_name: user ? (user.name || user.email) : 'Anonymous User',
      user_phone: user ? (user.phone || '+91 99999 88888') : '+91 99999 88888',
      latitude: 28.6139, // Default Delhi
      longitude: 77.2090,
      emergency_type: this.isSilentMode ? 'silent' : 'panic',
      threat_level: this.threatLevel
    };

    // Grab live location if possible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          alertData.latitude = position.coords.latitude;
          alertData.longitude = position.coords.longitude;
          
          const result = await window.rakshikaDb.triggerSOS(alertData);
          if (result.data) {
            this.activeSessionId = result.data.id;
            sessionStorage.setItem('rakshika_active_sos_id', result.data.id);
            this.startLiveTrackingLoop(result.data.id);
          }
          if (callback) callback(alertData.latitude, alertData.longitude);
        },
        async (error) => {
          console.warn("GPS failed, firing SOS with default coordinates.", error);
          const result = await window.rakshikaDb.triggerSOS(alertData);
          if (result.data) {
            this.activeSessionId = result.data.id;
            sessionStorage.setItem('rakshika_active_sos_id', result.data.id);
            this.startLiveTrackingLoop(result.data.id);
          }
          if (callback) callback(alertData.latitude, alertData.longitude);
        },
        { timeout: 5000 }
      );
    } else {
      // No GPS browser support
      window.rakshikaDb.triggerSOS(alertData).then(result => {
        if (result.data) {
          this.activeSessionId = result.data.id;
          sessionStorage.setItem('rakshika_active_sos_id', result.data.id);
          this.startLiveTrackingLoop(result.data.id);
        }
        if (callback) callback(alertData.latitude, alertData.longitude);
      });
    }
  }

  /* --- Periodic Live Tracking Loop --- */
  startLiveTrackingLoop(activeId) {
    this.stopLiveTrackingLoop();
    console.log("SOS Engine: Initializing 8-second location tracking loop.");

    let step = 0;
    const MOCK_START = [28.6139, 77.2090];
    const MOCK_END = [28.6150, 77.2150]; // Police station safe point

    const performTracking = async () => {
      if (this.state !== 'active') {
        this.stopLiveTrackingLoop();
        return;
      }

      // If mock database is active, simulate movement along the path
      if (window.rakshikaDb && window.rakshikaDb.isMock) {
        step = (step + 1) % 15; // loop after 15 steps
        const t = step / 15;
        const lat = MOCK_START[0] + (MOCK_END[0] - MOCK_START[0]) * t;
        const lng = MOCK_START[1] + (MOCK_END[1] - MOCK_START[1]) * t;
        
        console.log("Simulating movement update:", lat, lng);
        
        // 1. Push latest coordinates to alert row
        await window.rakshikaDb.updateSOSCoordinates(activeId, lat, lng);

        // 2. Insert into location_tracking log table
        await window.rakshikaDb.insertLocationLog({
          session_id: activeId,
          latitude: lat,
          longitude: lng,
          accuracy: 10,
          speed: 2.5,
          heading: 45
        });
        
        // 3. Update map view locally if dashMap exists
        if (window.dashMap) {
          window.dashMap.updateUserLocation(lat, lng);
        }

        // 4. Update coordinates display elements
        const coordsText = document.getElementById('trackingCoordsText');
        if (coordsText) {
          coordsText.innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        const overlayCoords = document.getElementById('overlayCoords');
        if (overlayCoords) {
          overlayCoords.innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const acc = position.coords.accuracy || null;
            const speed = position.coords.speed || null;
            const heading = position.coords.heading || null;
            
            console.log("Broadcasting live tracking update:", lat, lng);
            
            // 1. Push latest coordinates to alert row
            await window.rakshikaDb.updateSOSCoordinates(activeId, lat, lng);

            // 2. Insert into location_tracking log table
            await window.rakshikaDb.insertLocationLog({
              session_id: activeId,
              latitude: lat,
              longitude: lng,
              accuracy: acc,
              speed: speed,
              heading: heading
            });
            
            // 3. Update map view locally if dashMap exists
            if (window.dashMap) {
              window.dashMap.updateUserLocation(lat, lng);
            }

            // 4. Update coordinates display elements
            const coordsText = document.getElementById('trackingCoordsText');
            if (coordsText) {
              coordsText.innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
            const overlayCoords = document.getElementById('overlayCoords');
            if (overlayCoords) {
              overlayCoords.innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
          },
          (err) => {
            console.warn("GPS tracking loop failed to read coordinates:", err);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    };

    // Run first update immediately
    performTracking();

    // Loop every 8 seconds
    this.locationUpdateInterval = setInterval(performTracking, 8000);
  }

  stopLiveTrackingLoop() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
      console.log("SOS Engine: location tracking loop cleared.");
    }
  }

  /* --- Check-in Timer --- */
  startCheckIn(minutes, onTick, onExpired) {
    this.stopCheckIn();
    
    this.checkInRemainingSeconds = minutes * 60;
    onTick(this.checkInRemainingSeconds);

    this.checkInTimer = setInterval(() => {
      this.checkInRemainingSeconds--;
      onTick(this.checkInRemainingSeconds);

      if (this.checkInRemainingSeconds <= 0) {
        clearInterval(this.checkInTimer);
        this.checkInTimer = null;
        this.playBeep(900, 0.5);
        
        // Trigger alarm
        onExpired();
      }
    }, 1000);
  }

  stopCheckIn() {
    if (this.checkInTimer) {
      clearInterval(this.checkInTimer);
      this.checkInTimer = null;
      this.checkInRemainingSeconds = 0;
    }
  }

  /* --- Fake Call Simulator --- */
  scheduleFakeCall(delaySeconds, onRinging, onHangup) {
    this.cancelFakeCall();

    this.fakeCallTimer = setTimeout(() => {
      // Trigger Ring screen
      onRinging();
      this._startRingtoneSynth();
    }, delaySeconds * 1000);

    this.cancelFakeCall = () => {
      clearTimeout(this.fakeCallTimer);
      this.fakeCallTimer = null;
      this._stopRingtoneSynth();
      onHangup();
    };
  }

  _startRingtoneSynth() {
    this._stopRingtoneSynth();
    
    // Play telephone ringing sound pattern
    this.fakeCallRingtoneInterval = setInterval(() => {
      this.playBeep(440, 0.4);
      setTimeout(() => this.playBeep(440, 0.4), 600);
    }, 3000);
  }

  _stopRingtoneSynth() {
    if (this.fakeCallRingtoneInterval) {
      clearInterval(this.fakeCallRingtoneInterval);
      this.fakeCallRingtoneInterval = null;
    }
  }

  cancelFakeCall() {
    if (this.fakeCallTimer) {
      clearTimeout(this.fakeCallTimer);
      this.fakeCallTimer = null;
      this._stopRingtoneSynth();
    }
  }
}

// Global Singleton
window.rakshikaSos = new SosService();
