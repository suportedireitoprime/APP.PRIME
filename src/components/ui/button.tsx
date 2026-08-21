import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/nativeHaptics";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 sm:h-10 px-4 py-2", // h-11 = 44px (iOS minimum touch target)
        sm: "h-10 sm:h-9 rounded-md px-3", // h-10 = 40px
        lg: "h-12 sm:h-11 rounded-md px-8", // h-12 = 48px (Android Material 3 minimum)
        icon: "h-11 w-11 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  hapticFeedback?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, hapticFeedback = true, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (hapticFeedback) {
        haptic.selection(); // Vibração leve para botões
      }
      if (onClick) {
        onClick(e);
      }
    };

    // Acessibilidade extrema: garantir que variant icon tenha aria-label se ausente, ou emitir um console.warn em dev
    if (variant === 'icon' && size === 'icon' && !props['aria-label'] && process.env.NODE_ENV !== 'production') {
      console.warn(`Acessibilidade [a11y]: Botão de ícone renderizado sem 'aria-label' descritivo. \nClasse: ${className}`);
    }

    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        onClick={handleClick} 
        // Melhora a compatibilidade com leitores de tela em elementos Slot customizados
        role={asChild ? "button" : undefined}
        {...props} 
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
