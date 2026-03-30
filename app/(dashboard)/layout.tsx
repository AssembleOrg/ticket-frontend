import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/lib/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-dvh">
        <Navbar />
        <main className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </AuthProvider>
  );
}
