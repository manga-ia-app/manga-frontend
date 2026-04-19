"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface NavigationButtonProps {
  label: string;
  route: string;
}

export function NavigationButton({ label, route }: NavigationButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-2 gap-2"
      onClick={() => router.push(route)}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
