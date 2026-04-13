"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

type ScrollAreaElement = ElementRef<typeof ScrollAreaPrimitive.Root>;
type ScrollAreaProps = ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>;

const ScrollArea: ForwardRefExoticComponent<
  ScrollAreaProps & RefAttributes<ScrollAreaElement>
> = forwardRef<ScrollAreaElement, ScrollAreaProps>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

type ScrollBarElement = ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>;
type ScrollBarProps = ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>;

const ScrollBar: ForwardRefExoticComponent<ScrollBarProps & RefAttributes<ScrollBarElement>> =
  forwardRef<ScrollBarElement, ScrollBarProps>(
    ({ className, orientation = "vertical", ...props }, ref) => (
      <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        className={cn(
          "flex touch-none select-none transition-colors",
          orientation === "vertical" && "h-full w-2 border-l border-l-transparent p-[1px]",
          orientation === "horizontal" && "h-2 flex-col border-t border-t-transparent p-[1px]",
          className
        )}
        orientation={orientation}
        {...props}
      >
        <ScrollAreaPrimitive.ScrollAreaThumb
          className={cn(
            "relative rounded-full bg-surface-100",
            orientation === "vertical" && "flex-1"
          )}
        />
      </ScrollAreaPrimitive.ScrollAreaScrollbar>
    )
  );

ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
