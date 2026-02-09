import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name, type, total_amount, remaining_amount, monthly_payment, interest_rate, due_date, notes } = await request.json();

        const result = await sql`
            UPDATE debts 
            SET name = ${name}, type = ${type}, total_amount = ${total_amount}, 
                remaining_amount = ${remaining_amount}, monthly_payment = ${monthly_payment},
                interest_rate = ${interest_rate}, due_date = ${due_date}, notes = ${notes}
            WHERE id = ${id}
            RETURNING *
        `;

        return NextResponse.json({ debt: result.rows[0] });
    } catch (error) {
        console.error('Error updating debt:', error);
        return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await sql`DELETE FROM debts WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting debt:', error);
        return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 });
    }
}
