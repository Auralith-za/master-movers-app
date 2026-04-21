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
                <input type="hidden" name="amount" value={Number(quote.total_price || quote.total).toFixed(2)} />
                <input type="hidden" name="item_name" value={`Move: ${quote.pickup_address} to ${quote.dropoff_address}`} />

                {/* Client Details (Optional but good for pre-populating) */}
                <input type="hidden" name="name_first" value={quote.client_name?.split(' ')[0]} />
                <input type="hidden" name="email_address" value={quote.client_email} />
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
