import React from 'react'
import clsx from 'clsx'

export function Input({ label, error, className, ...props }) {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
            <input
                className={clsx(
                    "w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2 px-3 border",
                    error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "",
                    className
                )}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    )
}

export default Input
