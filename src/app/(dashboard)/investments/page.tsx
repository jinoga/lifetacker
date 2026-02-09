'use client';

import { useState, useEffect } from 'react';

interface Investment {
    id: number;
    name: string;
    type: string;
    amount: number;
    currency: string;
    value_thb: number;
    purchase_price: number;
    current_price: number;
    notes: string;
    created_at: string;
}

const CURRENCIES = [
    { code: 'THB', symbol: '฿', name: 'บาท' },
    { code: 'USD', symbol: '$', name: 'ดอลลาร์สหรัฐ' },
    { code: 'EUR', symbol: '€', name: 'ยูโร' },
    { code: 'GBP', symbol: '£', name: 'ปอนด์' },
    { code: 'JPY', symbol: '¥', name: 'เยน' },
    { code: 'CNY', symbol: '¥', name: 'หยวน' },
    { code: 'KRW', symbol: '₩', name: 'วอน' },
    { code: 'BTC', symbol: '₿', name: 'Bitcoin' },
    { code: 'ETH', symbol: 'Ξ', name: 'Ethereum' },
];

const INVESTMENT_TYPES = [
    { value: 'stock', label: '📈 หุ้น', color: '#22c55e' },
    { value: 'crypto', label: '🪙 Crypto', color: '#f59e0b' },
    { value: 'gold', label: '🥇 ทองคำ', color: '#eab308' },
    { value: 'realestate', label: '🏠 อสังหาริมทรัพย์', color: '#8b5cf6' },
    { value: 'fund', label: '💼 กองทุน', color: '#3b82f6' },
    { value: 'bond', label: '📜 พันธบัตร', color: '#6366f1' },
    { value: 'savings', label: '🏦 เงินฝาก', color: '#14b8a6' },
    { value: 'other', label: '📦 อื่นๆ', color: '#64748b' },
];

