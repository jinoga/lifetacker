'use client';

import { useState, useEffect } from 'react';

interface WishlistItem {
    id: number;
    item_name: string;
    price: number | null;
    priority: string;
    url: string | null;
    purchased: boolean;
}

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [formData, setFormData] = useState({ item_name: '', price: '', priority: 'medium', url: '' });

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/wishlist');
            const data = await res.json();
            setItems(data.items || []);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, price: formData.price ? parseFloat(formData.price) : null }),
            });
            setShowModal(false);
            setFormData({ item_name: '', price: '', priority: 'medium', url: '' });
            fetchItems();
        } catch (error) { console.error('Error:', error); }
    };

    const handleTogglePurchased = async (item: WishlistItem) => {
        try {
            await fetch(`/api/wishlist/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ purchased: !item.purchased }),
            });
            fetchItems();
        } catch (error) { console.error('Error:', error); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ลบรายการนี้?')) return;
        try { await fetch(`/api/wishlist/${id}`, { method: 'DELETE' }); fetchItems(); }
        catch (error) { console.error('Error:', error); }
    };

    const formatCurrency = (amount: number | null) => amount ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount) : '-';

    const filteredItems = filter === 'all' ? items : filter === 'purchased' ? items.filter(i => i.purchased) : items.filter(i => !i.purchased);
    const totalWishValue = items.filter(i => !i.purchased).reduce((sum, i) => sum + (Number(i.price) || 0), 0);

    if (loading) {
        return (<div className="fade-in"><div className="page-header"><h1 className="page-title">💝 Wishlist</h1></div><div className="empty-state"><p>กำลังโหลด...</p></div></div>);
    }

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">💝 Wishlist</h1>
                    <p className="page-subtitle">สิ่งที่อยากได้</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ เพิ่มรายการ</button>
            </div>

            {/* Summary */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon primary">💝</div>
                    <div className="stat-content">
                        <h3>{items.filter(i => !i.purchased).length}</h3>
                        <p>รายการที่อยากได้</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success">✅</div>
                    <div className="stat-content">
                        <h3>{items.filter(i => i.purchased).length}</h3>
                        <p>ได้แล้ว</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon warning">💰</div>
                    <div className="stat-content">
                        <h3>{formatCurrency(totalWishValue)}</h3>
                        <p>มูลค่ารวม</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {['all', 'wishlist', 'purchased'].map(f => (
                    <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter(f)}>
                        {f === 'all' ? 'ทั้งหมด' : f === 'wishlist' ? '💝 อยากได้' : '✅ ได้แล้ว'}
                    </button>
                ))}
            </div>

            {/* List */}
            {filteredItems.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    {filteredItems.map((item) => (
                        <div key={item.id} className="card" style={{ opacity: item.purchased ? 0.6 : 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 600, textDecoration: item.purchased ? 'line-through' : 'none' }}>{item.item_name}</h3>
                                    {item.price && <p style={{ margin: '4px 0 0', color: 'var(--primary)', fontWeight: 600 }}>{formatCurrency(item.price)}</p>}
                                </div>
                                <span className={`priority-badge priority-${item.priority}`}>{item.priority}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                <button className={`btn ${item.purchased ? 'btn-secondary' : 'btn-primary'} btn-sm`} style={{ flex: 1 }} onClick={() => handleTogglePurchased(item)}>
                                    {item.purchased ? '↩️ ยังไม่ได้' : '✅ ได้แล้ว'}
                                </button>
                                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">🔗</a>}
                                <button className="btn btn-secondary btn-icon" onClick={() => handleDelete(item.id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state"><div className="empty-state-icon">💝</div><h3>ยังไม่มีรายการ</h3></div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">เพิ่มสิ่งที่อยากได้</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label className="form-label">ชื่อ *</label><input type="text" className="form-input" value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} required /></div>
                            <div className="form-group"><label className="form-label">ราคา (บาท)</label><input type="number" className="form-input" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} min="0" step="0.01" /></div>
                            <div className="form-group"><label className="form-label">ความอยากได้</label><select className="form-select" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}><option value="low">ต่ำ</option><option value="medium">ปานกลาง</option><option value="high">สูง</option></select></div>
                            <div className="form-group"><label className="form-label">ลิงก์</label><input type="url" className="form-input" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." /></div>
                            <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button><button type="submit" className="btn btn-primary">เพิ่มรายการ</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
