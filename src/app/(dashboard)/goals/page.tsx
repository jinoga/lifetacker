'use client';

import { useState, useEffect } from 'react';

interface Goal {
    id: number;
    title: string;
    description: string;
    target_value: number;
    current_value: number;
    unit: string;
    deadline: string | null;
}

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editGoal, setEditGoal] = useState<Goal | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target_value: 100,
        current_value: 0,
        unit: '%',
        deadline: '',
    });

    const fetchGoals = async () => {
        try {
            const res = await fetch('/api/goals');
            const data = await res.json();
            setGoals(data.goals || []);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGoals(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editGoal ? `/api/goals/${editGoal.id}` : '/api/goals';
            await fetch(url, {
                method: editGoal ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            setShowModal(false);
            setEditGoal(null);
            setFormData({ title: '', description: '', target_value: 100, current_value: 0, unit: '%', deadline: '' });
            fetchGoals();
        } catch (error) {
            console.error('Error saving goal:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('คุณต้องการลบเป้าหมายนี้?')) return;
        try {
            await fetch(`/api/goals/${id}`, { method: 'DELETE' });
            fetchGoals();
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const openEditModal = (goal: Goal) => {
        setEditGoal(goal);
        setFormData({
            title: goal.title,
            description: goal.description || '',
            target_value: goal.target_value,
            current_value: goal.current_value,
            unit: goal.unit,
            deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
        });
        setShowModal(true);
    };

    const updateProgress = async (goal: Goal, increment: number) => {
        const newValue = Math.max(0, Math.min(goal.target_value, goal.current_value + increment));
        try {
            await fetch(`/api/goals/${goal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...goal, current_value: newValue }),
            });
            fetchGoals();
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    if (loading) {
        return (
            <div className="fade-in">
                <div className="page-header"><h1 className="page-title">🎯 Goals</h1></div>
                <div className="empty-state"><p>กำลังโหลด...</p></div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">🎯 Goals</h1>
                    <p className="page-subtitle">ตั้งและติดตามเป้าหมายของคุณ</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ เพิ่มเป้าหมาย</button>
            </div>

            {goals.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                    {goals.map((goal) => {
                        const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
                        const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                        return (
                            <div key={goal.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <h3 style={{ margin: 0, fontWeight: 600 }}>{goal.title}</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-secondary btn-icon" onClick={() => openEditModal(goal)}>✏️</button>
                                        <button className="btn btn-secondary btn-icon" onClick={() => handleDelete(goal.id)}>🗑️</button>
                                    </div>
                                </div>

                                {goal.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>{goal.description}</p>}

                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 600, fontSize: '1.25rem' }}>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="progress-bar" style={{ height: '12px' }}>
                                        <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {daysLeft !== null && (
                                        <span style={{ color: daysLeft < 0 ? 'var(--danger)' : 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            {daysLeft < 0 ? `หมดเวลา ${Math.abs(daysLeft)} วัน` : `เหลือ ${daysLeft} วัน`}
                                        </span>
                                    )}
                                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => updateProgress(goal, -1)}>-1</button>
                                        <button className="btn btn-primary btn-sm" onClick={() => updateProgress(goal, 1)}>+1</button>
                                        <button className="btn btn-primary btn-sm" onClick={() => updateProgress(goal, 10)}>+10</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🎯</div>
                    <h3>ยังไม่มีเป้าหมาย</h3>
                    <p>เริ่มตั้งเป้าหมายแรกของคุณ</p>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editGoal ? 'แก้ไขเป้าหมาย' : 'เพิ่มเป้าหมายใหม่'}</h2>
                            <button className="modal-close" onClick={() => { setShowModal(false); setEditGoal(null); }}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">ชื่อเป้าหมาย *</label>
                                <input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">รายละเอียด</label>
                                <textarea className="form-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">เป้าหมาย</label>
                                    <input type="number" className="form-input" value={formData.target_value} onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })} min="1" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ปัจจุบัน</label>
                                    <input type="number" className="form-input" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: Number(e.target.value) })} min="0" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">หน่วย</label>
                                    <input type="text" className="form-input" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="%, ชั่วโมง, km" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">กำหนดเสร็จ</label>
                                <input type="date" className="form-input" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditGoal(null); }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary">{editGoal ? 'บันทึก' : 'เพิ่มเป้าหมาย'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
