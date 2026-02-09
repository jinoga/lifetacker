import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Lifetacker - Personal Life Management",
    description: "Track your tasks, habits, goals, time, expenses, and wishlist all in one place.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="th">
            <body>{children}</body>
        </html>
    );
}
