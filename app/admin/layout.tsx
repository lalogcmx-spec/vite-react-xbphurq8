"use client";

import { usePathname } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import type { ReactNode } from "react";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <AdminLayout currentPath={pathname}>{children}</AdminLayout>;
}
