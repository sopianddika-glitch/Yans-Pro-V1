/// <reference lib="webworker" />

// Target 500Hz logic loop (2ms per tick)
const TARGET_FPS = 500;
const TICK_RATE = 1000 / TARGET_FPS;

let lastTick = 0;
let isRunning = false;

// Simple physics state
const state = {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    rotation: 0
};

// Oscillator variables
let t = 0;

const tick = () => {
    if (!isRunning) return;

    const now = performance.now();
    const delta = now - lastTick;

    if (delta >= TICK_RATE) {
        // Update State Logic
        t += 0.005; // Increment time
        
        // Simulate complex physics or layout calculation
        state.x = Math.sin(t) * 100; // Oscillate X between -100 and 100
        state.y = Math.cos(t * 1.5) * 50; // Oscillate Y
        state.rotation = Math.sin(t * 0.5) * 180;
        state.scale = 1 + Math.sin(t * 2) * 0.1;
        state.opacity = 0.8 + Math.sin(t * 5) * 0.2;

        // Post snapshot to main thread
        // We send the current time so main thread can interpolate
        self.postMessage({ t: now, state: { ...state } });
        
        lastTick = now - (delta % TICK_RATE);
    }

    // Schedule next tick
    setTimeout(tick, 0); 
};

self.onmessage = (e) => {
    if (e.data === 'START') {
        if (!isRunning) {
            isRunning = true;
            lastTick = performance.now();
            tick();
        }
    } else if (e.data === 'STOP') {
        isRunning = false;
    }
};

export {};
