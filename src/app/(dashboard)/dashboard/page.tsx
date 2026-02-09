import { sql } from '@/lib/db';

interface Task {
    id: number;
    title: string;
    priority: string;
    due_date: string;
}

interface Goal {
    id: number;
    title: string;
    target_value: number;
    current_value: number;
    unit: string;
    deadline: string;
}

interface SalarySettings {
    monthly_salary: number;
    salary_date: number;
}

async function getStats() {
    try {
        const [
            tasksResult,
            completedTasksResult,
            habitsResult,
            goalsResult,
            expensesResult,
            wishlistResult,
            salaryResult,
            investmentResult,
        ] = await Promise.all([
            sql`SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'`,
            sql`SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'`,
            sql`SELECT COUNT(*) as count FROM habits`,
            sql`SELECT COUNT(*) as count FROM goals`,
            sql`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= DATE_TRUNC('month', CURRENT_DATE)`,
            sql`SELECT COUNT(*) as count FROM wishlist WHERE purchased = false`,
            sql`SELECT monthly_salary, salary_date FROM salary_settings LIMIT 1`,
            sql`SELECT COALESCE(SUM(value_thb), 0) as total FROM investments`,
        ]);

        return {
            pendingTasks: Number(tasksResult.rows[0]?.count || 0),
            completedTasks: Number(completedTasksResult.rows[0]?.count || 0),
            habits: Number(habitsResult.rows[0]?.count || 0),
            goals: Number(goalsResult.rows[0]?.count || 0),
            monthlyExpenses: Number(expensesResult.rows[0]?.total || 0),
            wishlistItems: Number(wishlistResult.rows[0]?.count || 0),
            salarySettings: salaryResult.rows[0] as unknown as SalarySettings | undefined,
            totalInvestments: Number(investmentResult.rows[0]?.total || 0),
        };
    } catch {
        return {
            pendingTasks: 0,
            completedTasks: 0,
            habits: 0,
            goals: 0,
            monthlyExpenses: 0,
            wishlistItems: 0,
            salarySettings: undefined,
            totalInvestments: 0,
        };
    }
}

async function getRecentTasks(): Promise<Task[]> {
    try {
        const result = await sql<Task>`
      SELECT id, title, status, priority, due_date 
      FROM tasks 
      WHERE status = 'pending'
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          ELSE 3 
        END,
        due_date ASC NULLS LAST
      LIMIT 5
    `;
        return result.rows;
    } catch {
        return [];
    }
}

async function getActiveGoals(): Promise<Goal[]> {
    try {
        const result = await sql<Goal>`
      SELECT id, title, target_value, current_value, unit, deadline
      FROM goals
      ORDER BY deadline ASC NULLS LAST
      LIMIT 3
    `;
        return result.rows;
    } catch {
        return [];
    }
}

function getYearCountdown() {
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    const diffTime = endOfYear.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = 365 + (now.getFullYear() % 4 === 0 ? 1 : 0);
    const daysPassed = totalDays - diffDays;
    const progress = (daysPassed / totalDays) * 100;

    return {
        daysRemaining: diffDays,
        daysPassed,
        totalDays,
        progress,
        year: now.getFullYear(),
    };
}

function getSalaryRemaining(monthlyExpenses: number, salarySettings?: SalarySettings) {
    if (!salarySettings) {
        return {
            remaining: 0,
            salary: 0,
            percentUsed: 0,
        };
    }

    const remaining = salarySettings.monthly_salary - monthlyExpenses;
    const percentUsed = (monthlyExpenses / salarySettings.monthly_salary) * 100;

    return {
        remaining,
        salary: salarySettings.monthly_salary,
        percentUsed: Math.min(percentUsed, 100),
    };
}

