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
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📈 การลงทุน</h1>
                    <p className="page-subtitle">จัดการทรัพย์สินและพอร์ตการลงทุน</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + เพิ่มการลงทุน
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>มูลค่ารวม</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '1.75rem', fontWeight: 'bold' }}>{formatCurrency(totalValueTHB)}</p>
                </div>

                {investmentsByType.slice(0, 3).map(type => (
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
                {INVESTMENT_TYPES.map(type => (
                    <button
                        key={type.value}
                        className={`filter-tab ${filter === type.value ? 'active' : ''}`}
                        onClick={() => setFilter(type.value)}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Investment List */}
            <div className="card">
                {filteredInvestments.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>ชื่อ</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>ประเภท</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>จำนวน</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>ราคาซื้อ</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>ราคาปัจจุบัน</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>มูลค่า (THB)</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>กำไร/ขาดทุน</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvestments.map(investment => {
                                    const profit = (Number(investment.current_price) - Number(investment.purchase_price)) * Number(investment.amount);
                                    const profitPercent = investment.purchase_price > 0
                                        ? ((Number(investment.current_price) - Number(investment.purchase_price)) / Number(investment.purchase_price)) * 100
                                        : 0;
                                    const typeInfo = INVESTMENT_TYPES.find(t => t.value === investment.type);

                                    return (
                                        <tr key={investment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px' }}>
                                                <strong>{investment.name}</strong>
                                                {investment.notes && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{investment.notes}</p>}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ background: typeInfo?.color, color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                    {typeInfo?.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{Number(investment.amount).toLocaleString()}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(Number(investment.purchase_price), investment.currency)}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(Number(investment.current_price), investment.currency)}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(Number(investment.value_thb))}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: profit >= 0 ? '#22c55e' : '#ef4444' }}>
                                                {profit >= 0 ? '+' : ''}{formatCurrency(profit, investment.currency)}
                                                <br />
                                                <span style={{ fontSize: '0.8rem' }}>({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%)</span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <button className="btn btn-secondary" style={{ marginRight: '8px', padding: '6px 12px' }} onClick={() => openEdit(investment)}>✏️</button>
                                                <button className="btn btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(investment.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
