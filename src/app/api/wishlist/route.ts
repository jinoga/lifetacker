import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        const result = await sql`SELECT * FROM wishlist ORDER BY purchased ASC, CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC`;
        return NextResponse.json({ items: result.rows });
    } catch {
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS wishlist (
          id SERIAL PRIMARY KEY,
          item_name VARCHAR(255) NOT NULL,
          price DECIMAL,
          priority VARCHAR(10) DEFAULT 'medium',
          url TEXT,
          purchased BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
            return NextResponse.json({ items: [] });
        } catch { return NextResponse.json({ items: [] }); }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { item_name, price, priority, url } = await request.json();
        if (!item_name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

        const result = await sql`
      INSERT INTO wishlist (item_name, price, priority, url)
      VALUES (${item_name}, ${price || null}, ${priority || 'medium'}, ${url || null})
      RETURNING *
    `;
        return NextResponse.json({ item: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
