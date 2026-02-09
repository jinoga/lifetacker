'use client';

import { useState, useEffect } from 'react';

interface Habit {
    id: number;
    name: string;
    frequency: string;
    target_count: number;
    color: string;
    completions: { completed_date: string; count: number }[];
    streak: number;
}

export default function HabitsPage() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        frequency: 'daily',
        target_count: 1,
        color: '#6366f1',
    });

    const fetchHabits = async () => {
        try {
            const res = await fetch('/api/habits');
            const data = await res.json();
            setHabits(data.habits || []);
        } catch (error) {
            console.error('Error fetching habits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHabits();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            setShowModal(false);
            setFormData({ name: '', frequency: 'daily', target_count: 1, color: '#6366f1' });
            fetchHabits();
        } catch (error) {
            console.error('Error creating habit:', error);
        }
    };

    const handleCheckIn = async (habitId: number) => {
        try {
            await fetch(`/api/habits/${habitId}/checkin`, { method: 'POST' });
            fetchHabits();
        } catch (error) {
            console.error('Error checking in:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('คุณต้องการลบ habit นี้?')) return;
        try {
            await fetch(`/api/habits/${id}`, { method: 'DELETE' });
            fetchHabits();
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    };

    const isCompletedToday = (habit: Habit) => {
        const today = new Date().toISOString().split('T')[0];
        return habit.completions?.some((c) => c.completed_date === today);
    };

    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    };

    if (loading) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h1 className="page-title">🔄 Habits</h1>
                </div>
                <div className="empty-state"><p>กำลังโหลด...</p></div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">🔄 Habits</h1>
                    <p className="page-subtitle">ติดตามนิสัยที่ดีของคุณ</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + เพิ่ม Habit
                </button>
            </div>

            {habits.length > 0 ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {habits.map((habit) => (
                        <div key={habit.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: habit.color
                                    }}></div>
                                    <h3 style={{ margin: 0, fontWeight: 600 }}>{habit.name}</h3>
                                    <span style={{
                                        background: 'var(--warning-glow)',
                                        color: 'var(--warning)',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.875rem',
                                        fontWeight: 600
                                    }}>
                                        🔥 {habit.streak} วัน
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className={`btn ${isCompletedToday(habit) ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                                        onClick={() => handleCheckIn(habit.id)}
                                        disabled={isCompletedToday(habit)}
                                    >
                                        {isCompletedToday(habit) ? '✓ ทำแล้ววันนี้' : 'Check In'}
                                    </button>
                                    <button className="btn btn-secondary btn-icon" onClick={() => handleDelete(habit.id)}>
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {/* Last 7 days */}
                            <div className="habit-grid" style={{ gridTemplateColumns: 'repeat(7, 40px)', justifyContent: 'start' }}>
                                {getLast7Days().map((date) => {
                                    const completed = habit.completions?.some((c) => c.completed_date === date);
                                    const dayName = new Date(date).toLocaleDateString('th-TH', { weekday: 'short' });
                                    return (
                                        <div
                                            key={date}
                                            className={`habit-day ${completed ? 'completed' : ''}`}
                                            title={date}
                                        >
                                            <span style={{ fontSize: '0.75rem' }}>{dayName}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🔄</div>
                    <h3>ยังไม่มี Habit</h3>
                    <p>เริ่มสร้าง Habit ที่ดีของคุณ</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">เพิ่ม Habit ใหม่</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">ชื่อ Habit *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="เช่น ออกกำลังกาย, อ่านหนังสือ"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">สี</label>
                                <input
                                    type="color"
                                    className="form-input"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    style={{ height: '50px', padding: '4px' }}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    ยกเลิก
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    เพิ่ม Habit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
