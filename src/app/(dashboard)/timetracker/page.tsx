'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TimeEntry {
    id: number;
    project: string;
    description: string;
    start_time: string;
    end_time: string | null;
    duration: number;
}

export default function TimeTrackerPage() {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [project, setProject] = useState('');
    const [description, setDescription] = useState('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchEntries = useCallback(async () => {
        try {
            const res = await fetch('/api/timetracker');
            const data = await res.json();
            setEntries(data.entries || []);

            const running = data.entries?.find((e: TimeEntry) => !e.end_time);
            if (running) {
                setActiveEntry(running);
                setIsRunning(true);
                setProject(running.project);
                const startTime = new Date(running.start_time).getTime();
                setElapsed(Math.floor((Date.now() - startTime) / 1000));
            }
        } catch (error) {
            console.error('Error fetching entries:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning]);

    const handleStart = async () => {
        if (!project.trim()) { alert('กรุณาใส่ชื่อโปรเจกต์'); return; }
        try {
            const res = await fetch('/api/timetracker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project, description }),
            });
            const data = await res.json();
            setActiveEntry(data.entry);
            setIsRunning(true);
            setElapsed(0);
        } catch (error) { console.error('Error starting timer:', error); }
    };

    const handleStop = async () => {
        if (!activeEntry) return;
        try {
            await fetch(`/api/timetracker/${activeEntry.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop' }) });
            setIsRunning(false);
            setActiveEntry(null);
            setElapsed(0);
            setProject('');
            setDescription('');
            fetchEntries();
        } catch (error) { console.error('Error stopping timer:', error); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ลบรายการนี้?')) return;
        try {
            await fetch(`/api/timetracker/${id}`, { method: 'DELETE' });
            fetchEntries();
        } catch (error) { console.error('Error deleting entry:', error); }
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const todayEntries = entries.filter(e => {
        const today = new Date().toISOString().split('T')[0];
        return e.start_time.startsWith(today);
    });

    const todayTotal = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

    if (loading) {
        return (<div className="fade-in"><div className="page-header"><h1 className="page-title">⏱️ Time Tracker</h1></div><div className="empty-state"><p>กำลังโหลด...</p></div></div>);
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">⏱️ Time Tracker</h1>
                <p className="page-subtitle">จับเวลาการทำงาน</p>
            </div>

            {/* Timer Card */}
            <div className="card" style={{ marginBottom: '24px', textAlign: 'center' }}>
                <div className="timer-display">{formatDuration(elapsed)}</div>

                {!isRunning ? (
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
                        <input type="text" className="form-input" placeholder="ชื่อโปรเจกต์" value={project} onChange={(e) => setProject(e.target.value)} style={{ maxWidth: '200px' }} />
                        <input type="text" className="form-input" placeholder="รายละเอียด (ไม่บังคับ)" value={description} onChange={(e) => setDescription(e.target.value)} style={{ maxWidth: '250px' }} />
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>กำลังจับเวลา: <strong>{project}</strong></p>
                )}

                <div className="timer-controls">
                    {!isRunning ? (
                        <button className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '1.125rem' }} onClick={handleStart}>▶ เริ่มจับเวลา</button>
                    ) : (
                        <button className="btn btn-danger" style={{ padding: '16px 48px', fontSize: '1.125rem' }} onClick={handleStop}>⏹ หยุด</button>
                    )}
                </div>
            </div>

            {/* Today Stats */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>📊 สรุปวันนี้</h3>
                <div style={{ display: 'flex', gap: '32px' }}>
                    <div><span style={{ color: 'var(--text-secondary)' }}>รายการ:</span> <strong>{todayEntries.filter(e => e.end_time).length}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>รวมเวลา:</span> <strong>{formatDuration(todayTotal)}</strong></div>
                </div>
            </div>

            {/* History */}
            <div className="card">
                <h3 style={{ marginBottom: '16px' }}>📜 ประวัติ</h3>
                {entries.filter(e => e.end_time).length > 0 ? (
                    <div className="task-list">
                        {entries.filter(e => e.end_time).slice(0, 10).map((entry) => (
                            <div key={entry.id} className="task-item">
                                <div className="task-content">
                                    <div className="task-title">{entry.project}</div>
                                    <div className="task-meta">
                                        <span>{new Date(entry.start_time).toLocaleDateString('th-TH')}</span>
                                        {entry.description && <span>{entry.description}</span>}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 600, color: 'var(--primary)', marginRight: '16px' }}>{formatDuration(entry.duration)}</div>
                                <button className="btn btn-secondary btn-icon" onClick={() => handleDelete(entry.id)}>🗑️</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state"><p>ยังไม่มีประวัติ</p></div>
                )}
            </div>
        </div>
    );
}
