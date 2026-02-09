import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        const result = await sql`SELECT * FROM time_entries ORDER BY start_time DESC LIMIT 50`;
        return NextResponse.json({ entries: result.rows });
    } catch {
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS time_entries (
          id SERIAL PRIMARY KEY,
          project VARCHAR(255) NOT NULL,
          description TEXT,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          duration INT DEFAULT 0
        )
      `;
            return NextResponse.json({ entries: [] });
        } catch { return NextResponse.json({ entries: [] }); }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { project, description } = await request.json();
        if (!project) return NextResponse.json({ error: 'Project required' }, { status: 400 });

        const result = await sql`
      INSERT INTO time_entries (project, description, start_time)
      VALUES (${project}, ${description || null}, NOW())
      RETURNING *
    `;
        return NextResponse.json({ entry: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating entry:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
