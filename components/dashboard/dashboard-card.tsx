import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  title?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function DashboardCard({
  title,
  action,
  className,
  contentClassName,
  children,
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/60",
        className
      )}
    >
      {(title || action) && (
        <CardHeader className="flex-row items-center justify-between gap-3 px-5 pt-5">
          {title ? (
            <CardTitle className="text-base font-semibold text-slate-950">
              {title}
            </CardTitle>
          ) : (
            <div />
          )}
          {action}
        </CardHeader>
      )}
      <CardContent className={cn("px-5 pb-5", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
