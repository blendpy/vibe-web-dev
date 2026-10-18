/**
 * TIME CONTROLLER - Dual-View Synchronization Engine
 */
class TimeController {
  constructor(bridge) {
    this.bridge = bridge || {};
    this.currentDate = new Date();
    this.timeScale = 1;
    this.isPlaying = true;
    this.isReverse = false;
    this.isScrubbing = false;
    this.isLiveSync = true; // Locks exactly to system clock to prevent floating-point drift
    this.currentPlanet = 'earth';

    this.frames = 0;
    this.lastFpsTime = performance.now();
    this.fps = 30;

    this.solarDays = {
      mercury: 14076000, venus: 10087200, earth: 86400,
      mars: 88775.2, jupiter: 35730, saturn: 38360,
      uranus: 62060, neptune: 57996, sun: 2160000, moon: 2551443
    };

    this.cacheDOMElements();
    this.bindEvents();
    this.updateTransportButtons();
    this.updateUI(true);
    this.startLoop();
  }

  cacheDOMElements() {
    this.dom = {
      fps: document.getElementById('sim-fps-val'),
      statusBadge: document.getElementById('sim-status-badge'),
      pingDot: document.getElementById('clock-pulse-ping'),
      date: document.getElementById('display-date'),
      doy: document.getElementById('display-doy'),
      time: document.getElementById('display-time'),
      localTime: document.getElementById('display-local-time'),

      date: document.getElementById('display-date'),
      datePreset: document.getElementById('display-date-preset'),
      doy: document.getElementById('display-doy'),
      
      btnReverse: document.getElementById('btn-reverse'),
      btnPlayPause: document.getElementById('btn-play-pause'),
      playPauseIcon: document.getElementById('play-pause-icon'),
      btnNow: document.getElementById('btn-now'),
      btnCalendar: document.getElementById('btn-calendar'),
      calendarInput: document.getElementById('calendar-date-input'),
      speedSelect: document.getElementById('sim-speed-select'),

      row4: document.getElementById('row4-earth-slider-container'),
      earthSlider: document.getElementById('earth-time-slider'),
      earthSliderLabel: document.getElementById('earth-slider-label'),

      row5Container: document.getElementById('row5-dynamic-container'),
      row5Lunar: document.getElementById('row5-lunar'),
      moonCanvas: document.getElementById('moon-phase-canvas-widget'),
      moonName: document.getElementById('moon-phase-name-widget'),
      moonIllum: document.getElementById('moon-phase-illum-widget'),

      row5Planet: document.getElementById('row5-planet'),
      planetBadge: document.getElementById('planet-name-badge'),
      planetPct: document.getElementById('planet-solar-pct'),
      planetReadout: document.getElementById('planet-solar-readout'),
      planetBar: document.getElementById('planet-day-bar')
    };
  }

