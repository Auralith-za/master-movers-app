import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * A highly creative, modern layout component for content pages (Services, Storage, About).
 * Replaces boring standard grids with bold typography, staggered scroll reveals, and asymmetrical layouts.
 */
export default function ModernPageLayout({
    heroTitle,
    heroSubtitle,
    heroImage,
    sections = [],
    ctaHeading = "Ready to Make Your Move?",
    ctaSubheading = "Experience the next generation of moving. Get an instant, accurate quote today.",
    ctaLink = "/quote",
    ctaLabel = "Start Your Quote"
}) {
    const { scrollY } = useScroll();
    // Subtle parallax for the hero image
    const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
    const opacityHero = useTransform(scrollY, [0, 500], [1, 0]);

    return (
        <div className="bg-slate-50 min-h-screen overflow-hidden selection:bg-red-500 selection:text-white">

            {/* Dynamic Hero Section */}
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-slate-950">
                <motion.div
                    style={{ y: y1, opacity: opacityHero }}
                    className="absolute inset-0 w-full h-full"
                >
                    <div className="absolute inset-0 bg-slate-950/60 z-10" />
                    <img
                        src={heroImage || "/images/hero_services.jpg"}
                        alt={heroTitle}
                        className="w-full h-full object-cover origin-center scale-105"
                    />
                </motion.div>

                <div className="relative z-20 container mx-auto px-6 lg:px-12 text-center flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                            {heroTitle}
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="mt-8 max-w-2xl"
                    >
                        <p className="text-lg md:text-2xl text-slate-300 font-medium leading-relaxed">
                            {heroSubtitle}
                        </p>
                    </motion.div>
                </div>

                {/* Decorative Element */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent z-20" />
            </section>

            {/* Asymmetrical Content Sections */}
            <section className="py-24 lg:py-40 container mx-auto px-6 lg:px-12">
                <div className="flex flex-col gap-32">
                    {sections.map((section, index) => {
                        const isEven = index % 2 === 0;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 100 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-24 items-center`}
                            >
                                {/* Text Content */}
                                <div className="flex-1 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-[2px] bg-red-600" />
                                        <span className="text-red-600 font-bold tracking-widest uppercase text-sm">
                                            {section.tag || `Feature 0${index + 1}`}
                                        </span>
                                    </div>

                                    <h2 className="text-4xl lg:text-5xl lg:leading-[1.1] font-black text-slate-900 tracking-tight">
                                        {section.title}
                                    </h2>

                                    <p className="text-lg text-slate-600 leading-relaxed font-medium">
                                        {section.description}
                                    </p>

                                    {section.features && (
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                            {section.features.map((feature, fIndex) => (
                                                <li key={fIndex} className="flex items-center gap-3 text-slate-700 font-semibold">
                                                    <div className="w-2 h-2 bg-slate-900 rounded-full" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Visual Content (Image or Icon Block) */}
                                <div className="flex-1 w-full relative">
                                    {section.customVisual ? (
                                        section.customVisual
                                    ) : section.image ? (
                                        <div className="relative rounded-3xl overflow-hidden aspect-square lg:aspect-[4/5] shadow-2xl group">
                                            <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                            <motion.img
                                                whileHover={{ scale: 1.05 }}
                                                transition={{ duration: 0.8 }}
                                                src={section.image}
                                                alt={section.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square lg:aspect-[4/5] rounded-[3rem] bg-slate-900 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden group hover:bg-red-600 transition-colors duration-500">
                                            {/* Abstract Background Pattern */}
                                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150 group-hover:scale-100 transition-transform duration-700" />

                                            {section.icon && (
                                                <div className="text-white mb-8 transform group-hover:-translate-y-2 transition-transform duration-500">
                                                    <section.icon size={80} strokeWidth={1} />
                                                </div>
                                            )}
                                            <h3 className="text-2xl font-bold text-white mb-4 z-10">{section.iconTitle || section.title}</h3>
                                            <p className="text-slate-300 group-hover:text-red-100 transition-colors duration-500 z-10">
                                                {section.iconText || "Premium service guaranteed."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Bold CTA Section */}
            <section className="relative py-32 bg-red-600 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />

                <div className="relative z-10 container mx-auto px-6 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto space-y-8"
                    >
                        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                            {ctaHeading}
                        </h2>
                        <p className="text-xl md:text-2xl font-medium text-red-100 pb-8">
                            {ctaSubheading}
                        </p>
                        <Link
                            to={ctaLink}
                            className="inline-flex items-center gap-4 bg-white text-red-600 px-10 py-5 rounded-full font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                        >
                            {ctaLabel}
                            <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </div>
            </section>

        </div>
    );
}
