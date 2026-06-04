import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/payments/payment-types";
import { cn } from "@/lib/utils";

const statusLabels: Record<PaymentStatus, string> = {
  CURRENT: "À jour",
  LATE: "En retard",
  PARTIAL: "Partiel",
};

const statusClasses: Record<PaymentStatus, string> = {
  CURRENT: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  LATE: "bg-red-50 text-red-700 hover:bg-red-50",
  PARTIAL: "bg-amber-50 text-amber-700 hover:bg-amber-50",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={cn("font-bold", statusClasses[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export { statusLabels };
