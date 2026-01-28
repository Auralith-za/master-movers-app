import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Button({ children, className, variant = 'primary', size = 'md', isLoading, ...props }) {
    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus:ring-primary-500',
        secondary: 'bg-white text-slate-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500',
        ghost: 'bg-transparent text-slate-600 hover:bg-gray-100 hover:text-slate-900',
        outline: 'bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
    }
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant],
                sizes[size],
                props.className
            )}
            disabled={isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    )
}

export default Button
