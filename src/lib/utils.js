import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function isEmailValid(email) {
    if (!email || typeof email !== 'string') return false
    const trimmed = email.trim()
    return trimmed.length > 3 && trimmed.includes('@') && trimmed.includes('.')
}

export function isPhoneValid(phone) {
    if (!phone || typeof phone !== 'string') return false
    const cleaned = phone.replace(/[^0-9+]/g, '')
    return cleaned.length >= 5
}

export function hasCompletedEmailAndPhone(email, phone) {
    return isEmailValid(email) && isPhoneValid(phone)
}

