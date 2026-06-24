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
    const onChangeRef = useRef(onChange)
    const [isScriptLoaded, setIsScriptLoaded] = useState(false)
    const [scriptError, setScriptError] = useState(null)

    // Keep the ref up to date with the latest onChange without triggering re-init
    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    // Load GMaps Script on mount
    useEffect(() => {
        loadGoogleMapsScript()
            .then(() => setIsScriptLoaded(true))
            .catch((err) => {
                console.error("Failed to load Google Maps script", err)
                setScriptError("Failed to load address suggestions")
            })
    }, [])

    // Initialize Autocomplete once script is loaded — only runs ONCE
    useEffect(() => {
        if (!isScriptLoaded || !inputRef.current || !window.google) return

        // Prevent double init
        if (autocompleteRef.current) return

        const options = {
            componentRestrictions: { country: "za" }, // Restrict to South Africa
            fields: ["formatted_address", "geometry", "name", "address_components", "place_id"],
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            options
        )

        autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current.getPlace()

            // Only process if user selected a prediction (has formatted_address)
            if (!place || !place.formatted_address) return;

            // Extract the best city name from address_components
            // Priority: locality → sublocality → administrative_area_level_2 → administrative_area_level_1
            let city = "";
            if (place.address_components) {
                const locality = place.address_components.find(c =>
                    c.types.includes("locality")
                ) || place.address_components.find(c =>
                    c.types.includes("sublocality_level_1") ||
                    c.types.includes("sublocality")
                ) || place.address_components.find(c =>
                    c.types.includes("administrative_area_level_2")
                ) || place.address_components.find(c =>
                    c.types.includes("administrative_area_level_1")
                );
                if (locality) city = locality.long_name;
            }

            // Extract precise lat/lng and place_id for Distance Matrix API calls
            let latLng = null;
            const placeId = place.place_id || null;
            if (place.geometry && place.geometry.location) {
                latLng = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
            }

            // Build the event object — mimics a standard input change event
            // but includes Google Places metadata for accurate distance calculation
            const event = {
                target: {
                    name: name,
                    value: place.formatted_address,
                    city: city,
                    isGoogleSelect: true,
                    placeId: placeId,
                    latLng: latLng,
                    addressComponents: place.address_components || null
                }
            };
            // Use the ref so we always call the latest onChange without re-registering the listener
            onChangeRef.current(event);
        })

        // Cleanup not strictly necessary for single page simple implementations but good practice
        // Google Maps instances are tricky to cleanup fully without memory leaks, but removing listener is good.
    }, [isScriptLoaded]) // ← removed `name` and `onChange` from deps to prevent re-registration on every keystroke

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
