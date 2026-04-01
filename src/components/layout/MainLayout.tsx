import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <Sidebar />
      <Header />
      <main className="ml-60 pt-14 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
