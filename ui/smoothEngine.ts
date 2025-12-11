type EngineState = {
    x: number;
    y: number;
    opacity: number;
    scale: number;
    rotation: number;
};

type Snapshot = {
    t: number;
    state: EngineState;
};

type Listener = (state: EngineState, timestamp: number) => void;

class SmoothEngine {
    private worker: Worker | null = null;
    private listeners: Set<Listener> = new Set();
    private lastSnapshot: Snapshot | null = null;
    private nextSnapshot: Snapshot | null = null;
    private rafId: number | null = null;
    private isEnabled: boolean = false;

    constructor() {
        const flag = localStorage.getItem('FEATURE_ULTRA_SMOOTH');
        this.isEnabled = flag === 'true';
        if (this.isEnabled) {
            this.start();
        }
    }

    public toggle(enabled: boolean) {
        this.isEnabled = enabled;
        localStorage.setItem('FEATURE_ULTRA_SMOOTH', String(enabled));
        if (enabled) {
            this.start();
        } else {
            this.stop();
        }
    }

    private start() {
        if (this.worker) return;

        // Robust Worker Initialization Strategy
        // 1. Try Module Import (Vite/Bundler)
        // 2. Try Public Path
        // 3. Fallback to Inline Blob
        try {
            this.worker = new Worker(new URL('../workers/smoothWorker.js', import.meta.url), { type: 'module' });
        } catch (e1) {
            try {
                this.worker = new Worker('/workers/smoothWorker.js');
            } catch (e2) {
                const blob = new Blob([`
                    self.onmessage = () => {};
                    const hz = 500;
                    let t_sim = 0;
                    function tick(){
                        const now = performance.now();
                        t_sim += 0.005;
                        const state = {
                            x: Math.sin(t_sim) * 100,
                            y: Math.cos(t_sim * 1.5) * 50,
                            rotation: Math.sin(t_sim * 0.5) * 180,
                            scale: 1 + Math.sin(t_sim * 2) * 0.1,
                            opacity: 0.8 + Math.sin(t_sim * 5) * 0.2,
                            tick: Date.now()
                        };
                        postMessage({ t: now, state });
                    }
                    setInterval(tick, Math.max(1, Math.floor(1000/hz)));
                `], { type: 'text/javascript' });
                this.worker = new Worker(URL.createObjectURL(blob));
            }
        }

        if (this.worker) {
            this.worker.onmessage = (e) => {
                const s = e.data;
                this.lastSnapshot = this.nextSnapshot || s; // Ensure lastSnapshot is init
                this.nextSnapshot = s;
            };
            this.worker.postMessage('START');
        }

        this.loop();
    }

    private stop() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    // Linear Interpolation
    private lerp(start: number, end: number, factor: number) {
        return start + (end - start) * factor;
    }

    private interpolateState(s1: EngineState, s2: EngineState, alpha: number): EngineState {
        return {
            x: this.lerp(s1.x, s2.x, alpha),
            y: this.lerp(s1.y, s2.y, alpha),
            opacity: this.lerp(s1.opacity, s2.opacity, alpha),
            scale: this.lerp(s1.scale, s2.scale, alpha),
            rotation: this.lerp(s1.rotation, s2.rotation, alpha)
        };
    }

    private loop = () => {
        if (!this.isEnabled) return;

        // "now" is essentially performance.now() passed by rAF
        // We add a small delay (e.g. 50ms) to interpolation time to ensure we always have a "next" snapshot
        // to interpolate towards (buffering).
        const renderTime = performance.now() - 50; 

        let renderState: EngineState | null = null;

        if (this.lastSnapshot && this.nextSnapshot) {
            const t0 = this.lastSnapshot.t;
            const t1 = this.nextSnapshot.t;

            // Calculate interpolation factor (0.0 to 1.0)
            if (t1 > t0) {
                const alpha = Math.max(0, Math.min(1, (renderTime - t0) / (t1 - t0)));
                renderState = this.interpolateState(this.lastSnapshot.state, this.nextSnapshot.state, alpha);
            } else {
                renderState = this.nextSnapshot.state;
            }
        } else if (this.nextSnapshot) {
             renderState = this.nextSnapshot.state;
        }

        if (renderState) {
            // Notify all components
            for (const listener of this.listeners) {
                listener(renderState, performance.now());
            }
        }

        this.rafId = requestAnimationFrame(this.loop);
    };

    public subscribe(fn: Listener): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
    
    public get status() {
        return this.isEnabled;
    }
}

// Singleton instance
export const smoothEngine = new SmoothEngine();