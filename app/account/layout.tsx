'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Package, Heart, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const sidebarLinks = [
  { href: '/account', label: 'بيانات شخصية', icon: User },
  { href: '/account/orders', label: 'طلباتي', icon: Package },
  { href: '/account/wishlist', label: 'المفضلة', icon: Heart },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-xl md:text-2xl font-bold mb-6">حسابي</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <nav className="card p-3 space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-primary-light text-primary'
                    : 'text-text hover:bg-surface-2'
                }`}
              >
                <link.icon className={`w-4 h-4 ${link.href === '/account/wishlist' ? 'text-red-600 fill-red-600' : ''}`} />
                {link.label}
              </Link>
            ))}
            <button
              onClick={async () => { await logout(); window.location.href = '/' }}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  )
}
