'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BadgePercent,
  Receipt,
  Building2,
  LogOut,
  ChevronRight,
  TrendingDown,
} from 'lucide-react'

interface SidebarProps {
  userEmail?: string
  role?: string
  onLogout: () => Promise<void>
}

export default function Sidebar({ userEmail, role, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const isSuperAdmin = role === 'super_admin'

  const navItems = [
    {
      title: 'Dashboard สรุปภาพรวม',
      href: '/',
      icon: LayoutDashboard,
      superOnly: false,
    },
    {
      title: 'บันทึกยอดฝาก-ถอน',
      href: '/records/daily',
      icon: BadgePercent,
      superOnly: false,
    },
    {
      title: 'บันทึกค่าใช้จ่าย',
      href: '/records/expenses',
      icon: Receipt,
      superOnly: true,
    },
    {
      title: 'วิเคราะห์หมวดค่าใช้จ่าย',
      href: '/expenses-summary',
      icon: TrendingDown,
      superOnly: true,
    },
    {
      title: 'จัดการแบรนด์',
      href: '/brands',
      icon: Building2,
      superOnly: true,
    },
  ]

  const visibleItems = navItems.filter((item) => !item.superOnly || isSuperAdmin)

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between p-5 shrink-0 select-none">
      <div className="space-y-6">
        {/* Brand / Logo */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              D
            </div>
            <div>
              <h2 className="font-bold text-base !text-black leading-tight">Daily Tracking</h2>
              <span className="text-[11px] text-slate-400 font-medium">Finance Management</span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isSuperAdmin
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </span>
          </div>
          <p className="text-xs font-semibold !text-black truncate" title={userEmail}>
            {userEmail}
          </p>
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
            เมนูการใช้งาน
          </span>
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-600 hover:text-black hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.title}</span>
                </div>
                {active && <ChevronRight className="w-4 h-4 opacity-80" />}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout */}
      <form action={onLogout} className="pt-4 border-t border-slate-100">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </form>
    </aside>
  )
}