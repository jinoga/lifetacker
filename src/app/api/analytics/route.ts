import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        // Fetch all data needed for analytics
        const [
            investmentsResult,
            debtsResult,
            expensesResult,
            salaryResult,
            healthResult,
            tasksResult,
            completedTasksResult,
            habitsResult,
            goalsResult,
        ] = await Promise.all([
            sql`SELECT COALESCE(SUM(value_thb), 0) as total FROM investments`,
            sql`SELECT COALESCE(SUM(remaining_amount), 0) as total FROM debts`,
            sql`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= DATE_TRUNC('month', CURRENT_DATE)`,
            sql`SELECT monthly_salary, salary_date FROM salary_settings LIMIT 1`,
            sql`SELECT weight, height, birth_date, target_weight FROM health_settings LIMIT 1`,
            sql`SELECT COUNT(*) as count FROM tasks`,
            sql`SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'`,
            sql`SELECT COUNT(*) as count FROM habits`,
            sql`SELECT 
                COALESCE(AVG(CASE WHEN target_value > 0 THEN (current_value::float / target_value::float) * 100 ELSE 0 END), 0) as avg_progress 
                FROM goals`,
        ]);

        const totalInvestments = Number(investmentsResult.rows[0]?.total || 0);
        const totalDebts = Number(debtsResult.rows[0]?.total || 0);
        const monthlyExpenses = Number(expensesResult.rows[0]?.total || 0);
        const monthlySalary = Number(salaryResult.rows[0]?.monthly_salary || 0);
        const salaryRemaining = monthlySalary - monthlyExpenses;

        // Health data
        const healthData = healthResult.rows[0];
        const weight = Number(healthData?.weight || 0);
        const height = Number(healthData?.height || 0);
        const birthDate = healthData?.birth_date;

        // Calculate BMI
        const bmi = height > 0 ? weight / ((height / 100) ** 2) : 0;

        // Calculate age
        let age = 0;
        if (birthDate && typeof birthDate === 'string') {
            const today = new Date();
            const birth = new Date(birthDate);
            age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
        }

        // Task/Productivity data
        const totalTasks = Number(tasksResult.rows[0]?.count || 0);
        const completedTasks = Number(completedTasksResult.rows[0]?.count || 0);
        const activeHabits = Number(habitsResult.rows[0]?.count || 0);
        const goalsProgress = Number(goalsResult.rows[0]?.avg_progress || 0);

        // Calculate Scores

        // Financial Score (0-100)
        let financialScore = 50; // Base score

        if (monthlySalary > 0) {
            const spendingRatio = monthlyExpenses / monthlySalary;
            if (spendingRatio <= 0.5) financialScore += 20;
            else if (spendingRatio <= 0.7) financialScore += 10;
            else if (spendingRatio <= 0.9) financialScore += 0;
            else if (spendingRatio <= 1) financialScore -= 10;
            else financialScore -= 25;
        }

        if (totalInvestments > 0) {
            financialScore += 15;
            if (totalInvestments > monthlySalary * 3) financialScore += 10;
            if (totalInvestments > monthlySalary * 12) financialScore += 5;
        }

        if (totalDebts > 0) {
            const debtRatio = totalDebts / (totalInvestments + monthlySalary || 1);
            if (debtRatio > 1) financialScore -= 20;
            else if (debtRatio > 0.5) financialScore -= 10;
            else financialScore -= 5;
        }

        financialScore = Math.max(0, Math.min(100, financialScore));

        // Health Score (0-100)
        let healthScore = 50; // Base score

        if (weight > 0 && height > 0) {
            if (bmi >= 18.5 && bmi < 23) healthScore += 30;
            else if (bmi >= 17 && bmi < 25) healthScore += 15;
            else if (bmi >= 15 && bmi < 30) healthScore += 0;
            else healthScore -= 15;
        } else {
            healthScore = 50; // No data
        }

        // Age bonus (younger = slight bonus, older = experience)
        if (age > 0) {
            if (age < 30) healthScore += 10;
            else if (age < 50) healthScore += 5;
        }

        healthScore = Math.max(0, Math.min(100, healthScore));

        // Productivity Score (0-100)
        let productivityScore = 50; // Base score

        if (totalTasks > 0) {
            const taskCompletionRate = completedTasks / totalTasks;
            productivityScore += taskCompletionRate * 30;
        }

        if (activeHabits > 0) {
            productivityScore += Math.min(activeHabits * 3, 15);
        }

        if (goalsProgress > 0) {
            productivityScore += (goalsProgress / 100) * 15;
        }

        productivityScore = Math.max(0, Math.min(100, productivityScore));

        // Overall Score (weighted average)
        const overallScore = Math.round(
            (financialScore * 0.4) +
            (healthScore * 0.3) +
            (productivityScore * 0.3)
        );

        return NextResponse.json({
            // Financial
            totalInvestments,
            totalDebts,
            monthlyExpenses,
            monthlySalary,
            salaryRemaining,

            // Health
            weight,
            height,
            age,
            bmi,

            // Progress
            completedTasks,
            totalTasks,
            activeHabits,
            habitStreak: 0, // TODO: implement streak calculation
            goalsProgress,

            // Scores
            financialScore: Math.round(financialScore),
            healthScore: Math.round(healthScore),
            productivityScore: Math.round(productivityScore),
            overallScore,

            // Health settings for the modal
            healthSettings: healthData || null,
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);

        // Try to create health_settings table
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
        } catch {
            // Table might already exist
        }

        return NextResponse.json({
            totalInvestments: 0,
            totalDebts: 0,
            monthlyExpenses: 0,
            monthlySalary: 0,
            salaryRemaining: 0,
            weight: 0,
            height: 0,
            age: 0,
            bmi: 0,
            completedTasks: 0,
            totalTasks: 0,
            activeHabits: 0,
            habitStreak: 0,
            goalsProgress: 0,
            financialScore: 50,
            healthScore: 50,
            productivityScore: 50,
            overallScore: 50,
            healthSettings: null,
        });
    }
}
