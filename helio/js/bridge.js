/**
 * =======================================================================
 * HELIOS OBSERVATORY - DUAL-VIEW INTEGRATION BRIDGE
 * =======================================================================
 */

const HeliosBridge = {
  mode: 'SYSTEM_VIEW',
  threeAnimLoopId: null,
  isTransitioning: false,

  resolveTargetName(idOrName) {
    if (!idOrName) return 'earth';
    const raw = String(idOrName).toLowerCase().trim();
    // return raw.charAt(0).toUpperCase() + raw.slice(1);
    return raw;
  },

  enterInspectorView(targetId) {
    const planetName = this.resolveTargetName(targetId);

    // If already in 3D mode, switch planet directly and safely
    if (this.mode === 'INSPECTOR_VIEW') {
      if (typeof window.setPlanet === 'function') window.setPlanet(planetName);
      else if (typeof setPlanet === 'function') setPlanet(planetName);
      
      if (window.timeController) window.timeController.setTargetPlanet(planetName);
      if (typeof window.updateEphemerisPanel === 'function') window.updateEphemerisPanel(planetName);
      return;
    }

    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.mode = 'INSPECTOR_VIEW';

    const toggleBtn = document.getElementById('btn-view-toggle');
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-solar-system"></i> Enter Solar System View';

    if (window.timeController) {
      window.timeController.setTargetPlanet(planetName);
      if (typeof state !== 'undefined' && state.epochMs) {
        window.timeController.currentDate = new Date(state.epochMs);
        window.timeController.updateUI(true);
      }
    }

    // Hide 2D Canvas & 2D Tooltip
    // if (typeof animationFrameId !== 'undefined' && animationFrameId) {
    //   cancelAnimationFrame(animationFrameId);
    //   animationFrameId = null;
    // }
    document.getElementById('observatory-canvas')?.classList.add('hidden');
    const hud2D = document.getElementById('orbit-hover-hud');
    if (hud2D) hud2D.style.setProperty('display', 'none', 'important');

    // Reveal 3D WebGL Canvas
    document.getElementById('webgl-container')?.classList.remove('hidden');
    document.getElementById('taskbar-wrapper')?.classList.remove('hidden');

    if (typeof state !== 'undefined' && state.epochMs) currentSimTime = new Date(state.epochMs);

    document.getElementById('helios-scale-controls')?.classList.add('hidden');
    document.getElementById('macro-zoom-controls')?.classList.add('hidden');

    // Wake 3D Scene
    if (typeof window.wakeGlobe === 'function') {
      window.wakeGlobe(planetName);
    } else {
      if (typeof controls !== 'undefined' && controls) controls.enabled = true;
      if (typeof window.setPlanet === 'function') window.setPlanet(planetName, true);
      this.startThreeLoop();
    }

    // Set panel target to the current 3D planet immediately
    if (typeof window.updateEphemerisPanel === 'function') {
      window.updateEphemerisPanel(planetName);
    }

    setTimeout(() => { this.isTransitioning = false; }, 300);

  },

  returnToSystemView() {
    if (this.isTransitioning || this.mode === 'SYSTEM_VIEW') return;
    this.isTransitioning = true;
    this.mode = 'SYSTEM_VIEW';

    const toggleBtn = document.getElementById('btn-view-toggle');
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-cube"></i> Enter 3d Inspector';

    if (typeof window.sleepGlobe === 'function') window.sleepGlobe();
    this.stopThreeLoop();
    if (typeof controls !== 'undefined' && controls) controls.enabled = false;

    document.getElementById('webgl-container')?.classList.add('hidden');
    document.getElementById('taskbar-wrapper')?.classList.add('hidden');
    document.getElementById('observatory-canvas')?.classList.remove('hidden');

    // Release the hard-lock on the 2D tooltip
    const hud2D = document.getElementById('orbit-hover-hud');
    if (hud2D) hud2D.style.removeProperty('display');

    if (window.timeController && typeof state !== 'undefined') {
      state.epochMs = window.timeController.currentDate.getTime();
      window.timeController.setTargetPlanet('earth');
    }

    document.getElementById('helios-scale-controls')?.classList.remove('hidden');
    document.getElementById('macro-zoom-controls')?.classList.remove('hidden');
    document.getElementById('moon-dock-container')?.classList.add('hidden');

    if (typeof render === 'function') {
      lastRenderTime = performance.now();
      animationFrameId = requestAnimationFrame(render);
    }

    setTimeout(() => { this.isTransitioning = false; }, 250);
  },

  startThreeLoop() {
    if (this.threeAnimLoopId) return;
    const loop = (now) => {
      this.threeAnimLoopId = requestAnimationFrame(loop);
      if (typeof animate === 'function') animate(now);
    };
    this.threeAnimLoopId = requestAnimationFrame(loop);
  },

  stopThreeLoop() {
    if (this.threeAnimLoopId) {
      cancelAnimationFrame(this.threeAnimLoopId);
      this.threeAnimLoopId = null;
    }
  },

  setupUnifiedTimeline() {
    if (typeof TimeController === 'undefined') {
      console.warn("TimeController not found. Ensure timeController.js is loaded first.");
      return;
    }
    
    window.timeController = new TimeController({
      onSimulationTimeUpdate: (date) => {
        const ms = date.getTime();

        // Keep state.epochMs continuously in sync in BOTH 2D and 3D views
        if (typeof state !== 'undefined') {
          state.epochMs = ms;
        }

        if (HeliosBridge.mode === 'INSPECTOR_VIEW') {
          currentSimTime = date;
          if (typeof updateSunPosition === 'function') updateSunPosition();
        }
      },
      setPlanetRotationRatio: (planetKey, ratio) => {
        if (HeliosBridge.mode === 'INSPECTOR_VIEW' && typeof earthMesh !== 'undefined' && earthMesh) {
          earthMesh.rotation.y = ratio * Math.PI * 2;
        }
      }
    });
  },

  init() {
    window.zoomToPlanet3D = (targetId) => { this.enterInspectorView(targetId); };

    const btnToggle = document.getElementById('btn-view-toggle');
    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        if (this.mode === 'SYSTEM_VIEW') {
          const target = (typeof state !== 'undefined' && state.selectedBodyId) ? state.selectedBodyId : 'earth';
          this.enterInspectorView(target);
        } else {
          this.returnToSystemView();
        }
      });
    }

    this.stopThreeLoop();
    this.setupUnifiedTimeline();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  HeliosBridge.init();
});