// Approximate exchange rates (in production, fetch from API)
const EXCHANGE_RATES: Record<string, number> = {
    THB: 1,
    USD: 35.5,
    EUR: 38.5,
    GBP: 45.0,
    JPY: 0.24,
    CNY: 4.9,
    KRW: 0.027,
    BTC: 1500000,
    ETH: 100000,
};

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
    const [filter, setFilter] = useState('all');

    const [formData, setFormData] = useState({
        name: '',
        type: 'stock',
        amount: '',
        currency: 'THB',
        purchase_price: '',
        current_price: '',
        notes: '',
    });

    useEffect(() => {
        fetchInvestments();
    }, []);

    const fetchInvestments = async () => {
        try {
            const res = await fetch('/api/investments');
            const data = await res.json();
            setInvestments(data.investments || []);
        } catch (error) {
            console.error('Error fetching investments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amount = parseFloat(formData.amount);
        const currentPrice = parseFloat(formData.current_price) || 0;
        const exchangeRate = EXCHANGE_RATES[formData.currency] || 1;
        const valueTHB = amount * currentPrice * exchangeRate;

        const payload = {
            ...formData,
            amount,
            purchase_price: parseFloat(formData.purchase_price) || 0,
            current_price: currentPrice,
            value_thb: valueTHB,
        };

        try {
            if (editingInvestment) {
                await fetch(`/api/investments/${editingInvestment.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                await fetch('/api/investments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            resetForm();
            fetchInvestments();
        } catch (error) {
            console.error('Error saving investment:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ต้องการลบการลงทุนนี้?')) return;

        try {
            await fetch(`/api/investments/${id}`, { method: 'DELETE' });
            fetchInvestments();
        } catch (error) {
            console.error('Error deleting investment:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'stock',
            amount: '',
            currency: 'THB',
            purchase_price: '',
            current_price: '',
            notes: '',
        });
        setEditingInvestment(null);
        setShowModal(false);
    };

    const openEdit = (investment: Investment) => {
        setEditingInvestment(investment);
        setFormData({
            name: investment.name,
            type: investment.type,
            amount: investment.amount.toString(),
            currency: investment.currency,
            purchase_price: investment.purchase_price.toString(),
            current_price: investment.current_price.toString(),
            notes: investment.notes || '',
        });
        setShowModal(true);
    };

    const formatCurrency = (amount: number, currency: string = 'THB') => {
        const curr = CURRENCIES.find(c => c.code === currency);
        if (currency === 'THB') {
            return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
        }
        return `${curr?.symbol || ''}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const filteredInvestments = filter === 'all'
        ? investments
        : investments.filter(i => i.type === filter);

    // Calculate totals
    const totalValueTHB = investments.reduce((sum, i) => sum + Number(i.value_thb), 0);
    const investmentsByType = INVESTMENT_TYPES.map(type => ({
        ...type,
        total: investments.filter(i => i.type === type.value).reduce((sum, i) => sum + Number(i.value_thb), 0),
        count: investments.filter(i => i.type === type.value).length,
    })).filter(t => t.count > 0);

    if (loading) {
        return <div className="fade-in"><p>Loading...</p></div>;
    }

    return (
        <div className="fade-in" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <div className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.5rem' }}>📈 การลงทุน</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>จัดการทรัพย์สินและพอร์ตการลงทุน</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ width: '100%' }}>
                    + เพิ่มการลงทุน
                </button>
            </div>

            {/* Summary - 1 main card */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>💎 มูลค่ารวมทั้งหมด</h3>
                <p style={{ margin: '8px 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(totalValueTHB)}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {investmentsByType.slice(0, 3).map(type => (
                        <span key={type.value} style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                            {type.label.split(' ')[0]} {formatCurrency(type.total)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Filter - horizontal scroll */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', WebkitOverflowScrolling: 'touch' }}>
                <button
                    onClick={() => setFilter('all')}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: filter === 'all' ? 'var(--primary)' : 'var(--bg-card)',
                        color: filter === 'all' ? 'white' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}
                >
                    ทั้งหมด
                </button>
                {INVESTMENT_TYPES.map(type => (
                    <button
                        key={type.value}
                        onClick={() => setFilter(type.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: filter === type.value ? type.color : 'var(--bg-card)',
                            color: 'white',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            flexShrink: 0
                        }}
                    >
                        {type.label.split(' ')[0]}
                    </button>
                ))}
            </div>

            {/* Investment List - Card Layout */}
            <div className="card">
                {filteredInvestments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredInvestments.map(investment => {
                            const profit = (Number(investment.current_price) - Number(investment.purchase_price)) * Number(investment.amount);
                            const profitPercent = investment.purchase_price > 0
                                ? ((Number(investment.current_price) - Number(investment.purchase_price)) / Number(investment.purchase_price)) * 100
                                : 0;
                            const typeInfo = INVESTMENT_TYPES.find(t => t.value === investment.type);
                            const isProfit = profit >= 0;

                            return (
                                <div key={investment.id} style={{
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    border: '1px solid var(--border)'
                                }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', wordBreak: 'break-word' }}>{investment.name}</h4>
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
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                                {formatCurrency(Number(investment.value_thb))}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: isProfit ? '#22c55e' : '#ef4444' }}>
                                                {isProfit ? '▲' : '▼'} {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px', flexWrap: 'wrap' }}>
                                        <span>📊 {Number(investment.amount).toLocaleString()} หน่วย</span>
                                        <span>💰 ซื้อ {formatCurrency(Number(investment.purchase_price), investment.currency)}</span>
                                        <span style={{ color: isProfit ? '#22c55e' : '#ef4444' }}>
                                            {isProfit ? '📈' : '📉'} {isProfit ? '+' : ''}{formatCurrency(profit, investment.currency)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                                            onClick={() => openEdit(investment)}
                                        >
                                            ✏️ แก้ไข
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            style={{ width: '44px', padding: '10px' }}
                                            onClick={() => handleDelete(investment.id)}
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
                        <div className="empty-state-icon">📈</div>
                        <h3>ยังไม่มีการลงทุน</h3>
                        <p>เริ่มเพิ่มการลงทุนแรกของคุณ</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => resetForm()}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingInvestment ? 'แก้ไขการลงทุน' : 'เพิ่มการลงทุน'}</h2>
                            <button className="modal-close" onClick={() => resetForm()}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>ชื่อการลงทุน</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="เช่น หุ้น PTT, Bitcoin, ทองคำ 1 บาท"
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
                                        {INVESTMENT_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>สกุลเงิน</label>
                                    <select
                                        className="form-input"
                                        value={formData.currency}
                                        onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                    >
                                        {CURRENCIES.map(curr => (
                                            <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>จำนวน/หน่วย</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="100"
                                        step="any"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ราคาซื้อ/หน่วย</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.purchase_price}
                                        onChange={e => setFormData({ ...formData, purchase_price: e.target.value })}
                                        placeholder="100.00"
                                        step="any"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ราคาปัจจุบัน/หน่วย</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.current_price}
                                        onChange={e => setFormData({ ...formData, current_price: e.target.value })}
                                        placeholder="120.00"
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
                                <button type="submit" className="btn btn-primary">{editingInvestment ? 'บันทึก' : 'เพิ่ม'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
