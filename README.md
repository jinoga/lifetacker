# Lifetacker

แอปพลิเคชันจัดการชีวิตส่วนตัว พัฒนาด้วย Next.js 14 และ Vercel Postgres

## Features

- ✅ **Task Tracker** - จัดการงานและ todos
- 🔄 **Habit Tracker** - ติดตาม habits พร้อม streak
- 🎯 **Goal Tracker** - ตั้งและติดตามเป้าหมาย
- ⏱️ **Time Tracker** - จับเวลาทำงาน
- 💰 **Expense Tracker** - บันทึกค่าใช้จ่าย
- 💝 **Wishlist** - รายการสิ่งที่อยากได้
- 📊 **Dashboard** - สถิติรวมทุกอย่าง

## Security

- JWT authentication (httpOnly cookies)
- Rate limiting (5 login attempts/minute)
- SQL injection protection (prepared statements)
- Single-user mode

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

### 3. Create Vercel Postgres database

1. Go to [Vercel Dashboard](https://vercel.com)
2. Create a new Postgres database
3. Copy connection strings to `.env.local`

### 4. Generate password hash

```bash
npx bcryptjs hash "your-password"
```

Copy the output to `ADMIN_PASSWORD_HASH` in `.env.local`

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`
   - `JWT_SECRET`
4. Vercel will auto-add Postgres variables when you link the database

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Vercel Postgres
- **Auth**: JWT + bcrypt
- **Styling**: Custom CSS (Dark Mode)
