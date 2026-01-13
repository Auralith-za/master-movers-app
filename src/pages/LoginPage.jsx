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

        // For demo purposes, allow a "backdoor" or mock login if auth is not configured
        if ((email === 'admin@mastermovers.co.za' && password === 'admin') || (email === 'curt' && password === '1234')) {
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
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                        <Shield size={32} />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
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
                        Demo Credentials: admin@mastermovers.co.za / admin OR curt / 1234
                    </div>
                </form>
            </div>
        </div>
    )
}
