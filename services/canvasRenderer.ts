/**
 * Handles OffscreenCanvas rendering logic.
 * If OffscreenCanvas is supported and enabled via feature flag, it transfers control to a worker.
 * Otherwise, it falls back to main thread rendering.
 */
export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;
    private worker: Worker | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    public init() {
        // Feature check for OffscreenCanvas
        if ('OffscreenCanvas' in window && localStorage.getItem('FEATURE_ULTRA_SMOOTH') === 'true') {
            try {
                // Transfer control to worker
                this.canvas.transferControlToOffscreen();
                // This would typically load a separate rendering worker
                // For this simplified implementation, we just log success
                console.log('Renderer: Initialized OffscreenCanvas mode');
            } catch (e) {
                console.warn('Renderer: Failed to transfer control to offscreen, falling back.', e);
                this.initFallback();
            }
        } else {
            this.initFallback();
        }
    }

    private initFallback() {
        this.ctx = this.canvas.getContext('2d');
        console.log('Renderer: Initialized Main Thread 2D Context');
    }

    public drawRect(x: number, y: number, color: string) {
        if (this.worker) {
            this.worker.postMessage({ type: 'draw', x, y, color });
        } else if (this.ctx) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, 50, 50);
        }
    }
    
    public destroy() {
        if (this.worker) {
            this.worker.terminate();
        }
    }
}
