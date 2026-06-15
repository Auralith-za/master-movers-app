import React, { useRef } from 'react'
import Button from '../../components/ui/Button'
import { md5 } from './md5'

export default function PayFastCheckout({ quote, onSuccess, onIndexChange }) {
    const formRef = useRef(null)

    // isSandbox: only true if VITE_TEST_MODE is explicitly 'true'
    const isSandbox = import.meta.env.VITE_TEST_MODE === 'true'

    // Live production credentials (from .env or hardcoded fallback)
    const merchantId = isSandbox ? '10000100' : (import.meta.env.VITE_PAYFAST_MERCHANT_ID || '17687227')
    const merchantKey = isSandbox ? '46f0cd694581a' : (import.meta.env.VITE_PAYFAST_MERCHANT_KEY || '0btdkli273lqs')
    const passphrase = isSandbox ? 'jt7NOE43FZPn' : (import.meta.env.VITE_PAYFAST_PASSPHRASE || 'Mastermovers12897yd28dhqw')

    // URLs — embed the quote ID so SuccessPage can find the DB record after redirect
    // (Zustand store is wiped when user leaves the site to PayFast)
    const baseUrl = window.location.origin
    const returnUrl = `${baseUrl}/payment/success?m_payment_id=${mPaymentId}&gateway=payfast`
    const cancelUrl = `${baseUrl}/payment/cancel?m_payment_id=${mPaymentId}`

    // Dynamically build Notify URL from Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    const notifyUrl = supabaseUrl
        ? `${supabaseUrl.replace('.supabase.co', '.functions.supabase.co')}/payfast-itn`
        : 'https://yrrskvzdpcdnwojstvcw.functions.supabase.co/payfast-itn'

    const payfastActionUrl = isSandbox
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process'

    // Form field variables
    const nameFirst = quote.client_name?.split(' ')[0] || 'Client'
    const emailAddress = quote.client_email || ''
    const mPaymentId = quote.id || 'TEST-ID'
    // Use nullish coalescing (??) not || so that a discounted total of 0 still works correctly
    const amount = Number(quote.total_price ?? quote.total ?? 0).toFixed(2)
    const itemName = `Move: ${quote.pickup_address || 'TBD'} to ${quote.dropoff_address || 'TBD'}${quote.coupon_code ? ` (Coupon: ${quote.coupon_code})` : ''}`

    // PayFast URL encoder helper (spaces to +, uppercase hex)
    // Encodes standard sub-delims (! ' ( ) *) as browsers do in form submissions.
    const pfCleanEncode = (val) => {
        if (val === undefined || val === null) return ''
        return encodeURIComponent(String(val).trim())
            .replace(/%20/g, '+')
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A')
            .replace(/%[0-9a-fA-F]{2}/g, m => m.toUpperCase())
    }

    // Build the signature string in the exact HTML Form parameter sequence:
    // 1. Merchant Details: merchant_id, merchant_key, return_url, cancel_url, notify_url
    // 2. Buyer Details: name_first, email_address
    // 3. Transaction Details: m_payment_id, amount, item_name
    const fields = [
        { name: 'merchant_id', value: merchantId },
        { name: 'merchant_key', value: merchantKey },
        { name: 'return_url', value: returnUrl },
        { name: 'cancel_url', value: cancelUrl },
        { name: 'notify_url', value: notifyUrl },
        { name: 'name_first', value: nameFirst },
        { name: 'email_address', value: emailAddress },
        { name: 'm_payment_id', value: mPaymentId },
        { name: 'amount', value: amount },
        { name: 'item_name', value: itemName }
    ]

    let sigString = fields
        .filter(f => f.value !== undefined && f.value !== null && String(f.value).trim() !== '')
        .map(f => `${f.name}=${pfCleanEncode(f.value)}`)
        .join('&')

    if (passphrase) {
        sigString += `&passphrase=${pfCleanEncode(passphrase)}`
    }

    const signature = md5(sigString)

    // Log the generated signature for easier debugging in browser console
    console.log('--- PAYFAST SIGNATURE DEBUG ---')
    console.log('Is Sandbox:', isSandbox)
    console.log('Passed Quote:', quote)
    console.log('Signature String:', sigString)
    console.log('Calculated MD5 Signature:', signature)
    console.log('--------------------------------')

    const handlePayClick = (e) => {
        formRef.current.submit()
    }

    return (
        <div className="w-full">
            {/* Hidden PayFast Form */}
            <form ref={formRef} action={payfastActionUrl} method="POST">
                {merchantId && <input type="hidden" name="merchant_id" value={merchantId} />}
                {merchantKey && <input type="hidden" name="merchant_key" value={merchantKey} />}
                {returnUrl && <input type="hidden" name="return_url" value={returnUrl} />}
                {cancelUrl && <input type="hidden" name="cancel_url" value={cancelUrl} />}
                {notifyUrl && <input type="hidden" name="notify_url" value={notifyUrl} />}

                {/* Client Details */}
                {nameFirst && <input type="hidden" name="name_first" value={nameFirst} />}
                {emailAddress && <input type="hidden" name="email_address" value={emailAddress} />}

                {/* Transaction Details */}
                {mPaymentId && <input type="hidden" name="m_payment_id" value={mPaymentId} />}
                {amount && <input type="hidden" name="amount" value={amount} />}
                {itemName && <input type="hidden" name="item_name" value={itemName} />}

                {/* Signature */}
                {signature && <input type="hidden" name="signature" value={signature} />}
            </form>

            <Button
                variant="primary"
                size="xl"
                className="w-full bg-[#E11D48] hover:bg-[#BE123C] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all text-lg font-black uppercase tracking-widest py-6"
                onClick={handlePayClick}
            >
                Pay with Card / EFT
            </Button>

            <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 opacity-60">
                    {/* PayFast Badges */}
                    <img src="https://www.payfast.co.za/images/buttons/light-small-visa.png" alt="Visa" className="h-4" />
                    <img src="https://www.payfast.co.za/images/buttons/light-small-mastercard.png" alt="Mastercard" className="h-4" />
                    <img src="https://www.payfast.co.za/images/buttons/light-small-instant-eft.png" alt="Instant EFT" className="h-4" />
                </div>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Secure Payment Gateway
                </p>
            </div>
        </div>
    )
}

