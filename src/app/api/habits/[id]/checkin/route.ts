import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const today = new Date().toISOString().split('T')[0];

        // Insert or update completion for today
        await sql`
      INSERT INTO habit_completions (habit_id, completed_date, count)
      VALUES (${parseInt(id)}, ${today}, 1)
      ON CONFLICT (habit_id, completed_date) 
      DO UPDATE SET count = habit_completions.count + 1
    `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error checking in habit:', error);
        return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
    }
}
