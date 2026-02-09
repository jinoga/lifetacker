import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { action } = await request.json();

        if (action === 'stop') {
            const result = await sql`
        UPDATE time_entries 
        SET end_time = NOW(), duration = EXTRACT(EPOCH FROM (NOW() - start_time))::INT
        WHERE id = ${parseInt(id)} RETURNING *
      `;
            return NextResponse.json({ entry: result.rows[0] });
        }
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error updating entry:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await sql`DELETE FROM time_entries WHERE id = ${parseInt(id)}`;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting entry:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
