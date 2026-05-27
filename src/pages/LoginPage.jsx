import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Label from '../components/ui/Label'
import { Shield } from 'lucide-react'

export default function LoginPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)

        // Individual login support for Sales Team
        const mockUsers = [
            { email: 'admin@mastermovers.co.za', pass: 'admin' },
            { email: 'curt@cloudsplash.co.za', pass: '1234' },
            { email: 'sales1@mastermovers.co.za', pass: 'sales1' },
            { email: 'sales2@mastermovers.co.za', pass: 'sales2' }
        ]

        const foundUser = mockUsers.find(u => u.email === email && u.pass === password)

        if (foundUser || (email === 'curt' && password === '1234')) {
            // Fake successful login
            setTimeout(() => {
                navigate('/admin')
            }, 1000)
            return
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                // If specific user not found but it's a dev env, maybe alert
                alert('Login failed: ' + error.message)
            } else {
                navigate('/admin')
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center flex flex-col items-center justify-center">
                    <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center justify-center">
                        <img 
                            src="/images/logo.png" 
                            alt="Master Movers Logo" 
                            className="h-14 object-contain"
                        />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900">
                        Admin Portal
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Sign in to manage quotes, fleet, and settings.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="mb-4">
                            <Label>Email address</Label>
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@mastermovers.co.za"
                            />
                        </div>
                        <div>
                            <Label>Password</Label>
                            <Input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            className="w-full justify-center"
                            isLoading={loading}
                        >
                            Sign in
                        </Button>
                    </div>

                    <div className="text-center text-xs text-slate-400">
                        Demo Credentials: admin@mastermovers.co.za / admin <br /> OR curt@cloudsplash.co.za / 1234
                    </div>

                    <div className="pt-6 border-t border-slate-100 mt-6 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Need help? Call us at any time</p>
                        <a href="tel:+27114937569" className="text-xs font-black text-slate-600 hover:text-red-600 transition-colors tracking-tight">+27 11 493 7569</a>
                    </div>
                </form>
            </div>
        </div>
    )
}
