import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        const result = await sql`SELECT * FROM goals ORDER BY deadline ASC NULLS LAST, created_at DESC`;
        return NextResponse.json({ goals: result.rows });
    } catch {
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS goals (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          target_value DECIMAL DEFAULT 100,
          current_value DECIMAL DEFAULT 0,
          unit VARCHAR(50) DEFAULT '%',
          deadline DATE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
            return NextResponse.json({ goals: [] });
        } catch {
            return NextResponse.json({ goals: [] });
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { title, description, target_value, current_value, unit, deadline } = await request.json();
        if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

        const result = await sql`
      INSERT INTO goals (title, description, target_value, current_value, unit, deadline)
      VALUES (${title}, ${description || null}, ${target_value || 100}, ${current_value || 0}, ${unit || '%'}, ${deadline || null})
      RETURNING *
    `;
        return NextResponse.json({ goal: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating goal:', error);
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }
}
