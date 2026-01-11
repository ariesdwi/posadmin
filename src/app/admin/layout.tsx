import AdminSidebar from "@/components/layout/AdminSidebar";
import Header from "@/components/layout/Header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Header />
        {children}
      </div>
    </div>
  );
}
