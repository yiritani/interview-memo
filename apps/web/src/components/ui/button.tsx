import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border text-sm font-medium tracking-wide transition-[background-color,border-color,color,transform] outline-none select-none disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-accent bg-accent text-accent-foreground hover:-translate-y-0.5 hover:bg-accent/90 active:translate-y-0",
        outline:
          "border-border bg-transparent text-foreground hover:-translate-y-0.5 hover:border-foreground hover:bg-surface-strong active:translate-y-0",
        secondary:
          "border-transparent bg-surface-strong text-foreground hover:-translate-y-0.5 hover:bg-border active:translate-y-0",
        ghost: "border-transparent text-muted-foreground hover:bg-surface-strong hover:text-foreground",
        destructive: "border-red-800 bg-red-800 text-white hover:bg-red-900",
        link: "border-transparent text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        xs: "h-7 px-2 text-xs",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-7",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
