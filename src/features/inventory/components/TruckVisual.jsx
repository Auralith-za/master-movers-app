import React from 'react'
import { motion } from 'framer-motion'

export default function TruckVisual({ fillPercent }) {
    // Ensure it's between 0 and 100
    const percent = Math.min(Math.max(fillPercent, 0), 100)

    return (
        <div className="relative w-full aspect-[2/1] bg-slate-900 rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-white/5 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]">
            <svg
                viewBox="0 0 240 120"
                className="w-full h-full drop-shadow-2xl"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Patterns & Gradients */}
                <defs>
                    <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="8" style={{ stroke: '#be123c', strokeWidth: 3, opacity: 0.4 }} />
                    </pattern>
                    <linearGradient id="truckFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#9f1239" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="cabinGlass" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#7dd3fc" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                </defs>

                {/* Ground/Road */}
                <line x1="10" y1="105" x2="230" y2="105" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="108" x2="220" y2="108" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />

                {/* Truck Cabin (Front Section) */}
                <g className="cabin">
                    {/* Cabin Base */}
                    <path 
                        d="M175,35 L210,35 C218,35 222,39 222,46 L222,90 L175,90 Z" 
                        fill="#0f172a" 
                        stroke="#334155" 
                        strokeWidth="1.5"
                    />
                    {/* Window Glass */}
                    <path 
                        d="M185,42 L212,42 C214,42 215,43 215,45 L215,65 L185,65 Z" 
                        fill="url(#cabinGlass)" 
                        fillOpacity="0.15"
                    />
                    {/* Detail: Door Handle */}
                    <rect x="180" y="68" width="6" height="2" rx="0.5" fill="#475569" />
                    {/* Detail: Bumper */}
                    <rect x="215" y="82" width="12" height="6" rx="2" fill="#1e293b" />
                    {/* Detail: Headlight */}
                    <circle cx="218" cy="74" r="3.5" fill="#fef08a" fillOpacity="0.8" filter="url(#glow)" />
                    {/* Detail: Mirror */}
                    <path d="M175,45 L170,45 L170,55 L175,55" fill="none" stroke="#334155" strokeWidth="1.5" />
                </g>

                {/* Cargo Hold (Container) */}
                <g className="cargo">
                    {/* Container Exterior Shell */}
                    <rect 
                        x="15" y="25" width="165" height="70" rx="4" 
                        fill="#020617" 
                        stroke="#334155" 
                        strokeWidth="2.5" 
                    />
                    
                    {/* Container Interior / Fill Boundary */}
                    <rect x="20" y="30" width="155" height="60" rx="2" fill="#0f172a" />

                    {/* DYNAMIC FILL ANIMATION */}
                    <motion.g
                        initial={{ clipPath: 'inset(0 100% 0 0)' }}
                        animate={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
                        transition={{ duration: 1.8, ease: "circOut" }}
                    >
                        {/* The "Liquid" Fill Gradient */}
                        <rect x="20" y="30" width="155" height="60" rx="2" fill="url(#truckFill)" />
                        
                        {/* Diagonal Texture (As seen in requested screenshot) */}
                        <rect x="20" y="30" width="155" height="60" rx="2" fill="url(#diagonalHatch)" />
                        
                        {/* Top Edge Highlight for depth */}
                        <rect x="20" y="30" width="155" height="4" rx="1" fill="white" fillOpacity="0.15" />
                    </motion.g>

                    {/* Realistic Detailing: Container Structural Ribs */}
                    {[40, 65, 90, 115, 140].map(x => (
                        <line key={x} x1={x} y1="25" x2={x} y2="95" stroke="#0f172a" strokeWidth="1.5" strokeOpacity="0.4" />
                    ))}
                    
                    {/* Logo/Brand Text on Truck (Subtle) */}
                    <text x="97" y="60" textAnchor="middle" fill="white" fillOpacity="0.05" className="text-[8px] font-black uppercase tracking-widest italic">MasterMovers</text>
                </g>

                {/* Wheels & Suspension Detailing */}
                <g className="wheels">
                    {/* Front Wheel */}
                    <g transform="translate(200, 95)">
                        <circle r="11" fill="#020617" stroke="#1e293b" strokeWidth="2.5" />
                        <circle r="5" fill="#1e293b" />
                        <circle r="2" fill="#334155" />
                    </g>
                    
                    {/* Rear Tandem Wheels */}
                    <g transform="translate(45, 95)">
                        <circle r="11" fill="#020617" stroke="#1e293b" strokeWidth="2.5" />
                        <circle r="5" fill="#1e293b" />
                        <circle r="2" fill="#334155" />
                    </g>
                    <g transform="translate(72, 95)">
                        <circle r="11" fill="#020617" stroke="#1e293b" strokeWidth="2.5" />
                        <circle r="5" fill="#1e293b" />
                        <circle r="2" fill="#334155" />
                    </g>
                    
                    {/* Extra Middle Support Wheel for large trucks */}
                    <g transform="translate(140, 95)">
                        <circle r="11" fill="#020617" stroke="#1e293b" strokeWidth="2.5" />
                        <circle r="5" fill="#1e293b" />
                        <circle r="2" fill="#334155" />
                    </g>
                </g>
            </svg>

            {/* Premium Percentage Badge */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-6 right-8 flex flex-col items-end"
            >
                <div className="bg-white shadow-[0_10px_40px_rgba(227,24,55,0.2)] border-2 border-slate-100 p-2 rounded-2xl flex flex-col items-center min-w-[70px] group transition-transform hover:scale-105">
                    <span className="text-[16px] font-black text-slate-900 leading-none">
                        {Math.round(percent)}%
                    </span>
                    <div className="h-0.5 w-8 bg-red-600 my-1 rounded-full opacity-50" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Filled</span>
                </div>
            </motion.div>
        </div>
    )
}
