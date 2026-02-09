'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
    // Financial
    totalInvestments: number;
    totalDebts: number;
    monthlyExpenses: number;
    monthlySalary: number;
    salaryRemaining: number;

    // Health
    weight: number;
    height: number;
    age: number;
    bmi: number;

    // Progress
    completedTasks: number;
    totalTasks: number;
    activeHabits: number;
    habitStreak: number;
    goalsProgress: number;

    // Scores
    financialScore: number;
    healthScore: number;
    productivityScore: number;
    overallScore: number;
}

interface HealthSettings {
    weight: number;
    height: number;
    birth_date: string;
    target_weight: number;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [healthSettings, setHealthSettings] = useState<HealthSettings>({
        weight: 0,
        height: 0,
        birth_date: '',
        target_weight: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showHealthModal, setShowHealthModal] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/analytics');
            const result = await res.json();
            setData(result);
            if (result.healthSettings) {
                setHealthSettings(result.healthSettings);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveHealthSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch('/api/analytics/health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(healthSettings),
            });
            setShowHealthModal(false);
            fetchAnalytics();
        } catch (error) {
            console.error('Error saving health settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#22c55e';
        if (score >= 60) return '#84cc16';
        if (score >= 40) return '#eab308';
        if (score >= 20) return '#f97316';
        return '#ef4444';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'ดีเยี่ยม';
        if (score >= 60) return 'ดี';
        if (score >= 40) return 'พอใช้';
        if (score >= 20) return 'ต้องปรับปรุง';
        return 'วิกฤต';
    };

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { label: 'น้ำหนักต่ำกว่าเกณฑ์', color: '#3b82f6' };
        if (bmi < 23) return { label: 'น้ำหนักปกติ', color: '#22c55e' };
        if (bmi < 25) return { label: 'น้ำหนักเกิน', color: '#eab308' };
        if (bmi < 30) return { label: 'อ้วน', color: '#f97316' };
        return { label: 'อ้วนมาก', color: '#ef4444' };
    };

    const getSpendingStatus = () => {
        if (!data) return { label: 'ไม่มีข้อมูล', color: '#64748b', icon: '❓' };

        const spendingRatio = data.monthlySalary > 0 ? (data.monthlyExpenses / data.monthlySalary) * 100 : 0;

        if (spendingRatio <= 50) return { label: 'ประหยัดมาก', color: '#22c55e', icon: '🌟' };
        if (spendingRatio <= 70) return { label: 'ปกติ', color: '#84cc16', icon: '✅' };
        if (spendingRatio <= 90) return { label: 'ใช้จ่ายสูง', color: '#eab308', icon: '⚠️' };
        if (spendingRatio <= 100) return { label: 'ใกล้เกินตัว', color: '#f97316', icon: '🔥' };
        return { label: 'ใช้จ่ายเกินตัว!', color: '#ef4444', icon: '🚨' };
    };

    const getDebtToAssetRatio = () => {
        if (!data) return 0;
        const totalAssets = data.totalInvestments + (data.salaryRemaining > 0 ? data.salaryRemaining : 0);
        if (totalAssets <= 0) return data.totalDebts > 0 ? 100 : 0;
        return Math.min((data.totalDebts / totalAssets) * 100, 200);
    };

    if (loading) {
        return <div className="fade-in"><p>Loading...</p></div>;
    }

    const spendingStatus = getSpendingStatus();
    const debtRatio = getDebtToAssetRatio();

