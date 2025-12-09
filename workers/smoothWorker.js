self.onmessage = () => {};
const hz = 500;
let t_sim = 0;

function tick(){
  const now = performance.now();
  t_sim += 0.005;
  
  // Physics state for SmoothCard
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