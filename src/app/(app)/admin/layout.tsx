"use client"

import { AdminRouteProtection } from "@/components/AdminRouteProtection"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminRouteProtection>{children}</AdminRouteProtection>
}

