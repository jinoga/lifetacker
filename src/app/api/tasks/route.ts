import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        const result = await sql`
      SELECT * FROM tasks 
      ORDER BY 
        CASE status WHEN 'pending' THEN 0 ELSE 1 END,
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        due_date ASC NULLS LAST,
        created_at DESC
    `;
        return NextResponse.json({ tasks: result.rows });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        // Try to create table if it doesn't exist
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          priority VARCHAR(10) DEFAULT 'medium',
          due_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
            return NextResponse.json({ tasks: [] });
        } catch {
            return NextResponse.json({ tasks: [] });
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { title, description, priority, due_date } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const result = await sql`
      INSERT INTO tasks (title, description, priority, due_date)
      VALUES (${title}, ${description || null}, ${priority || 'medium'}, ${due_date || null})
      RETURNING *
    `;

        return NextResponse.json({ task: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}
