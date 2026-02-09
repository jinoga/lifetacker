'use client';

import { useState, useEffect } from 'react';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date: string | null;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [filter, setFilter] = useState('all');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
    });

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/tasks');
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editTask ? `/api/tasks/${editTask.id}` : '/api/tasks';
            const method = editTask ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            setShowModal(false);
            setEditTask(null);
            setFormData({ title: '', description: '', priority: 'medium', due_date: '' });
            fetchTasks();
        } catch (error) {
            console.error('Error saving task:', error);
        }
    };

    const handleToggleStatus = async (task: Task) => {
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...task, status: newStatus }),
            });
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('คุณต้องการลบ task นี้?')) return;

        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const openEditModal = (task: Task) => {
        setEditTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            due_date: task.due_date ? task.due_date.split('T')[0] : '',
        });
        setShowModal(true);
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        return task.status === filter;
    });

    if (loading) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h1 className="page-title">✅ Tasks</h1>
                </div>
                <div className="empty-state">
                    <p>กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">✅ Tasks</h1>
                    <p className="page-subtitle">จัดการงานและสิ่งที่ต้องทำ</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + เพิ่ม Task
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {['all', 'pending', 'completed'].map((f) => (
                    <button
                        key={f}
                        className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'ทั้งหมด' : f === 'pending' ? 'กำลังทำ' : 'เสร็จแล้ว'}
                    </button>
                ))}
            </div>

            {/* Task List */}
            {filteredTasks.length > 0 ? (
                <div className="task-list">
                    {filteredTasks.map((task) => (
                        <div key={task.id} className="task-item">
                            <div
                                className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                                onClick={() => handleToggleStatus(task)}
                            >
                                {task.status === 'completed' && '✓'}
                            </div>
                            <div className="task-content">
                                <div className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>
                                    {task.title}
                                </div>
                                <div className="task-meta">
                                    <span className={`priority-badge priority-${task.priority}`}>
                                        {task.priority}
                                    </span>
                                    {task.due_date && (
                                        <span>📅 {new Date(task.due_date).toLocaleDateString('th-TH')}</span>
                                    )}
                                </div>
                            </div>
                            <div className="task-actions">
                                <button className="btn btn-secondary btn-icon" onClick={() => openEditModal(task)}>
                                    ✏️
                                </button>
                                <button className="btn btn-secondary btn-icon" onClick={() => handleDelete(task.id)}>
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3>ยังไม่มี Task</h3>
                    <p>เริ่มเพิ่ม Task แรกของคุณ</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editTask ? 'แก้ไข Task' : 'เพิ่ม Task ใหม่'}</h2>
                            <button className="modal-close" onClick={() => { setShowModal(false); setEditTask(null); }}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">ชื่อ Task *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="ใส่ชื่อ task"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">รายละเอียด</label>
                                <textarea
                                    className="form-input"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                                    rows={3}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">ความสำคัญ</label>
                                <select
                                    className="form-select"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="low">ต่ำ</option>
                                    <option value="medium">ปานกลาง</option>
                                    <option value="high">สูง</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">วันครบกำหนด</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditTask(null); }}>
                                    ยกเลิก
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editTask ? 'บันทึก' : 'เพิ่ม Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
