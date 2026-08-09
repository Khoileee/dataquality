import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <Sidebar />
      <Topbar />
      <main className="ml-[248px] min-h-screen pt-14">
        <div className="px-6 py-5">{children}</div>
      </main>
    </div>
  )
}
