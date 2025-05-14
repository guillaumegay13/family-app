"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
    const pathname = usePathname();
    const familyName = process.env.NEXT_PUBLIC_FAMILY_NAME || 'DefaultFamily';

    const navItems = [
        { title: 'Accueil', path: '/' },
        { title: 'Tâches Quotidiennes', path: '/daily-todo' },
        { title: 'Déclaration Les Lauriers', path: '/checklist' },
    ];

    return (
        <nav className="w-full py-5 mb-10 border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-center">
                    <Link href="/" className="text-2xl font-medium text-gray-900 mb-4 md:mb-0">
                        {familyName}
                    </Link>

                    <div className="md:ml-12 flex items-center justify-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`text-base transition-colors ${pathname === item.path
                                    ? 'text-indigo-600 font-medium'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
} 