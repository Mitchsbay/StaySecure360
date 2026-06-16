import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
