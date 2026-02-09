import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { weight, height, birth_date, target_weight } = await request.json();

        // Check if settings exist
        const existing = await sql`SELECT id FROM health_settings LIMIT 1`;

        if (existing.rows.length > 0) {
            // Update
            const result = await sql`
                UPDATE health_settings 
                SET weight = ${weight}, height = ${height}, birth_date = ${birth_date}, 
                    target_weight = ${target_weight}, updated_at = NOW()
                WHERE id = ${existing.rows[0].id}
                RETURNING *
            `;
            return NextResponse.json({ settings: result.rows[0] });
        } else {
            // Insert
            const result = await sql`
                INSERT INTO health_settings (weight, height, birth_date, target_weight)
                VALUES (${weight}, ${height}, ${birth_date}, ${target_weight})
                RETURNING *
            `;
            return NextResponse.json({ settings: result.rows[0] }, { status: 201 });
        }
    } catch (error) {
        console.error('Error saving health settings:', error);

        // Try to create table
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS health_settings (
                    id SERIAL PRIMARY KEY,
                    weight DECIMAL,
                    height DECIMAL,
                    birth_date DATE,
                    target_weight DECIMAL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `;

            const { weight, height, birth_date, target_weight } = await request.json();
            const result = await sql`
                INSERT INTO health_settings (weight, height, birth_date, target_weight)
                VALUES (${weight}, ${height}, ${birth_date}, ${target_weight})
                RETURNING *
            `;
            return NextResponse.json({ settings: result.rows[0] }, { status: 201 });
        } catch {
            return NextResponse.json({ error: 'Failed to save health settings' }, { status: 500 });
        }
    }
}