  bindEvents() {
    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const epochStr = btn.getAttribute('data-epoch');
        if (epochStr) {
          this.isLiveSync = false; // Break real-time lock
          this.currentDate = new Date(epochStr + 'Z');
          this.updateUI(true);
          this.notifyTimeUpdate();
          document.getElementById('date-picker-modal')?.classList.add('hidden');
        }
      });
    });

    this.dom.btnReverse?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isLiveSync = false;
      if (!this.isPlaying || !this.isReverse) {
        this.isPlaying = true;
        this.isReverse = true;
      } else {
        this.isPlaying = false;
      }
      this.updateTransportButtons();
      this.updateStatusBadge();
    });

    this.dom.btnPlayPause?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isLiveSync = false;
      if (!this.isPlaying || this.isReverse) {
        this.isPlaying = true;
        this.isReverse = false;
      } else {
        this.isPlaying = false;
      }
      this.updateTransportButtons();
      this.updateStatusBadge();
    });

    this.dom.btnNow?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isLiveSync = true; // Restore exact real-time sync lock
      this.currentDate = new Date();
      this.isPlaying = true;
      this.isReverse = false;
      this.timeScale = 1;
      
      if (this.dom.speedSelect) this.dom.speedSelect.value = "1";
      
      this.updateTransportButtons();
      this.updateStatusBadge();
      this.updateUI(true);
      this.notifyTimeUpdate();
    });

    this.dom.btnCalendar?.addEventListener('click', (e) => {
      e.stopPropagation();
      const modal = document.getElementById('date-picker-modal');
      if (modal) {
        const dateInput = document.getElementById('input-custom-date');
        if (dateInput) {
          const y = this.currentDate.getUTCFullYear();
          const m = String(this.currentDate.getUTCMonth() + 1).padStart(2, '0');
          const d = String(this.currentDate.getUTCDate()).padStart(2, '0');
          dateInput.value = `${y}-${m}-${d}`;
        }
        modal.classList.remove('hidden');
      } else if (this.dom.calendarInput) {
        this.dom.calendarInput.showPicker?.() || this.dom.calendarInput.click();
      }
    });

    this.dom.calendarInput?.addEventListener('change', (e) => {
      if (e.target.value) {
        this.isLiveSync = false;
        const [year, month, day] = e.target.value.split('-').map(Number);
        this.currentDate.setUTCFullYear(year, month - 1, day);
        this.updateUI(true);
        this.notifyTimeUpdate();
      }
    });

    this.dom.speedSelect?.addEventListener('change', (e) => {
      this.isLiveSync = false; // Break real-time lock so it actually speeds up
      this.timeScale = parseFloat(e.target.value);
      this.updateStatusBadge();
      this.updateUI(false);
    });

    // Scrubber Events
    this.dom.earthSlider?.addEventListener('input', (e) => {
      this.isScrubbing = true;
      this.isLiveSync = false;
      const totalSec = parseInt(e.target.value, 10);
      // Removed "UTC" so it applies the drag to your local timezone
      this.currentDate.setHours(Math.floor(totalSec / 3600), Math.floor((totalSec % 3600) / 60), totalSec % 60);
      this.updateUI(false);
      this.notifyTimeUpdate();
    });
    this.dom.earthSlider?.addEventListener('change', () => { this.isScrubbing = false; });

    this.dom.planetSlider?.addEventListener('input', (e) => {
      this.isScrubbing = true;
      this.isLiveSync = false;
      const ratio = parseInt(e.target.value, 10) / 1000;
      const solSec = this.solarDays[this.currentPlanet] || 86400;
      const elapsed = ratio * solSec;
      this.renderPlanetReadout(elapsed, solSec, ratio);
      if (typeof this.bridge.setPlanetRotationRatio === 'function') {
        this.bridge.setPlanetRotationRatio(this.currentPlanet, ratio);
      }
    });
    this.dom.planetSlider?.addEventListener('change', () => { this.isScrubbing = false; });

    window.addEventListener('mouseup', () => { this.isScrubbing = false; });
    window.addEventListener('touchend', () => { this.isScrubbing = false; });
  }

  updateTransportButtons() {
    if (this.dom.playPauseIcon) {
      this.dom.playPauseIcon.className = (this.isPlaying && !this.isReverse) ? 'fa-solid fa-pause text-xs' : 'fa-solid fa-play text-xs';
    }
    if (this.dom.btnReverse) {
      this.dom.btnReverse.classList.toggle('btn-active-direction', this.isPlaying && this.isReverse);
    }
    if (this.dom.btnPlayPause) {
      this.dom.btnPlayPause.classList.toggle('btn-active-direction', this.isPlaying && !this.isReverse);
    }
  }

  startLoop() {
    let lastTime = 0;
    let lastFrameTime = 0;
    const frameInterval = 1000 / 30; // 30 FPS Cap

    const frame = (now) => {
      requestAnimationFrame(frame);
      
      if (!lastFrameTime) {
        lastFrameTime = now;
        lastTime = now;
        return;
      }

      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) return;
      lastFrameTime = now - (elapsed % frameInterval);

      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      this.tick(deltaSec);
    };
    
    requestAnimationFrame(frame);
  }

  tick(deltaSec) {
    this.frames++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 500) {
      this.fps = Math.round((this.frames * 1000) / (now - this.lastFpsTime));
      if (this.dom.fps) this.dom.fps.textContent = `${this.fps} FPS`;
      this.frames = 0;
      this.lastFpsTime = now;
    }

    if (this.isPlaying && !this.isScrubbing) {
      if (this.isLiveSync) {
        // Snaps exactly to system clock, bypassing float errors
        this.currentDate = new Date();
      } else {
        const dir = this.isReverse ? -1 : 1;
        const ms = deltaSec * 1000 * this.timeScale * dir;
        this.currentDate = new Date(this.currentDate.getTime() + ms);
      }
      this.updateUI(true);
      this.notifyTimeUpdate();
    }
  }

  updateStatusBadge() {
    if (!this.dom.statusBadge) return;
    
    if (this.isLiveSync && this.isPlaying) {
      this.dom.statusBadge.className = 'text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-medium';
      this.dom.statusBadge.textContent = 'LIVE';
      this.dom.pingDot?.classList.remove('hidden');
    } else if (!this.isPlaying) {
      this.dom.statusBadge.className = 'text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-medium';
      this.dom.statusBadge.textContent = 'PAUSED';
      this.dom.pingDot?.classList.add('hidden');
    } else {
      this.dom.statusBadge.className = 'text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 text-blue-300 font-medium';
      this.dom.statusBadge.textContent = this.isReverse ? 'REVERSE' : `${this.dom.speedSelect?.selectedOptions[0]?.text || 'TIMELAPSE'}`;
      this.dom.pingDot?.classList.remove('hidden');
    }
  }


