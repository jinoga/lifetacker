import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name, type, amount, currency, value_thb, purchase_price, current_price, notes } = await request.json();

        const result = await sql`
            UPDATE investments 
            SET name = ${name}, type = ${type}, amount = ${amount}, currency = ${currency}, 
                value_thb = ${value_thb}, purchase_price = ${purchase_price}, 
                current_price = ${current_price}, notes = ${notes}
            WHERE id = ${id}
            RETURNING *
        `;

        return NextResponse.json({ investment: result.rows[0] });
    } catch (error) {
        console.error('Error updating investment:', error);
        return NextResponse.json({ error: 'Failed to update investment' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await sql`DELETE FROM investments WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting investment:', error);
        return NextResponse.json({ error: 'Failed to delete investment' }, { status: 500 });
    }
}
