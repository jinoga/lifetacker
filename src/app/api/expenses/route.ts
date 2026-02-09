import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        const result = await sql`SELECT * FROM expenses ORDER BY date DESC, created_at DESC`;
        return NextResponse.json({ expenses: result.rows });
    } catch {
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          amount DECIMAL NOT NULL,
          category VARCHAR(100) DEFAULT 'other',
          date DATE DEFAULT CURRENT_DATE,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
            return NextResponse.json({ expenses: [] });
        } catch { return NextResponse.json({ expenses: [] }); }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { title, amount, category, date, notes } = await request.json();
        if (!title || !amount) return NextResponse.json({ error: 'Title and amount required' }, { status: 400 });

        const result = await sql`
      INSERT INTO expenses (title, amount, category, date, notes)
      VALUES (${title}, ${amount}, ${category || 'other'}, ${date || new Date().toISOString().split('T')[0]}, ${notes || null})
      RETURNING *
    `;
        return NextResponse.json({ expense: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
