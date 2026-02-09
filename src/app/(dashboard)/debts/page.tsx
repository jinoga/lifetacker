'use client';

import { useState, useEffect } from 'react';

interface Debt {
    id: number;
    name: string;
    type: string;
    total_amount: number;
    remaining_amount: number;
    monthly_payment: number;
    interest_rate: number;
    due_date: number;
    notes: string;
    created_at: string;
}

interface Payment {
    id: number;
    debt_id: number;
    amount: number;
    payment_date: string;
    notes: string;
}

const DEBT_TYPES = [
    { value: 'credit_card', label: '💳 บัตรเครดิต', color: '#ef4444' },
    { value: 'installment', label: '📦 ผ่อนสินค้า', color: '#f59e0b' },
    { value: 'car_loan', label: '🚗 ผ่อนรถ', color: '#3b82f6' },
    { value: 'home_loan', label: '🏠 ผ่อนบ้าน', color: '#8b5cf6' },
    { value: 'personal_loan', label: '💵 สินเชื่อส่วนบุคคล', color: '#ec4899' },
    { value: 'other', label: '📋 อื่นๆ', color: '#64748b' },
];

export default function DebtsPage() {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
    const [filter, setFilter] = useState('all');

    const [formData, setFormData] = useState({
        name: '',
        type: 'credit_card',
        total_amount: '',
        remaining_amount: '',
        monthly_payment: '',
        interest_rate: '',
        due_date: '25',
        notes: '',
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    useEffect(() => {
        fetchDebts();
    }, []);

    const fetchDebts = async () => {
        try {
            const res = await fetch('/api/debts');
            const data = await res.json();
            setDebts(data.debts || []);
        } catch (error) {
            console.error('Error fetching debts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPayments = async (debtId: number) => {
        try {
            const res = await fetch(`/api/debts/${debtId}/payments`);
            const data = await res.json();
            setPayments(data.payments || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            total_amount: parseFloat(formData.total_amount) || 0,
            remaining_amount: parseFloat(formData.remaining_amount) || parseFloat(formData.total_amount) || 0,
            monthly_payment: parseFloat(formData.monthly_payment) || 0,
            interest_rate: parseFloat(formData.interest_rate) || 0,
            due_date: parseInt(formData.due_date) || 25,
        };

        try {
            if (editingDebt) {
                await fetch(`/api/debts/${editingDebt.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                await fetch('/api/debts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            resetForm();
            fetchDebts();
        } catch (error) {
            console.error('Error saving debt:', error);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDebtId) return;

        try {
            await fetch(`/api/debts/${selectedDebtId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(paymentForm.amount),
                    payment_date: paymentForm.payment_date,
                    notes: paymentForm.notes,
                }),
            });

            setShowPaymentModal(false);
            setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
            fetchDebts();
            if (selectedDebtId) fetchPayments(selectedDebtId);
        } catch (error) {
            console.error('Error recording payment:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ต้องการลบหนี้นี้?')) return;

        try {
            await fetch(`/api/debts/${id}`, { method: 'DELETE' });
            fetchDebts();
        } catch (error) {
            console.error('Error deleting debt:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'credit_card',
            total_amount: '',
            remaining_amount: '',
            monthly_payment: '',
            interest_rate: '',
            due_date: '25',
            notes: '',
        });
        setEditingDebt(null);
        setShowModal(false);
    };

    const openEdit = (debt: Debt) => {
        setEditingDebt(debt);
        setFormData({
            name: debt.name,
            type: debt.type,
            total_amount: debt.total_amount.toString(),
            remaining_amount: debt.remaining_amount.toString(),
            monthly_payment: debt.monthly_payment.toString(),
            interest_rate: debt.interest_rate.toString(),
            due_date: debt.due_date.toString(),
            notes: debt.notes || '',
        });
        setShowModal(true);
    };

    const openPaymentModal = (debtId: number) => {
        setSelectedDebtId(debtId);
        fetchPayments(debtId);
        setShowPaymentModal(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
    };

    const filteredDebts = filter === 'all'
        ? debts
        : debts.filter(d => d.type === filter);

    // Calculate totals
    const totalDebt = debts.reduce((sum, d) => sum + Number(d.remaining_amount), 0);
    const totalMonthlyPayment = debts.reduce((sum, d) => sum + Number(d.monthly_payment), 0);
    const debtsByType = DEBT_TYPES.map(type => ({
        ...type,
        total: debts.filter(d => d.type === type.value).reduce((sum, d) => sum + Number(d.remaining_amount), 0),
        count: debts.filter(d => d.type === type.value).length,
    })).filter(t => t.count > 0);

    if (loading) {
        return <div className="fade-in"><p>Loading...</p></div>;
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">💳 หนี้สิน</h1>
                    <p className="page-subtitle">ติดตามหนี้บัตรเครดิตและการผ่อนชำระ</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + เพิ่มหนี้
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)', color: 'white', padding: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>หนี้คงเหลือทั้งหมด</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '1.75rem', fontWeight: 'bold' }}>{formatCurrency(totalDebt)}</p>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', padding: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>ต้องจ่ายต่อเดือน</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '1.75rem', fontWeight: 'bold' }}>{formatCurrency(totalMonthlyPayment)}</p>
                </div>

                {debtsByType.slice(0, 2).map(type => (
                    <div key={type.value} className="card" style={{ padding: '20px', borderLeft: `4px solid ${type.color}` }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{type.label}</h3>
                        <p style={{ margin: '8px 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(type.total)}</p>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{type.count} รายการ</span>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="filter-tabs" style={{ marginBottom: '20px' }}>
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    ทั้งหมด
                </button>
                {DEBT_TYPES.map(type => (
                    <button
                        key={type.value}
                        className={`filter-tab ${filter === type.value ? 'active' : ''}`}
                        onClick={() => setFilter(type.value)}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Debt List */}
            <div className="card">
                {filteredDebts.length > 0 ? (
                    <div className="debt-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredDebts.map(debt => {
                            const progress = debt.total_amount > 0
                                ? ((Number(debt.total_amount) - Number(debt.remaining_amount)) / Number(debt.total_amount)) * 100
                                : 0;
                            const typeInfo = DEBT_TYPES.find(t => t.value === debt.type);

                            return (
                                <div key={debt.id} style={{
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    border: '1px solid var(--border)'
                                }}>
                                    {/* Header: Name + Type */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', wordBreak: 'break-word' }}>{debt.name}</h4>
                                            <span style={{
                                                background: typeInfo?.color,
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                display: 'inline-block',
                                                marginTop: '4px'
                                            }}>
                                                {typeInfo?.label}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>
                                                {formatCurrency(Number(debt.remaining_amount))}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                คงเหลือ
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                            <span>ชำระแล้ว {progress.toFixed(0)}%</span>
                                            <span>ครบกำหนดวันที่ {debt.due_date}</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${progress}%`, background: '#22c55e', borderRadius: '3px' }}></div>
                                        </div>
                                    </div>

                                    {/* Info Row */}
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', flexWrap: 'wrap' }}>
                                        <span>💰 จ่าย/ด: {formatCurrency(Number(debt.monthly_payment))}</span>
                                        <span>📊 ยอดรวม: {formatCurrency(Number(debt.total_amount))}</span>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-success btn-sm"
                                            style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                                            onClick={() => openPaymentModal(debt.id)}
                                        >
                                            💵 จ่าย
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            style={{ width: '44px', padding: '10px' }}
                                            onClick={() => openEdit(debt)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            style={{ width: '44px', padding: '10px' }}
                                            onClick={() => handleDelete(debt.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">💳</div>
                        <h3>ยังไม่มีรายการหนี้</h3>
                        <p>เริ่มเพิ่มหนี้ที่ต้องติดตาม</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Debt Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => resetForm()}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingDebt ? 'แก้ไขหนี้' : 'เพิ่มหนี้'}</h2>
                            <button className="modal-close" onClick={() => resetForm()}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>ชื่อหนี้</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="เช่น บัตร KTC, ผ่อน iPhone"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>ประเภท</label>
                                    <select
                                        className="form-input"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        {DEBT_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>วันครบกำหนดชำระ</label>
                                    <select
                                        className="form-input"
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    >
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day}>วันที่ {day}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>ยอดหนี้ทั้งหมด</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.total_amount}
                                        onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                                        placeholder="50000"
                                        step="any"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ยอดคงเหลือ</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.remaining_amount}
                                        onChange={e => setFormData({ ...formData, remaining_amount: e.target.value })}
                                        placeholder="30000"
                                        step="any"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>ยอดชำระ/เดือน</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.monthly_payment}
                                        onChange={e => setFormData({ ...formData, monthly_payment: e.target.value })}
                                        placeholder="5000"
                                        step="any"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ดอกเบี้ย (%/ปี)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.interest_rate}
                                        onChange={e => setFormData({ ...formData, interest_rate: e.target.value })}
                                        placeholder="18"
                                        step="any"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>หมายเหตุ</label>
                                <textarea
                                    className="form-input"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="รายละเอียดเพิ่มเติม..."
                                    rows={2}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => resetForm()}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary">{editingDebt ? 'บันทึก' : 'เพิ่ม'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>💵 บันทึกการชำระ</h2>
                            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
                        </div>

                        {/* Payment History */}
                        {payments.length > 0 && (
                            <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                                <h4 style={{ marginBottom: '12px' }}>ประวัติการชำระ</h4>
                                {payments.map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span>{new Date(p.payment_date).toLocaleDateString('th-TH')}</span>
                                        <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{formatCurrency(Number(p.amount))}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handlePayment}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>จำนวนเงิน</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        placeholder="5000"
                                        step="any"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>วันที่ชำระ</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={paymentForm.payment_date}
                                        onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>หมายเหตุ</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={paymentForm.notes}
                                    onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    placeholder="เช่น ชำระผ่านแอป"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>ปิด</button>
                                <button type="submit" className="btn btn-success">บันทึกการชำระ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
