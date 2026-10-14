import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group !z-[9999]"
      style={{
        top: 'calc(var(--sai-top, env(safe-area-inset-top, 0px)) + 14px)',
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-900/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-white/15 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:px-5 group-[.toaster]:py-3.5 group-[.toaster]:text-sm group-[.toaster]:justify-center",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
