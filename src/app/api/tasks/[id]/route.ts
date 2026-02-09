import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { title, description, status, priority, due_date } = await request.json();

        const result = await sql`
      UPDATE tasks 
      SET 
        title = ${title},
        description = ${description || null},
        status = ${status || 'pending'},
        priority = ${priority || 'medium'},
        due_date = ${due_date || null}
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ task: result.rows[0] });
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await sql`DELETE FROM tasks WHERE id = ${parseInt(id)}`;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
