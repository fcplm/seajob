import { Sidebar } from '@/components/layout/sidebar'
import { BottomBar } from '@/components/layout/bottom-bar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 md:pb-6">
        {children}
      </main>
      <BottomBar />
    </div>
  )
}
