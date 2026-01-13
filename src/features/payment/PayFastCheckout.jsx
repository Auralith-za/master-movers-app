import React, { useRef } from 'react'
import Button from '../../components/ui/Button'

export default function PayFastCheckout({ quote, onSuccess, onIndexChange }) {
    const formRef = useRef(null)

    // PayFast Sandbox Details
    // Merchant ID: 10000100
    // Merchant Key: 46f0cd694581a

    // In production these would come from env vars
    const merchantId = '10000100'
    const merchantKey = '46f0cd694581a'

    // URLs
    const baseUrl = window.location.origin
    const returnUrl = `${baseUrl}/payment/success`
    const cancelUrl = `${baseUrl}/payment/cancel`
    const notifyUrl = 'https://your-project.functions.supabase.co/payfast-itn' // Placeholder

    const handlePayClick = (e) => {
        // Check if we strictly need to save first? 
        // Ideally checking out implies the quote is saved. 
        // The parent component handles the saving to Supabase before rendering this or triggering this.
        formRef.current.submit()
    }

    return (
        <div className="w-full">
            {/* Hidden PayFast Form */}
            <form ref={formRef} action="https://sandbox.payfast.co.za/eng/process" method="POST">
                <input type="hidden" name="merchant_id" value={merchantId} />
                <input type="hidden" name="merchant_key" value={merchantKey} />
                <input type="hidden" name="return_url" value={returnUrl} />
                <input type="hidden" name="cancel_url" value={cancelUrl} />
                <input type="hidden" name="notify_url" value={notifyUrl} />

                {/* Transaction Details */}
                <input type="hidden" name="m_payment_id" value={quote.id || 'TEST-ID'} />
                <input type="hidden" name="amount" value={quote.total_price} />
                <input type="hidden" name="item_name" value={`Move: ${quote.pickup_address} to ${quote.dropoff_address}`} />

                {/* Client Details (Optional but good for pre-populating) */}
                <input type="hidden" name="name_first" value={quote.client_name?.split(' ')[0]} />
                <input type="hidden" name="email_address" value={quote.client_email} />
            </form>

            <Button
                variant="primary"
                size="xl"
                className="w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all text-lg"
                onClick={handlePayClick}
            >
                Pay Now (R {quote.total_price})
            </Button>

            <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Secure Payment via PayFast
            </p>
        </div>
    )
}
