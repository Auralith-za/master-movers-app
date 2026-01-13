import React from 'react'
import { motion } from 'framer-motion'

export default function TruckVisual({ volumeMp, fillPercent }) {
    return (
        <div className="relative w-full aspect-[2/1] bg-slate-800 rounded-lg p-4 flex items-center justify-center">
            {/* SVG Illustration of a Truck */}
            <svg
                viewBox="0 0 200 100"
                className="w-full h-full drop-shadow-xl"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Truck Cabin */}
                <path
                    d="M140,20 L140,70 L170,70 L170,50 L160,20 Z"
                    fill="#334155" // Slate-700
                    stroke="#94a3b8" // Slate-400
                    strokeWidth="2"
                />

                {/* Truck Wheels */}
                <circle cx="40" cy="80" r="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <circle cx="60" cy="80" r="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <circle cx="150" cy="80" r="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />

                {/* Cargo Container (The part that fills) */}
                <g transform="translate(10, 10)">
                    {/* Container Outline */}
                    <rect
                        x="0"
                        y="0"
                        width="120"
                        height="60"
                        rx="2"
                        className="fill-slate-900 stroke-slate-400"
                        strokeWidth="2"
                    />

                    {/* Mask for fill animation */}
                    <defs>
                        <mask id="fillMask">
                            <rect
                                x="0"
                                y="0"
                                width="120"
                                height="60"
                                rx="2"
                                fill="white"
                            />
                        </mask>
                        <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="10" style={{ stroke: '#e11d48', strokeWidth: 5 }} />
                        </pattern>
                    </defs>

                    {/* Fill Rect (Animated) */}
                    <motion.rect
                        x="0"
                        y="0"
                        width="120"
                        height="60"
                        fill="url(#diagonalHatch)" // Red diagonal stripes
                        mask="url(#fillMask)"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(fillPercent, 100) * 1.2}` }} // Scale to 120 width
                        transition={{ type: "spring", stiffness: 60, damping: 20 }}
                    />

                    {/* Fill Percentage Text Overlay */}
                    <text
                        x="60"
                        y="35"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-bold text-sm tracking-widest drop-shadow-md"
                        style={{ fontSize: '12px' }}
                    >
                        {Math.round(fillPercent)}% FILLED
                    </text>
                </g>
            </svg>
        </div>
    )
}
