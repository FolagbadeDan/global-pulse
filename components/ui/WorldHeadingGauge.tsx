import React from 'react';
import { motion } from 'framer-motion';

interface WorldHeadingGaugeProps {
    score: number; // 0 to 100
    label?: string;
}

const WorldHeadingGauge: React.FC<WorldHeadingGaugeProps> = ({ score, label = "World Heading" }) => {
    // Map score to a color roughly
    const getColor = (s: number) => {
        if (s < 30) return '#10b981'; // Emerald
        if (s < 60) return '#3b82f6'; // Blue
        if (s < 80) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    };

    return (
        <div className="flex flex-col w-64">
            <div className="flex justify-between items-end mb-1.5 px-1">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">{label}</span>
                <span className="text-xs font-mono font-bold" style={{ color: getColor(score) }}>
                    {score.toFixed(0)} <span className="opacity-50">/ 100</span>
                </span>
            </div>

            <div className="relative h-3 w-full bg-gray-900 rounded-full border border-white/10 overflow-hidden shadow-inner">
                {/* Gradient Background */}
                <div
                    className="absolute inset-0 opacity-80"
                    style={{
                        background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ef4444 100%)'
                    }}
                />

                {/* Animated Thumb */}
                <motion.div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.5)] z-10"
                    initial={{ left: '0%' }}
                    animate={{ left: `${score}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
            </div>

            <div className="flex justify-between mt-1 px-1">
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Peace</span>
                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Volatile</span>
            </div>
        </div>
    );
};

export default WorldHeadingGauge;
