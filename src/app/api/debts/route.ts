import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        const result = await sql`SELECT * FROM debts ORDER BY created_at DESC`;
        return NextResponse.json({ debts: result.rows });
    } catch (error) {
        console.error('Error fetching debts:', error);
        // Try to create table if it doesn't exist
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS debts (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(50) DEFAULT 'credit_card',
                    total_amount DECIMAL NOT NULL,
                    remaining_amount DECIMAL NOT NULL,
                    monthly_payment DECIMAL DEFAULT 0,
                    interest_rate DECIMAL DEFAULT 0,
                    due_date INT DEFAULT 25,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `;
            await sql`
                CREATE TABLE IF NOT EXISTS debt_payments (
                    id SERIAL PRIMARY KEY,
                    debt_id INT REFERENCES debts(id) ON DELETE CASCADE,
                    amount DECIMAL NOT NULL,
                    payment_date DATE NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `;
            return NextResponse.json({ debts: [] });
        } catch {
            return NextResponse.json({ debts: [] });
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, type, total_amount, remaining_amount, monthly_payment, interest_rate, due_date, notes } = await request.json();

        if (!name || !total_amount) {
            return NextResponse.json({ error: 'Name and total amount are required' }, { status: 400 });
        }

        const result = await sql`
            INSERT INTO debts (name, type, total_amount, remaining_amount, monthly_payment, interest_rate, due_date, notes)
            VALUES (${name}, ${type || 'credit_card'}, ${total_amount}, ${remaining_amount || total_amount}, ${monthly_payment || 0}, ${interest_rate || 0}, ${due_date || 25}, ${notes || ''})
            RETURNING *
        `;

        return NextResponse.json({ debt: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating debt:', error);
        return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 });
    }
}
