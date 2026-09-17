import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center border px-2 py-1 text-[10px] font-medium tracking-[0.18em] uppercase",
  {
    variants: {
      variant: {
        default: "border-accent/30 bg-accent/10 text-accent",
        outline: "border-border bg-transparent text-muted-foreground",
        secondary: "border-border bg-surface-strong text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
