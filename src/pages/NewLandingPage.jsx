import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NewLandingPage() {
    const [showContent, setShowContent] = useState(false);
    const [showCTA, setShowCTA] = useState(false);

    useEffect(() => {
        // Prevent scrolling on the landing page
        document.body.style.overflow = 'hidden';

        // Show logo content with a subtle entry fade (500ms)
        // Show the call to action button shortly after (1200ms)
        const timer1 = setTimeout(() => setShowContent(true), 500);
        const timer2 = setTimeout(() => setShowCTA(true), 1200);
        return () => {
            document.body.style.overflow = 'unset';
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div className="font-sans bg-white min-h-screen overflow-hidden relative flex items-center justify-center">

            {/* 1. Full-Screen Cinematic Video Background */}
            <div className="fixed inset-0 z-0 bg-white">
                <video
                    src="/images/untitled-design-3.mp4"
                    autoPlay
                    muted
                    playsInline
                    loop={true}
                    className="w-full h-full object-cover mix-blend-multiply opacity-90"
                />
                {/* Soft top and bottom overlays for text readability */}
                <div className="absolute inset-x-0 top-0 h-[15%] bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-[12%] bg-gradient-to-t from-white/70 to-transparent pointer-events-none" />
            </div>

            <main className="relative z-10 w-full max-w-7xl px-4 flex flex-col items-center pt-24 pb-40">

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
                            <div className="text-5xl md:text-[10rem] font-black tracking-tighter mb-4 md:mb-8 select-none flex flex-wrap justify-center items-baseline gap-x-4 md:gap-x-8">
                                <span className="text-red-600">Master</span>
                                <span className="text-slate-900">Movers</span>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                    opacity: showContent ? 1 : 0,
                                    y: showContent ? 0 : 20
                                }}
                                transition={{ delay: 0.5, duration: 1.2 }}
                                className="inline-block mt-4"
                            >
                                <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-full shadow-lg text-sm md:text-lg text-slate-700 tracking-wide font-medium">
                                    Start your moving journey with <span className="text-red-600 font-black whitespace-nowrap">Master Movers</span>
                                </span>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* 3. The Call to Action (Final Reveal) */}
                    <div className="mt-16 md:mt-28 flex flex-col items-center gap-10 relative z-20 w-full max-w-4xl">
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
                                        <button
                                            className="group relative bg-[#E31837] hover:bg-[#c4122d] text-white px-10 py-5 text-xl font-black rounded-2xl transition-all duration-300 shadow-[0_12px_24px_rgba(227,24,55,0.2)] hover:shadow-[0_16px_32px_rgba(227,24,55,0.35)] hover:-translate-y-1 flex items-center justify-center gap-4 uppercase tracking-[0.1em]"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-4 w-full">
                                                <span>Start</span>
                                                <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300 w-6 h-6 flex-shrink-0" />
                                            </span>
                                        </button>
                                    </Link>


                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </main>

        </div>
    )

}
