"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type CheckoutButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
};

export function CheckoutButton({
  onClick,
  disabled = false,
  isLoading = false,
  label = "Checkout",
}: CheckoutButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Processing...
        </span>
      ) : (
        label
      )}
    </Button>
  );
}