    return (
        <div className="fade-in" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <div className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.5rem' }}>📊 วิเคราะห์ภาพรวมชีวิต</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>ประเมินสุขภาพ การเงิน และความสำเร็จ</p>
                </div>
                <button className="btn btn-secondary" onClick={() => setShowHealthModal(true)} style={{ width: '100%' }}>
                    ⚙️ ตั้งค่าสุขภาพ
                </button>
            </div>

            {/* Overall Score */}
            <div className="card" style={{
                background: `linear-gradient(135deg, ${getScoreColor(data?.overallScore || 0)}33 0%, ${getScoreColor(data?.overallScore || 0)}11 100%)`,
                border: `2px solid ${getScoreColor(data?.overallScore || 0)}`,
                marginBottom: '16px',
                padding: '20px',
                textAlign: 'center'
            }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>คะแนนภาพรวมชีวิต</h2>
                <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: getScoreColor(data?.overallScore || 0) }}>
                    {data?.overallScore || 0}
                </div>
                <p style={{ fontSize: '1.2rem', margin: '4px 0 0', color: getScoreColor(data?.overallScore || 0) }}>
                    {getScoreLabel(data?.overallScore || 0)}
                </p>
            </div>

            {/* Score Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                {/* Financial Score */}
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>💰 สุขภาพการเงิน</h3>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: getScoreColor(data?.financialScore || 0)
                        }}>
                            {data?.financialScore || 0}
                        </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${data?.financialScore || 0}%`,
                                background: getScoreColor(data?.financialScore || 0),
                                borderRadius: '5px'
                            }}></div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>💵 เงินเดือน</span>
                            <span style={{ fontWeight: 'bold' }}>{formatCurrency(data?.monthlySalary || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>💸 ใช้จ่ายเดือนนี้</span>
                            <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(data?.monthlyExpenses || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>📈 เงินลงทุน</span>
                            <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{formatCurrency(data?.totalInvestments || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>💳 หนี้สิน</span>
                            <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(data?.totalDebts || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Health Score */}
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>❤️ สุขภาพ</h3>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: getScoreColor(data?.healthScore || 0)
                        }}>
                            {data?.healthScore || 0}
                        </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${data?.healthScore || 0}%`,
                                background: getScoreColor(data?.healthScore || 0),
                                borderRadius: '5px'
                            }}></div>
                        </div>
                    </div>
                    {data?.weight && data?.height ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>⚖️ น้ำหนัก</span>
                                <span style={{ fontWeight: 'bold' }}>{data.weight} kg</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>📏 ส่วนสูง</span>
                                <span style={{ fontWeight: 'bold' }}>{data.height} cm</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>📊 BMI</span>
                                <span style={{ fontWeight: 'bold', color: getBMICategory(data.bmi).color }}>
                                    {data.bmi.toFixed(1)} ({getBMICategory(data.bmi).label})
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>🎂 อายุ</span>
                                <span style={{ fontWeight: 'bold' }}>{data.age} ปี</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                            <p>ยังไม่ได้ตั้งค่าข้อมูลสุขภาพ</p>
                            <button className="btn btn-primary" onClick={() => setShowHealthModal(true)}>ตั้งค่าเลย</button>
                        </div>
                    )}
                </div>

                {/* Productivity Score */}
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>🎯 ผลงาน</h3>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: getScoreColor(data?.productivityScore || 0)
                        }}>
                            {data?.productivityScore || 0}
                        </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${data?.productivityScore || 0}%`,
                                background: getScoreColor(data?.productivityScore || 0),
                                borderRadius: '5px'
                            }}></div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>✅ Tasks สำเร็จ</span>
                            <span style={{ fontWeight: 'bold' }}>{data?.completedTasks || 0} / {data?.totalTasks || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>🔄 Habits</span>
                            <span style={{ fontWeight: 'bold' }}>{data?.activeHabits || 0} รายการ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>🎯 Goals Progress</span>
                            <span style={{ fontWeight: 'bold' }}>{(data?.goalsProgress || 0).toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Spending Analysis */}
                <div className="card" style={{ padding: '24px', borderLeft: `4px solid ${spendingStatus.color}` }}>
                    <h3 style={{ margin: '0 0 16px' }}>💸 วิเคราะห์การใช้จ่าย</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '3rem' }}>{spendingStatus.icon}</span>
                        <div>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: spendingStatus.color }}>
                                {spendingStatus.label}
                            </p>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                                ใช้ไป {data?.monthlySalary ? ((data.monthlyExpenses / data.monthlySalary) * 100).toFixed(0) : 0}% ของเงินเดือน
                            </p>
                        </div>
                    </div>
                    <div style={{ background: 'var(--border)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.min((data?.monthlyExpenses || 0) / (data?.monthlySalary || 1) * 100, 100)}%`,
                            background: spendingStatus.color,
                            borderRadius: '5px'
                        }}></div>
                    </div>
                </div>

                {/* Debt to Asset Ratio */}
                <div className="card" style={{ padding: '24px', borderLeft: `4px solid ${debtRatio > 50 ? '#ef4444' : '#22c55e'}` }}>
                    <h3 style={{ margin: '0 0 16px' }}>⚖️ สัดส่วนหนี้ต่อสินทรัพย์</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '3rem' }}>{debtRatio > 100 ? '🚨' : debtRatio > 50 ? '⚠️' : '✅'}</span>
                        <div>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: debtRatio > 50 ? '#ef4444' : '#22c55e' }}>
                                {debtRatio.toFixed(0)}%
                            </p>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                                {debtRatio > 100 ? 'หนี้มากกว่าสินทรัพย์!' : debtRatio > 50 ? 'หนี้สูง' : 'อยู่ในเกณฑ์ดี'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>สินทรัพย์</p>
                            <p style={{ margin: '4px 0 0', fontWeight: 'bold', color: '#22c55e' }}>{formatCurrency(data?.totalInvestments || 0)}</p>
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>หนี้สิน</p>
                            <p style={{ margin: '4px 0 0', fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(data?.totalDebts || 0)}</p>
                        </div>
                    </div>
                </div>

                {/* Net Worth */}
                <div className="card" style={{
                    padding: '24px',
                    background: (data?.totalInvestments || 0) - (data?.totalDebts || 0) >= 0
                        ? 'linear-gradient(135deg, #22c55e22 0%, #22c55e11 100%)'
                        : 'linear-gradient(135deg, #ef444422 0%, #ef444411 100%)'
                }}>
                    <h3 style={{ margin: '0 0 16px' }}>💎 มูลค่าสุทธิ (Net Worth)</h3>
                    <p style={{
                        margin: 0,
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: (data?.totalInvestments || 0) - (data?.totalDebts || 0) >= 0 ? '#22c55e' : '#ef4444'
                    }}>
                        {formatCurrency((data?.totalInvestments || 0) - (data?.totalDebts || 0))}
                    </p>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
                        สินทรัพย์ - หนี้สิน
                    </p>
                </div>
            </div>

            {/* Health Settings Modal */}
            {showHealthModal && (
                <div className="modal-overlay" onClick={() => setShowHealthModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚙️ ตั้งค่าข้อมูลสุขภาพ</h2>
                            <button className="modal-close" onClick={() => setShowHealthModal(false)}>×</button>
                        </div>
                        <form onSubmit={saveHealthSettings}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>น้ำหนัก (kg)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={healthSettings.weight || ''}
                                        onChange={e => setHealthSettings({ ...healthSettings, weight: parseFloat(e.target.value) || 0 })}
                                        placeholder="70"
                                        step="0.1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ส่วนสูง (cm)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={healthSettings.height || ''}
                                        onChange={e => setHealthSettings({ ...healthSettings, height: parseFloat(e.target.value) || 0 })}
                                        placeholder="170"
                                        step="0.1"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>วันเกิด</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={healthSettings.birth_date || ''}
                                        onChange={e => setHealthSettings({ ...healthSettings, birth_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>น้ำหนักเป้าหมาย (kg)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={healthSettings.target_weight || ''}
                                        onChange={e => setHealthSettings({ ...healthSettings, target_weight: parseFloat(e.target.value) || 0 })}
                                        placeholder="65"
                                        step="0.1"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowHealthModal(false)}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
