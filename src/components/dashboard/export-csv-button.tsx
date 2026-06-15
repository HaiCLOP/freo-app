"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportCsvButtonProps {
  data: any[];
  eventName: string;
}

export function ExportCsvButton({ data, eventName }: ExportCsvButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // Define CSV headers
    const headers = ["Name", "Email", "Phone", "Status", "Registered At", "Checked In At", "UTR ID", "Custom Fields"];

    // Format data into CSV rows
    const rows = data.map((reg) => [
      `"${reg.full_name || ""}"`,
      `"${reg.email || ""}"`,
      `"${reg.phone || ""}"`,
      `"${reg.status || ""}"`,
      `"${new Date(reg.registered_at).toLocaleString()}"`,
      `"${reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString() : "Not Checked In"}"`,
      `"${reg.utr_id || ""}"`,
      `"${reg.custom_fields ? JSON.stringify(reg.custom_fields).replace(/"/g, '""') : ""}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `registrations_${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button 
      onClick={handleExport}
      variant="outline" 
      size="sm" 
      className="rounded-full bg-white text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#f5f5f7] font-medium transition-all"
    >
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  );
}
