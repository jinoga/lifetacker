// Mock database for local testing without Neon connection

// In-memory storage
const mockData = {
    tasks: [
        { id: 1, title: 'ทดสอบระบบ Lifetacker', description: 'ลองใช้งานฟีเจอร์ต่างๆ', status: 'pending', priority: 'high', due_date: new Date().toISOString(), created_at: new Date().toISOString() },
        { id: 2, title: 'อ่านหนังสือ 30 นาที', description: '', status: 'completed', priority: 'medium', due_date: null, created_at: new Date().toISOString() },
        { id: 3, title: 'ออกกำลังกาย', description: 'วิ่ง 5 km', status: 'pending', priority: 'high', due_date: new Date(Date.now() + 86400000).toISOString(), created_at: new Date().toISOString() },
    ],
    habits: [
        { id: 1, name: 'ออกกำลังกาย', frequency: 'daily', target_count: 1, color: '#22c55e', created_at: new Date().toISOString() },
        { id: 2, name: 'อ่านหนังสือ', frequency: 'daily', target_count: 1, color: '#6366f1', created_at: new Date().toISOString() },
        { id: 3, name: 'ทำสมาธิ', frequency: 'daily', target_count: 1, color: '#f59e0b', created_at: new Date().toISOString() },
    ],
    habit_completions: [
        { id: 1, habit_id: 1, completed_date: new Date().toISOString().split('T')[0], count: 1 },
        { id: 2, habit_id: 1, completed_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], count: 1 },
        { id: 3, habit_id: 2, completed_date: new Date().toISOString().split('T')[0], count: 1 },
    ],
    goals: [
        { id: 1, title: 'วิ่งครบ 100 km', description: 'เป้าหมายปีนี้', target_value: 100, current_value: 35, unit: 'km', deadline: '2026-12-31', created_at: new Date().toISOString() },
        { id: 2, title: 'อ่านหนังสือ 24 เล่ม', description: 'เดือนละ 2 เล่ม', target_value: 24, current_value: 8, unit: 'เล่ม', deadline: '2026-12-31', created_at: new Date().toISOString() },
    ],
    time_entries: [
        { id: 1, project: 'Lifetacker', description: 'พัฒนาแอป', start_time: new Date(Date.now() - 7200000).toISOString(), end_time: new Date(Date.now() - 3600000).toISOString(), duration: 3600 },
        { id: 2, project: 'เรียนภาษา', description: 'ฝึกพูดอังกฤษ', start_time: new Date(Date.now() - 86400000).toISOString(), end_time: new Date(Date.now() - 82800000).toISOString(), duration: 3600 },
    ],
    expenses: [
        { id: 1, title: 'กาแฟ', amount: 75, category: 'food', date: new Date().toISOString().split('T')[0], notes: 'Starbucks', created_at: new Date().toISOString() },
        { id: 2, title: 'ค่ารถไฟฟ้า', amount: 44, category: 'transport', date: new Date().toISOString().split('T')[0], notes: '', created_at: new Date().toISOString() },
        { id: 3, title: 'อาหารกลางวัน', amount: 150, category: 'food', date: new Date().toISOString().split('T')[0], notes: '', created_at: new Date().toISOString() },
    ],
    wishlist: [
        { id: 1, item_name: 'MacBook Pro M4', price: 89900, priority: 'high', url: 'https://apple.com', purchased: false, created_at: new Date().toISOString() },
        { id: 2, item_name: 'หูฟัง AirPods Pro', price: 8990, priority: 'medium', url: 'https://apple.com', purchased: true, created_at: new Date().toISOString() },
    ],
};

let nextIds = {
    tasks: 4,
    habits: 4,
    habit_completions: 4,
    goals: 3,
    time_entries: 3,
    expenses: 4,
    wishlist: 3,
};

type TableName = keyof typeof mockData;

// SQL result type
type SqlResult<T = Record<string, unknown>> = {
    rows: T[];
};

