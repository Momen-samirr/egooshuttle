"use client";

import { DriverManagementTab } from "@/features/admin/components/DriverManagementTab";

export default function AdminDriversPage() {
  return (
    <div className="space-y-12">
      <section>
        <DriverManagementTab />
      </section>
    </div>
  );
}
