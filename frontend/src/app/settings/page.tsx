"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save } from 'lucide-react';

export default function SettingsPage() {
    const [botCount, setBotCount] = useState(4);
    const [botNames, setBotNames] = useState(['Bot_A', 'Bot_B', 'Bot_C', 'Bot_D']);

    const saveSettings = () => {
        localStorage.setItem('rag_bot_names', JSON.stringify(botNames));
        alert("Settings saved! Dashboard will update.");
    };

    const addBot = () => {
        setBotNames([...botNames, `Bot_${String.fromCharCode(65 + botNames.length)}`]);
    };

    const removeBot = (index: number) => {
        setBotNames(botNames.filter((_, i) => i !== index));
    };

    return (
        <main className="container animate-fade">
            <div style={{ marginTop: '4rem', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Engine Settings</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Configure the number of chatbots and metrics for the SxS evaluation engine.</p>

                <div className="glass" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Settings size={20} color="var(--primary)" />
                        Active Chatbots Configuration
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {botNames.map((name, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div className="glass" style={{ flex: 1, padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <input
                                        value={name}
                                        onChange={(e) => {
                                            const newNames = [...botNames];
                                            newNames[idx] = e.target.value;
                                            setBotNames(newNames);
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, width: '100%', outline: 'none' }}
                                    />
                                </div>
                                <button
                                    onClick={() => removeBot(idx)}
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer' }}>
                                    <Trash2 size={18} color="var(--danger)" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={addBot}
                            style={{ flex: 1, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', padding: '1rem', borderRadius: '12px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> ADD NEW BOT
                        </button>
                        <button
                            onClick={saveSettings}
                            style={{ flex: 1, background: 'var(--primary)', border: 'none', padding: '1rem', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Save size={18} /> SAVE CONFIGURATION
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
