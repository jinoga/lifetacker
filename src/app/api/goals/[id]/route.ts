import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { title, description, target_value, current_value, unit, deadline } = await request.json();

        const result = await sql`
      UPDATE goals SET title = ${title}, description = ${description || null}, 
        target_value = ${target_value}, current_value = ${current_value}, 
        unit = ${unit}, deadline = ${deadline || null}
      WHERE id = ${parseInt(id)} RETURNING *
    `;
        if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ goal: result.rows[0] });
    } catch (error) {
        console.error('Error updating goal:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await sql`DELETE FROM goals WHERE id = ${parseInt(id)}`;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting goal:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
