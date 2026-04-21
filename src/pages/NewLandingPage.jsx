import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NewLandingPage() {
    const [showContent, setShowContent] = useState(false);
    const [showCTA, setShowCTA] = useState(false);

    useEffect(() => {
        // Timeline for the cinematic sequence
        // 0s: Video starts (truck entering from left heading right)
        // 5.5s: Truck rear is passing center (the reveal moment)
        // 8s: CTA appears
        const timer1 = setTimeout(() => setShowContent(true), 5500);
        const timer2 = setTimeout(() => setShowCTA(true), 8000);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div className="font-sans bg-white min-h-screen overflow-hidden relative flex items-center justify-center">

            {/* 1. Full-Screen Cinematic Video Background */}
            <div className="fixed inset-0 z-0 bg-white">
                <video
                    src="https://cloudsplash.co.za/wp/wp-content/uploads/2026/03/Moving_Truck_Video_Generation.mp4"
                    autoPlay
                    muted
                    playsInline
                    loop={false}
                    className="w-full h-full object-cover mix-blend-multiply opacity-90"
                />
                {/* Blend overlays to mask studio lights/edges and ensure total whiteness */}
                <div className="absolute inset-x-0 top-0 h-[25%] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-[15%] bg-gradient-to-t from-white to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-[15%] bg-gradient-to-r from-white to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-[15%] bg-gradient-to-l from-white to-transparent pointer-events-none" />
            </div>

            <main className="relative z-10 w-full max-w-7xl px-4 flex flex-col items-center pt-24">

                {/* 2. Seamless Brand Reveal Container */}
                <div className="relative flex flex-col items-center w-full">

                    {/* The Logo (Revealed by the truck passing) */}
                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, filter: 'blur(30px)', x: -150 }}
                            animate={{
                                opacity: showContent ? 1 : 0,
                                filter: showContent ? 'blur(0px)' : 'blur(30px)',
                                x: showContent ? 0 : -150
                            }}
                            transition={{
                                duration: 2,
                                ease: [0.22, 1, 0.36, 1] // Custom quintic ease-out for smoother sliding
                            }}
                            className="text-center"
                        >
                            <div className="text-7xl md:text-[10rem] font-black tracking-tighter mb-8 select-none flex flex-wrap justify-center items-baseline gap-x-8">
                                <span className="text-red-600">Master</span>
                                <span className="text-slate-900">Movers</span>
                            </div>

                            <motion.h2
                                initial={{ opacity: 0, x: -50 }}
                                animate={{
                                    opacity: showContent ? 1 : 0,
                                    x: showContent ? 0 : -50
                                }}
                                transition={{ delay: 0.5, duration: 1.2 }}
                                className="text-xl md:text-5xl font-light text-slate-400 tracking-tight"
                            >
                                Start your moving journey with <span className="text-slate-900 font-medium whitespace-nowrap">Master Movers</span>
                            </motion.h2>
                        </motion.div>
                    </div>

                    {/* 3. The Call to Action (Final Reveal) */}
                    <div className="mt-28 flex flex-col items-center gap-10 relative z-20 w-full max-w-4xl">
                        <AnimatePresence>
                            {showCTA && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 60 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
                                    className="flex flex-col items-center gap-10 w-full"
                                >
                                    <Link to="/quote">
                                        <Button
                                            size="xl"
                                            className="group relative bg-red-600 hover:bg-red-700 text-white min-w-[360px] px-20 py-12 text-4xl font-black rounded-full transition-all duration-700 shadow-[0_30px_60px_rgba(220,38,38,0.25)] hover:shadow-[0_40px_80px_rgba(220,38,38,0.4)] hover:-translate-y-5 uppercase tracking-[0.2em] overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-10 w-full">
                                                <span>Start</span>
                                                <ArrowRight className="group-hover:translate-x-8 transition-transform duration-700 w-14 h-14 flex-shrink-0" />
                                            </span>
                                        </Button>
                                    </Link>


                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Subtle Cinematic Details - Now in flex flow to prevent overlap */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showCTA ? 1 : 0 }}
                        transition={{ delay: 1.5, duration: 2 }}
                        className="mt-20 flex items-center justify-center gap-20 text-slate-400 text-[14px] font-black uppercase tracking-[0.7em] select-none pointer-events-none"
                    >
                        <div className="flex items-center gap-4">
                            <Sparkles className="w-5 h-5 text-red-600/60" />
                            AI Optimized
                        </div>
                        <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
                        <div className="whitespace-nowrap">Nationwide Network</div>
                        <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
                        <div className="whitespace-nowrap">Premium Gear</div>
                    </motion.div>
                </div>
            </main>

            {/* Final Cinematic Border Overlay - Lower z-index to stay below Navbar (z-50) */}
            <div className="fixed inset-0 border-[30px] border-white pointer-events-none z-30 opacity-100" />
        </div>
    )
}
