import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Settings, Save, AlertTriangle } from 'lucide-react';

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        pricing_active: true,
        maintenance_heading: '',
        maintenance_message: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
            if (data) {
                setSettings(data);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            // alert('Failed to load settings from Supabase.'); // Suppress if table empty initially
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({
                    id: 1,
                    pricing_active: settings.pricing_active,
                    maintenance_heading: settings.maintenance_heading,
                    maintenance_message: settings.maintenance_message,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            alert('Settings saved successfully!');
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-slate-500 font-bold">Loading Settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Settings className="text-primary-600" size={32} />
                    App Settings
                </h1>
                <p className="text-slate-500 mt-2">Manage global application configurations and emergency modes.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={20} className={settings.pricing_active ? "text-slate-300" : "text-amber-500"} />
                            Pricing Engine Mode
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Toggle the quote generation engine on or off. If disabled, users will not see prices.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                        <span className={`text-sm font-bold ${!settings.pricing_active ? 'text-amber-600' : 'text-slate-400'}`}>Disabled</span>
                        <button 
                            onClick={() => setSettings({ ...settings, pricing_active: !settings.pricing_active })}
                            className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${settings.pricing_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform transform ${settings.pricing_active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                        <span className={`text-sm font-bold ${settings.pricing_active ? 'text-emerald-600' : 'text-slate-400'}`}>Active</span>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className={`transition-opacity duration-300 ${settings.pricing_active ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div className="mb-6 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm font-medium border border-amber-100">
                            <strong>Note:</strong> The messages below will only be shown to users when the Pricing Engine is <strong>Disabled</strong>.
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Maintenance Heading</label>
                                <input 
                                    type="text"
                                    value={settings.maintenance_heading}
                                    onChange={(e) => setSettings({ ...settings, maintenance_heading: e.target.value })}
                                    placeholder="e.g. Pricing Temporarily Unavailable"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Maintenance Message</label>
                                <textarea 
                                    value={settings.maintenance_message}
                                    onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                                    placeholder="e.g. We are updating our pricing..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none font-medium text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Save size={20} />
                            )}
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
