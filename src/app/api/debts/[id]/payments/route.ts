import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await sql`
            SELECT * FROM debt_payments 
            WHERE debt_id = ${id} 
            ORDER BY payment_date DESC
        `;
        return NextResponse.json({ payments: result.rows });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ payments: [] });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { amount, payment_date, notes } = await request.json();

        if (!amount || !payment_date) {
            return NextResponse.json({ error: 'Amount and date are required' }, { status: 400 });
        }

        // Insert payment
        const paymentResult = await sql`
            INSERT INTO debt_payments (debt_id, amount, payment_date, notes)
            VALUES (${id}, ${amount}, ${payment_date}, ${notes || ''})
            RETURNING *
        `;

        // Update remaining amount in debt
        await sql`
            UPDATE debts 
            SET remaining_amount = remaining_amount - ${amount}
            WHERE id = ${id}
        `;

        return NextResponse.json({ payment: paymentResult.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error recording payment:', error);
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }
}