// Mock SQL function that simulates database operations
export async function sql<T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
): Promise<SqlResult<T>> {
    // Build query string for parsing
    let query = strings[0];
    for (let i = 0; i < values.length; i++) {
        query += `$${i + 1}` + strings[i + 1];
    }
    query = query.toLowerCase().trim();

    // Parse and execute mock operations
    try {
        // SELECT COUNT
        if (query.includes('select count')) {
            const table = extractTable(query);
            if (table && mockData[table as TableName]) {
                let items = mockData[table as TableName] as Record<string, unknown>[];

                // Apply WHERE conditions
                if (query.includes("status = 'pending'")) {
                    items = items.filter((i) => i.status === 'pending');
                } else if (query.includes("status = 'completed'")) {
                    items = items.filter((i) => i.status === 'completed');
                } else if (query.includes('purchased = false')) {
                    items = items.filter((i) => i.purchased === false);
                }

                return { rows: [{ count: items.length }] as T[] };
            }
        }

        // SELECT SUM
        if (query.includes('select') && query.includes('sum(amount)')) {
            const total = mockData.expenses.reduce((sum, e) => sum + e.amount, 0);
            return { rows: [{ total }] as T[] };
        }

        // SELECT * FROM table
        if (query.includes('select') && !query.includes('count')) {
            const table = extractTable(query);
            if (table && mockData[table as TableName]) {
                let items = [...mockData[table as TableName]] as Record<string, unknown>[];

                // Apply WHERE id = $1
                if (query.includes('where id =') && values[0]) {
                    items = items.filter((i) => i.id === Number(values[0]));
                }

                return { rows: items as T[] };
            }
        }

        // INSERT
        if (query.includes('insert into')) {
            const table = extractTable(query) as TableName;
            if (table && mockData[table]) {
                const newItem = { id: nextIds[table]++, created_at: new Date().toISOString() } as Record<string, unknown>;

                // Parse values based on table
                if (table === 'tasks') {
                    Object.assign(newItem, { title: values[0], description: values[1], priority: values[2] || 'medium', due_date: values[3], status: 'pending' });
                } else if (table === 'habits') {
                    Object.assign(newItem, { name: values[0], frequency: values[1] || 'daily', target_count: values[2] || 1, color: values[3] || '#6366f1' });
                } else if (table === 'goals') {
                    Object.assign(newItem, { title: values[0], description: values[1], target_value: values[2] || 100, current_value: values[3] || 0, unit: values[4] || '%', deadline: values[5] });
                } else if (table === 'time_entries') {
                    Object.assign(newItem, { project: values[0], description: values[1], start_time: new Date().toISOString(), end_time: null, duration: 0 });
                } else if (table === 'expenses') {
                    Object.assign(newItem, { title: values[0], amount: values[1], category: values[2] || 'other', date: values[3] || new Date().toISOString().split('T')[0], notes: values[4] });
                } else if (table === 'wishlist') {
                    Object.assign(newItem, { item_name: values[0], price: values[1], priority: values[2] || 'medium', url: values[3], purchased: false });
                } else if (table === 'habit_completions') {
                    Object.assign(newItem, { habit_id: values[0], completed_date: values[1], count: 1 });
                }

                (mockData[table] as Record<string, unknown>[]).push(newItem);
                return { rows: [newItem] as T[] };
            }
        }

        // UPDATE
        if (query.includes('update')) {
            const table = extractTable(query) as TableName;
            const id = values[values.length - 1]; // ID is usually last

            if (table && mockData[table]) {
                const items = mockData[table] as Record<string, unknown>[];
                const index = items.findIndex((i) => i.id === Number(id));

                if (index !== -1) {
                    // Update based on query pattern
                    if (table === 'tasks') {
                        Object.assign(items[index], { title: values[0], description: values[1], status: values[2], priority: values[3], due_date: values[4] });
                    } else if (table === 'goals') {
                        Object.assign(items[index], { title: values[0], description: values[1], target_value: values[2], current_value: values[3], unit: values[4], deadline: values[5] });
                    } else if (table === 'time_entries' && query.includes('end_time')) {
                        items[index].end_time = new Date().toISOString();
                        items[index].duration = Math.floor((Date.now() - new Date(items[index].start_time as string).getTime()) / 1000);
                    } else if (table === 'wishlist') {
                        items[index].purchased = values[0];
                    }
                    return { rows: [items[index]] as T[] };
                }
            }
        }

        // DELETE
        if (query.includes('delete from')) {
            const table = extractTable(query) as TableName;
            const id = values[0];

            if (table && mockData[table]) {
                const items = mockData[table] as Record<string, unknown>[];
                const index = items.findIndex((i) => i.id === Number(id));
                if (index !== -1) {
                    items.splice(index, 1);
                }
            }
            return { rows: [] as T[] };
        }

        // CREATE TABLE - no-op in mock mode
        if (query.includes('create table')) {
            return { rows: [] as T[] };
        }

    } catch (error) {
        console.error('Mock SQL error:', error);
    }

    return { rows: [] as T[] };
}

function extractTable(query: string): string | null {
    const patterns = [
        /from\s+(\w+)/i,
        /into\s+(\w+)/i,
        /update\s+(\w+)/i,
        /table.*?(\w+)/i,
    ];

    for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Export mock data for direct access if needed
export { mockData };
