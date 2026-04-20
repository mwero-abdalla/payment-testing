import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CheckoutButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
  className?: string;
};

export function CheckoutButton({
  onClick,
  disabled = false,
  isLoading = false,
  label = "Checkout",
  className,
}: CheckoutButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn("w-full", className)}
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
