import { DashboardSidebar } from '@/components/dashboard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-8">
      <div className="flex gap-8">
        <DashboardSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
