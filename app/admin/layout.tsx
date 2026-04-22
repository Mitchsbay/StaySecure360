import AdminSidebar from '@/components/admin/AdminSidebar'

// All admin pages are fully dynamic — rendered at request time only.
// This prevents Next.js from attempting to pre-render admin pages
// during the build when Supabase env vars are not yet present.
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      {/*
        pt-14 on mobile accounts for the fixed 56px mobile top bar injected by AdminSidebar.
        md:pt-0 removes the padding on desktop where the sidebar is persistent (not fixed).
      */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
