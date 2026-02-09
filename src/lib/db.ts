import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Lazy initialization to avoid build-time errors
let neonSql: NeonQueryFunction<false, false> | null = null;

function getNeonClient() {
  if (!neonSql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    neonSql = neon(process.env.DATABASE_URL);
  }
  return neonSql;
}

// SQL result type
type SqlResult<T = Record<string, unknown>> = {
  rows: T[];
};

// SQL template literal function - wraps Neon to return { rows: result }
export async function sql<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<SqlResult<T>> {
  const client = getNeonClient();
  const result = await client(strings, ...values);
  return { rows: result as T[] };
}

// Initialize database tables
export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      priority VARCHAR(10) DEFAULT 'medium',
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

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

  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      target_value DECIMAL DEFAULT 100,
      current_value DECIMAL DEFAULT 0,
      unit VARCHAR(50) DEFAULT '%',
      deadline DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS time_entries (
      id SERIAL PRIMARY KEY,
      project VARCHAR(255) NOT NULL,
      description TEXT,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      duration INT DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      amount DECIMAL NOT NULL,
      category VARCHAR(100) DEFAULT 'other',
      date DATE DEFAULT CURRENT_DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

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
}
