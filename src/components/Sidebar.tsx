'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/analytics', icon: '📈', label: 'วิเคราะห์ชีวิต' },
    { href: '/tasks', icon: '✅', label: 'Tasks' },
    { href: '/habits', icon: '🔄', label: 'Habits' },
    { href: '/goals', icon: '🎯', label: 'Goals' },
    { href: '/timetracker', icon: '⏱️', label: 'Time Tracker' },
    { href: '/expenses', icon: '💰', label: 'Expenses' },
    { href: '/wishlist', icon: '💝', label: 'Wishlist' },
    { href: '/debts', icon: '💳', label: 'Debts' },
    { href: '/investments', icon: '💎', label: 'Investments' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Mobile Menu Toggle Button */}
            <button
                className="mobile-menu-toggle"
                onClick={toggleMenu}
                aria-label="Toggle menu"
            >
                {isOpen ? '✕' : '☰'}
            </button>

            {/* Overlay for mobile */}
            <div
                className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <span style={{ fontSize: '1.75rem' }}>⚡</span>
                    <h1>Lifetacker</h1>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <button
                    onClick={handleLogout}
                    className="nav-link"
                    style={{
                        marginTop: 'auto',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left'
                    }}
                >
                    <span className="nav-icon">🚪</span>
                    <span>ออกจากระบบ</span>
                </button>
            </aside>
        </>
    );
}

