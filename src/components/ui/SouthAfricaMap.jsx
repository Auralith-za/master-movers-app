import React from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { motion } from "framer-motion";

const geoUrl = "/data/world-countries.json";

const markers = [
    { name: "Johannesburg", coordinates: [28.0473, -26.2041] },
    { name: "Cape Town", coordinates: [18.4232, -33.9249] },
    { name: "Durban", coordinates: [31.0218, -29.8587] },
    { name: "Pretoria", coordinates: [28.1881, -25.7461] },
    { name: "Port Elizabeth", coordinates: [25.6022, -33.9608] },
    { name: "Bloemfontein", coordinates: [26.2167, -29.1167] }
];

export default function SouthAfricaMap() {
    return (
        <div className="w-full h-full bg-slate-50 flex items-center justify-center relative pointer-events-none group-hover:bg-slate-100 transition-colors duration-500">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 2200,
                    center: [25.0, -29.0],
                }}
                style={{ width: "100%", height: "100%" }}
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={geo.properties.name === "South Africa" ? "#cbd5e1" : "#f1f5f9"}
                                stroke={geo.properties.name === "South Africa" ? "#ffffff" : "#e2e8f0"}
                                strokeWidth={1}
                                style={{
                                    default: { outline: "none" },
                                    hover: { fill: geo.properties.name === "South Africa" ? "#94a3b8" : "#f1f5f9", outline: "none", transition: "all 0.3s ease" },
                                    pressed: { outline: "none" },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {markers.map(({ name, coordinates }) => (
                    <Marker key={name} coordinates={coordinates}>
                        <motion.g
                            initial={{ scale: 0, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{
                                delay: Math.random() * 0.5 + 0.2,
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                            }}
                        >
                            <motion.circle
                                r={8}
                                fill="#ef4444"
                                animate={{
                                    scale: [1, 2.5, 2.5],
                                    opacity: [0.6, 0, 0]
                                }}
                                transition={{
                                    duration: 2,
                                    ease: "easeOut",
                                    repeat: Infinity,
                                }}
                            />
                            <circle r={3} fill="#dc2626" />
                            <text
                                textAnchor="middle"
                                y={14}
                                style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fill: "#1e293b", fontWeight: 700 }}
                            >
                                {name}
                            </text>
                        </motion.g>
                    </Marker>
                ))}
            </ComposableMap>
        </div>
    );
}
