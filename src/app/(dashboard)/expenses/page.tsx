'use client';

import { useState, useEffect } from 'react';

interface Expense {
    id: number;
    title: string;
    amount: number;
    category: string;
    date: string;
    notes: string;
}

const categories = [
    { value: 'food', label: '🍔 อาหาร', color: '#f59e0b' },
    { value: 'transport', label: '🚗 เดินทาง', color: '#3b82f6' },
    { value: 'shopping', label: '🛍️ ช็อปปิ้ง', color: '#ec4899' },
    { value: 'entertainment', label: '🎮 บันเทิง', color: '#8b5cf6' },
    { value: 'bills', label: '📄 ค่าบิล', color: '#ef4444' },
    { value: 'health', label: '💊 สุขภาพ', color: '#22c55e' },
    { value: 'other', label: '📦 อื่นๆ', color: '#6b7280' },
];

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [formData, setFormData] = useState({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0], notes: '' });

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/expenses');
            const data = await res.json();
            setExpenses(data.expenses || []);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
            });
            setShowModal(false);
            setFormData({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0], notes: '' });
            fetchExpenses();
        } catch (error) { console.error('Error:', error); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ลบรายการนี้?')) return;
        try { await fetch(`/api/expenses/${id}`, { method: 'DELETE' }); fetchExpenses(); }
        catch (error) { console.error('Error:', error); }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);

    const filteredExpenses = filter === 'all' ? expenses : expenses.filter(e => e.category === filter);
    const monthlyTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const categoryTotals = categories.map(cat => ({
        ...cat,
        total: expenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + Number(e.amount), 0)
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    if (loading) {
        return (<div className="fade-in"><div className="page-header"><h1 className="page-title">💰 Expenses</h1></div><div className="empty-state"><p>กำลังโหลด...</p></div></div>);
    }

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">💰 Expenses</h1>
                    <p className="page-subtitle">บันทึกค่าใช้จ่าย</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ เพิ่มรายจ่าย</button>
            </div>

            {/* Summary */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon danger">💸</div>
                    <div className="stat-content">
                        <h3>{formatCurrency(monthlyTotal)}</h3>
                        <p>รวมทั้งหมด</p>
                    </div>
                </div>
                {categoryTotals.slice(0, 3).map(cat => (
                    <div key={cat.value} className="stat-card">
                        <div className="stat-icon" style={{ background: `${cat.color}20`, color: cat.color }}>{cat.label.split(' ')[0]}</div>
                        <div className="stat-content">
                            <h3>{formatCurrency(cat.total)}</h3>
                            <p>{cat.label.split(' ')[1]}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('all')}>ทั้งหมด</button>
                {categories.map(cat => (
                    <button key={cat.value} className={`btn ${filter === cat.value ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter(cat.value)}>{cat.label}</button>
                ))}
            </div>

            {/* List */}
            {filteredExpenses.length > 0 ? (
                <div className="task-list">
                    {filteredExpenses.map((expense) => {
                        const cat = categories.find(c => c.value === expense.category) || categories[6];
                        return (
                            <div key={expense.id} className="task-item">
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${cat.color}20`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{cat.label.split(' ')[0]}</div>
                                <div className="task-content">
                                    <div className="task-title">{expense.title}</div>
                                    <div className="task-meta">
                                        <span>{new Date(expense.date).toLocaleDateString('th-TH')}</span>
                                        {expense.notes && <span>{expense.notes}</span>}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--danger)', marginRight: '12px' }}>{formatCurrency(expense.amount)}</div>
                                <button className="btn btn-secondary btn-icon" onClick={() => handleDelete(expense.id)}>🗑️</button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state"><div className="empty-state-icon">💰</div><h3>ยังไม่มีรายจ่าย</h3></div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">เพิ่มรายจ่าย</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label className="form-label">รายการ *</label><input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
                            <div className="form-group"><label className="form-label">จำนวนเงิน (บาท) *</label><input type="number" className="form-input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} min="0" step="0.01" required /></div>
                            <div className="form-group"><label className="form-label">หมวดหมู่</label><select className="form-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                            <div className="form-group"><label className="form-label">วันที่</label><input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">หมายเหตุ</label><input type="text" className="form-input" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
                            <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button><button type="submit" className="btn btn-primary">เพิ่มรายจ่าย</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
