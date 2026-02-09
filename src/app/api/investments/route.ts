import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        const result = await sql`SELECT * FROM investments ORDER BY created_at DESC`;
        return NextResponse.json({ investments: result.rows });
    } catch (error) {
        console.error('Error fetching investments:', error);
        // Try to create table if it doesn't exist
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS investments (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(50) DEFAULT 'stock',
                    amount DECIMAL NOT NULL,
                    currency VARCHAR(10) DEFAULT 'THB',
                    value_thb DECIMAL DEFAULT 0,
                    purchase_price DECIMAL DEFAULT 0,
                    current_price DECIMAL DEFAULT 0,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `;
            return NextResponse.json({ investments: [] });
        } catch {
            return NextResponse.json({ investments: [] });
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, type, amount, currency, value_thb, purchase_price, current_price, notes } = await request.json();

        if (!name || !amount) {
            return NextResponse.json({ error: 'Name and amount are required' }, { status: 400 });
        }

        const result = await sql`
            INSERT INTO investments (name, type, amount, currency, value_thb, purchase_price, current_price, notes)
            VALUES (${name}, ${type || 'stock'}, ${amount}, ${currency || 'THB'}, ${value_thb || 0}, ${purchase_price || 0}, ${current_price || 0}, ${notes || ''})
            RETURNING *
        `;

        return NextResponse.json({ investment: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating investment:', error);
        return NextResponse.json({ error: 'Failed to create investment' }, { status: 500 });
    }
}
