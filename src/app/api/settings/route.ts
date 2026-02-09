import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        const result = await sql`SELECT * FROM salary_settings LIMIT 1`;
        return NextResponse.json({ settings: result.rows[0] || null });
    } catch (error) {
        console.error('Error fetching settings:', error);
        // Try to create table if it doesn't exist
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS salary_settings (
                    id SERIAL PRIMARY KEY,
                    monthly_salary DECIMAL DEFAULT 0,
                    salary_date INT DEFAULT 25,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `;
            return NextResponse.json({ settings: null });
        } catch {
            return NextResponse.json({ settings: null });
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { monthly_salary, salary_date } = await request.json();

        // Check if settings exist
        const existing = await sql`SELECT id FROM salary_settings LIMIT 1`;

        if (existing.rows.length > 0) {
            // Update
            const result = await sql`
                UPDATE salary_settings 
                SET monthly_salary = ${monthly_salary}, salary_date = ${salary_date}, updated_at = NOW()
                WHERE id = ${existing.rows[0].id}
                RETURNING *
            `;
            return NextResponse.json({ settings: result.rows[0] });
        } else {
            // Insert
            const result = await sql`
                INSERT INTO salary_settings (monthly_salary, salary_date)
                VALUES (${monthly_salary}, ${salary_date})
                RETURNING *
            `;
            return NextResponse.json({ settings: result.rows[0] }, { status: 201 });
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