export default async function DashboardPage() {
    const stats = await getStats();
    const recentTasks = await getRecentTasks();
    const activeGoals = await getActiveGoals();
    const yearCountdown = getYearCountdown();
    const salaryInfo = getSalaryRemaining(stats.monthlyExpenses, stats.salarySettings);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">ภาพรวมกิจกรรมและสถิติของคุณ</p>
            </div>

            {/* Year Countdown & Salary Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Year Countdown */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '2rem' }}>📅</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>ปี {yearCountdown.year}</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>Year Countdown</p>
                            </div>
                        </div>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '8px' }}>
                            {yearCountdown.daysRemaining}
                            <span style={{ fontSize: '1rem', fontWeight: 'normal', marginLeft: '8px' }}>วัน</span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', opacity: 0.8, marginBottom: '4px' }}>
                                <span>ผ่านไปแล้ว {yearCountdown.daysPassed} วัน</span>
                                <span>{yearCountdown.progress.toFixed(1)}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${yearCountdown.progress}%`, background: 'white', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Salary Remaining */}
                <div className="card" style={{ background: salaryInfo.remaining >= 0 ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)', color: 'white' }}>
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '2rem' }}>💵</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>เงินเดือนคงเหลือ</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>Monthly Budget</p>
                            </div>
                        </div>
                        {salaryInfo.salary > 0 ? (
                            <>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                                    {formatCurrency(salaryInfo.remaining)}
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', opacity: 0.8, marginBottom: '4px' }}>
                                        <span>ใช้ไป {formatCurrency(stats.monthlyExpenses)}</span>
                                        <span>{salaryInfo.percentUsed.toFixed(1)}%</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${salaryInfo.percentUsed}%`, background: 'white', borderRadius: '4px' }}></div>
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>จากเงินเดือน {formatCurrency(salaryInfo.salary)}</p>
                            </>
                        ) : (
                            <div>
                                <p style={{ margin: 0, opacity: 0.9 }}>ยังไม่ได้ตั้งค่าเงินเดือน</p>
                                <a href="/settings" style={{ color: 'white', textDecoration: 'underline', fontSize: '0.875rem' }}>ตั้งค่าเงินเดือน →</a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Total Investments */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '2rem' }}>📈</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>มูลค่าการลงทุน</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>Total Investments</p>
                            </div>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                            {formatCurrency(stats.totalInvestments)}
                        </div>
                        <a href="/investments" style={{ color: 'white', textDecoration: 'underline', fontSize: '0.875rem' }}>ดูรายละเอียด →</a>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary">📋</div>
                    <div className="stat-content">
                        <h3>{stats.pendingTasks}</h3>
                        <p>Tasks ที่รอทำ</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">✅</div>
                    <div className="stat-content">
                        <h3>{stats.completedTasks}</h3>
                        <p>Tasks ที่เสร็จแล้ว</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning">🔄</div>
                    <div className="stat-content">
                        <h3>{stats.habits}</h3>
                        <p>Habits ที่ติดตาม</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon primary">🎯</div>
                    <div className="stat-content">
                        <h3>{stats.goals}</h3>
                        <p>เป้าหมาย</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon danger">💰</div>
                    <div className="stat-content">
                        <h3>{formatCurrency(stats.monthlyExpenses)}</h3>
                        <p>ค่าใช้จ่ายเดือนนี้</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">💝</div>
                    <div className="stat-content">
                        <h3>{stats.wishlistItems}</h3>
                        <p>สิ่งที่อยากได้</p>
                    </div>
                </div>
            </div>

            {/* Recent Tasks & Goals */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
                {/* Recent Tasks */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📋 Tasks ล่าสุด</h3>
                    </div>
                    {recentTasks.length > 0 ? (
                        <div className="task-list">
                            {recentTasks.map((task) => (
                                <div key={task.id} className="task-item">
                                    <div className="task-checkbox"></div>
                                    <div className="task-content">
                                        <div className="task-title">{task.title}</div>
                                        <div className="task-meta">
                                            <span className={`priority-badge priority-${task.priority}`}>
                                                {task.priority}
                                            </span>
                                            {task.due_date && (
                                                <span>📅 {new Date(task.due_date).toLocaleDateString('th-TH')}</span>
                                            )}
                                        </div>
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
                </div>

                {/* Active Goals */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">🎯 เป้าหมายที่กำลังทำ</h3>
                    </div>
                    {activeGoals.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {activeGoals.map((goal) => {
                                const progress = goal.target_value > 0
                                    ? Math.min((Number(goal.current_value) / Number(goal.target_value)) * 100, 100)
                                    : 0;
                                return (
                                    <div key={goal.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 500 }}>{goal.title}</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                {Number(goal.current_value)} / {Number(goal.target_value)} {goal.unit}
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">🎯</div>
                            <h3>ยังไม่มีเป้าหมาย</h3>
                            <p>ตั้งเป้าหมายแรกของคุณ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