updateUI(syncSliders) {
    const d = this.currentDate;

    // Use local calendar getters so Friday night does not jump to Saturday UTC
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    if (this.dom.date) this.dom.date.textContent = `${yyyy}-${mm}-${dd}`;

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'];
    const start = new Date(yyyy, 0, 1);
    const doy = Math.floor((d - start) / 86400000) + 1;
    if (this.dom.doy) this.dom.doy.textContent = `${weekdays[d.getDay()]}, DOY ${doy}`;
    if (this.dom.datePreset) this.dom.datePreset.textContent = `${yyyy}-${mm}-${dd}`;

    // Line 2: UTC Time (secondary)
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    if (this.dom.time) this.dom.time.textContent = `${hh}:${min}:${ss} UTC`;


    // Line 2: Local Time (Now primary with seconds)
    let localHours = d.getHours();
    const ampm = localHours >= 12 ? 'pm' : 'am';
    localHours = localHours % 12 || 12;
    const localMin = String(d.getMinutes()).padStart(2, '0');
    const localSec = String(d.getSeconds()).padStart(2, '0');
    
    if (this.dom.localTime) {
      // Use innerHTML to style just the word "Local" in small, gray text
      this.dom.localTime.innerHTML = `${localHours}:${localMin}${ampm} ${localSec}s <span class="text-[10px] text-slate-400 font-normal tracking-normal">Local</span>`;
    }
   
    const isTooFast = this.timeScale > 86400;
    if (this.dom.row4) this.dom.row4.style.display = isTooFast ? 'none' : 'block';

    // Read local time instead of UTC to position the slider
    const secInDay = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    
    const locH = String(d.getHours()).padStart(2, '0');
    const locM = String(d.getMinutes()).padStart(2, '0');
    const locS = String(d.getSeconds()).padStart(2, '0');
    
    if (this.dom.earthSliderLabel) this.dom.earthSliderLabel.textContent = `${locH}h:${locM}m:${locS}s / 24h:00m:00s`;
    if (syncSliders && !this.isScrubbing && this.dom.earthSlider) this.dom.earthSlider.value = secInDay;

    const isEarth = (this.currentPlanet.toLowerCase() === 'earth');
    
    if (isEarth) {
      this.dom.row5Container?.classList.remove('hidden');
      this.dom.row5Lunar?.classList.remove('hidden');
      this.dom.row5Planet?.classList.add('hidden');
      this.updateLunarPhase(d);
    } else {
      this.dom.row5Lunar?.classList.add('hidden');
      if (isTooFast) {
        this.dom.row5Container?.classList.add('hidden');
        this.dom.row5Planet?.classList.add('hidden');
      } else {
        this.dom.row5Container?.classList.remove('hidden');
        this.dom.row5Planet?.classList.remove('hidden');
        this.dom.row5Planet.classList.add('flex');
        this.updatePlanetSolarDay();
      }
    }
  }

  updateLunarPhase(date) {
    const knownNewMoon = Date.UTC(2024, 0, 11, 11, 57, 0);
    const synodicMs = 29.5305877 * 86400 * 1000;
    const diff = (date.getTime() - knownNewMoon) % synodicMs;
    const phaseVal = (diff >= 0 ? diff : diff + synodicMs) / synodicMs;
    const illumination = Math.round((1 - Math.cos(phaseVal * 2 * Math.PI)) / 2 * 100);

    let phaseName = 'New Moon', trend = 'New';
    // Tightened thresholds for major phases from ~40 hours down to ~17 hours
    if (phaseVal < 0.03 || phaseVal >= 0.97) { phaseName = 'New Moon'; trend = 'New'; }
    else if (phaseVal < 0.235) { phaseName = 'Waxing Crescent'; trend = 'Waxing'; }
    else if (phaseVal < 0.265) { phaseName = 'First Quarter'; trend = 'Waxing'; }
    else if (phaseVal < 0.485) { phaseName = 'Waxing Gibbous'; trend = 'Waxing'; }
    else if (phaseVal < 0.515) { phaseName = 'Full Moon'; trend = 'Full'; }
    else if (phaseVal < 0.735) { phaseName = 'Waning Gibbous'; trend = 'Waning'; }
    else if (phaseVal < 0.765) { phaseName = 'Third Quarter'; trend = 'Waning'; }
    else { phaseName = 'Waning Crescent'; trend = 'Waning'; }

    if (this.dom.moonName) this.dom.moonName.textContent = phaseName;
    if (this.dom.moonIllum) this.dom.moonIllum.textContent = `${illumination}% Illumination • ${trend}`;

    this.drawMoon(this.dom.moonCanvas, phaseVal);
  }

  drawMoon(canvas, phaseVal) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2, r = (w / 2) - 1.5;
    ctx.clearRect(0, 0, w, h);

    // 1. Draw the base dark moon
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    const phaseAngle = phaseVal * Math.PI * 2;
    const cosPhase = Math.cos(phaseAngle);
    const isWaxing = phaseVal <= 0.5;
    const isCrescent = (phaseVal < 0.25 || phaseVal > 0.75);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip(); // Ensure drawing doesn't bleed outside the moon circle

    // 2. Draw the bright illuminated half-circle
    ctx.beginPath();
    ctx.fillStyle = '#f1f5f9';
    if (isWaxing) {
      ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false); // Right half
    } else {
      ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2, false); // Left half
    }
    ctx.fill();

    // 3. Draw the center terminator ellipse to cut into or bulge out of the bright half
    ctx.beginPath();
    ctx.fillStyle = isCrescent ? '#1e293b' : '#f1f5f9';
    ctx.ellipse(cx, cy, Math.max(0.01, Math.abs(cosPhase) * r), r, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }


  updatePlanetSolarDay() {
    const planetKey = this.currentPlanet.toLowerCase();
    const solSec = this.solarDays[planetKey] || 86400;
    if (this.dom.planetBadge) this.dom.planetBadge.textContent = this.currentPlanet.toUpperCase();

    const jd2000Sec = Date.UTC(2000, 0, 1, 12, 0, 0) / 1000;
    const diff = (this.currentDate.getTime() / 1000) - jd2000Sec;
    let elapsed = diff % solSec;
    if (elapsed < 0) elapsed += solSec;
    const ratio = Math.max(0, Math.min(1, elapsed / solSec));

    this.renderPlanetReadout(elapsed, solSec, ratio);
  }

  renderPlanetReadout(elapsed, total, ratio) {
    const fmt = (s) => {
      if (total >= 172800) { 
        return `${Math.floor(s / 86400)}d ${String(Math.floor((s % 86400) / 3600)).padStart(2, '0')}h:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m:${String(Math.floor(s % 60)).padStart(2, '0')}s`;
      } else {
        return `${String(Math.floor(s / 3600)).padStart(2, '0')}h:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m:${String(Math.floor(s % 60)).padStart(2, '0')}s`;
      }
    };
    
    if (this.dom.planetReadout) this.dom.planetReadout.textContent = `${fmt(elapsed)} / ${fmt(total)}`;
    if (this.dom.planetPct) this.dom.planetPct.textContent = `${Math.round(ratio * 100)}%`;
    if (this.dom.planetBar) this.dom.planetBar.style.width = `${ratio * 100}%`;
  }

  setTargetPlanet(planetName) {
    this.currentPlanet = (planetName || 'earth').toLowerCase();
    this.updateUI(true);
  }

  notifyTimeUpdate() {
    // -------------------------------------------------------------
    // THE FIREWALL
    // Explicitly disables legacy time loops in globe.js and 2D canvas
    // so they do not fight this controller and force time back to 1x.
    // -------------------------------------------------------------
    try { isRealtimeSync = false; } catch(e) {}
    try { simSpeed = 0; } catch(e) {}
    try { 
      if (typeof state !== 'undefined' && state) { 
        state.isRealtime = false; 
        state.simSpeed = 0; 
      } 
    } catch(e) {}

    if (typeof this.bridge.onSimulationTimeUpdate === 'function') {
      this.bridge.onSimulationTimeUpdate(this.currentDate);
    }
  }
}

window.TimeController = TimeController;
