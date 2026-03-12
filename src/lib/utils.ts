import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateForCaseNo(): string {
  const now = new Date();
  const year = String(now.getFullYear() + 543).slice(-2); // Thai year 2 digits
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`; // DD-MM-YY
}

// Keeping a simple random fallback just in case
export function generateCaseNoFallback(): string {
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, "0");
  return `HH-${formatDateForCaseNo()}-0-${random}`;
}

export function generateTrackingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: "เปิด",
    IN_PROGRESS: "กำลังดำเนินการ",
    WAITING_INFO: "รอข้อมูลเพิ่มเติม",
    RESOLVED: "แก้ไขแล้ว",
    CLOSED: "ปิดเคส",
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    WAITING_INFO: "bg-orange-100 text-orange-800",
    RESOLVED: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    LOW: "ต่ำ",
    MEDIUM: "ปานกลาง",
    HIGH: "สูง",
    CRITICAL: "วิกฤต",
  };
  return map[priority] || priority;
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-700",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };
  return map[priority] || "bg-gray-100 text-gray-700";
}

export function getChannelLabel(channel: string): string {
  return channel === "LINE" ? "Line" : "เว็บไซต์";
}
