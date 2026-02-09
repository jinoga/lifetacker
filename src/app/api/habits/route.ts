import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface Habit {
    id: number;
    name: string;
    frequency: string;
    target_count: number;
    color: string;
    created_at: string;
}

interface HabitCompletion {
    habit_id: number;
    completed_date: string;
    count: number;
}

export async function GET() {
    try {
        // Get habits
        const habitsResult = await sql<Habit>`SELECT * FROM habits ORDER BY created_at DESC`;

        // Get completions for last 30 days
        const completionsResult = await sql<HabitCompletion>`
      SELECT habit_id, completed_date::text as completed_date, count 
      FROM habit_completions 
      WHERE completed_date >= CURRENT_DATE - INTERVAL '30 days'
    `;

        // Calculate streaks and attach completions
        const habits = habitsResult.rows.map(habit => {
            const completions = completionsResult.rows
                .filter(c => c.habit_id === habit.id)
                .sort((a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime());

            // Calculate streak
            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];

                if (completions.some(c => c.completed_date === dateStr)) {
                    streak++;
                } else if (i > 0) {
                    break;
                }
            }

            return { ...habit, completions, streak };
        });

        return NextResponse.json({ habits });
    } catch (error) {
        console.error('Error fetching habits:', error);
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS habits (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          frequency VARCHAR(20) DEFAULT 'daily',
          target_count INT DEFAULT 1,
          color VARCHAR(20) DEFAULT '#6366f1',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
            await sql`
        CREATE TABLE IF NOT EXISTS habit_completions (
          id SERIAL PRIMARY KEY,
          habit_id INT REFERENCES habits(id) ON DELETE CASCADE,
          completed_date DATE NOT NULL,
          count INT DEFAULT 1,
          UNIQUE(habit_id, completed_date)
        )
      `;
            return NextResponse.json({ habits: [] });
        } catch {
            return NextResponse.json({ habits: [] });
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, frequency, target_count, color } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const result = await sql`
      INSERT INTO habits (name, frequency, target_count, color)
      VALUES (${name}, ${frequency || 'daily'}, ${target_count || 1}, ${color || '#6366f1'})
      RETURNING *
    `;

        return NextResponse.json({ habit: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating habit:', error);
        return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
    }
}
