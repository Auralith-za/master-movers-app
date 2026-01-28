import React, { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsScript } from '../../services/googleMaps'
import { MapPin, Loader2 } from 'lucide-react'

export default function AddressAutocomplete({
    label,
    name,
    value,
    onChange,
    placeholder,
    required = false,
    className = ""
}) {
    const inputRef = useRef(null)
    const autocompleteRef = useRef(null)
    const [isScriptLoaded, setIsScriptLoaded] = useState(false)
    const [scriptError, setScriptError] = useState(null)

    // Load GMaps Script on mount
    useEffect(() => {
        loadGoogleMapsScript()
            .then(() => setIsScriptLoaded(true))
            .catch((err) => {
                console.error("Failed to load Google Maps script", err)
                setScriptError("Failed to load address suggestions")
            })
    }, [])

    // Initialize Autocomplete once script is loaded
    useEffect(() => {
        if (!isScriptLoaded || !inputRef.current || !window.google) return

        // Prevent double init
        if (autocompleteRef.current) return

        const options = {
            componentRestrictions: { country: "za" }, // Restrict to South Africa
            fields: ["formatted_address", "geometry", "name"],
            types: ["address"], // Only addresses
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            options
        )

        autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current.getPlace()

            // If user selects a prediction
            if (place.formatted_address) {
                // Determine the value to send back. 
                // We mainly want the string address, but could pass the Place object if needed.
                // For now, mimicking standard input event
                const event = {
                    target: {
                        name: name,
                        value: place.formatted_address
                    }
                }
                onChange(event)
            }
        })

        // Cleanup not strictly necessary for single page simple implementations but good practice
        // Google Maps instances are tricky to cleanup fully without memory leaks, but removing listener is good.
    }, [isScriptLoaded, name, onChange])

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    {scriptError ? (
                        <MapPin size={18} className="text-red-400" />
                    ) : !isScriptLoaded ? (
                        <Loader2 size={18} className="animate-spin text-primary-400" />
                    ) : (
                        <MapPin size={18} />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={!isScriptLoaded && !scriptError}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400 text-slate-900"
                    autoComplete="off" // Disable browser default autocomplete to show Google's
                />
            </div>
            {scriptError && <p className="text-xs text-red-500">{scriptError}</p>}
        </div>
    )
}
