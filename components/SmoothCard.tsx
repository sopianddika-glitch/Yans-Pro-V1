import React, { useEffect, useRef, useState } from 'react';
import { smoothEngine } from '../ui/smoothEngine';
import { SparklesIcon } from './Icons';

export const SmoothCard: React.FC = () => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [stats, setStats] = useState({ fps: 0, tick: 0 });
    const lastFrameTime = useRef(performance.now());
    const frameCount = useRef(0);

    useEffect(() => {
        const unsubscribe = smoothEngine.subscribe((state, now) => {
            if (cardRef.current) {
                // Apply transforms directly to the DOM node to avoid React reconcile overhead
                cardRef.current.style.transform = `
                    translate3d(${state.x}px, ${state.y}px, 0) 
                    scale(${state.scale}) 
                    rotate(${state.rotation}deg)
                `;
                cardRef.current.style.opacity = String(state.opacity);
            }

            // Simple FPS counter for demo
            frameCount.current++;
            if (now - lastFrameTime.current >= 1000) {
                setStats({ fps: frameCount.current, tick: Math.round(now) });
                frameCount.current = 0;
                lastFrameTime.current = now;
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="relative p-8 flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="absolute top-2 left-2 text-xs font-mono text-gray-400">
                RENDER_FPS: {stats.fps}
            </div>
            
            {/* The Animated Element */}
            <div 
                ref={cardRef}
                className="w-32 h-32 bg-gradient-to-br from-brand-accent to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center text-white will-change-transform"
                data-testid="smooth-card"
            >
                <SparklesIcon className="w-12 h-12" />
            </div>
            
            <div className="absolute bottom-2 text-xs text-gray-500 text-center w-full">
                Running @ ~500Hz Logical Loop
            </div>
        </div>
    );
};