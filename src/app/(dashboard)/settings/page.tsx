'use client';

import { useState, useEffect } from 'react';

interface Settings {
    monthly_salary: number;
    salary_date: number;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        monthly_salary: 0,
        salary_date: 25,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.settings) {
                setSettings({
                    monthly_salary: Number(data.settings.monthly_salary) || 0,
                    salary_date: Number(data.settings.salary_date) || 25,
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setMessage('บันทึกสำเร็จ!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('เกิดข้อผิดพลาด');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount);
    };

    if (loading) {
        return <div className="fade-in"><p>Loading...</p></div>;
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">⚙️ ตั้งค่า</h1>
                <p className="page-subtitle">ปรับแต่งการตั้งค่าของคุณ</p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <div className="card-header">
                    <h3 className="card-title">💵 ตั้งค่าเงินเดือน</h3>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>เงินเดือนต่อเดือน (บาท)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={settings.monthly_salary || ''}
                            onChange={e => setSettings({ ...settings, monthly_salary: parseFloat(e.target.value) || 0 })}
                            placeholder="50000"
                            step="0.01"
                        />
                        {settings.monthly_salary > 0 && (
                            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                = {formatCurrency(settings.monthly_salary)}
                            </p>
                        )}
                    </div>

                    <div className="form-group">
                        <label>วันที่รับเงินเดือน</label>
                        <select
                            className="form-input"
                            value={settings.salary_date}
                            onChange={e => setSettings({ ...settings, salary_date: parseInt(e.target.value) })}
                        >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <option key={day} value={day}>วันที่ {day} ของเดือน</option>
                            ))}
                        </select>
                    </div>

                    {message && (
                        <div style={{
                            padding: '12px',
                            marginBottom: '16px',
                            borderRadius: '8px',
                            background: message === 'บันทึกสำเร็จ!' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message === 'บันทึกสำเร็จ!' ? '#22c55e' : '#ef4444',
                        }}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                        style={{ width: '100%' }}
                    >
                        {saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
                    </button>
                </form>
            </div>

            <div className="card" style={{ maxWidth: '600px', marginTop: '24px' }}>
                <div className="card-header">
                    <h3 className="card-title">ℹ️ เกี่ยวกับ Lifetacker</h3>
                </div>
                <div style={{ padding: '0 20px 20px' }}>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Lifetacker เป็นแอปพลิเคชันจัดการชีวิตส่วนตัว ช่วยติดตาม:
                    </p>
                    <ul style={{ color: 'var(--text-secondary)', lineHeight: 2 }}>
                        <li>✅ Tasks และ Todo</li>
                        <li>🔄 Habits และ Streaks</li>
                        <li>🎯 เป้าหมายระยะยาว</li>
                        <li>⏱️ การจับเวลาทำงาน</li>
                        <li>💰 ค่าใช้จ่าย</li>
                        <li>💝 Wishlist</li>
                        <li>📈 การลงทุน</li>
                    </ul>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '16px' }}>
                        Version 1.1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
