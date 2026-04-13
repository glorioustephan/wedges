import {
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";

import { cn } from "@/lib/utils";

type ColorsWedgesProps = HTMLAttributes<HTMLElement> & {
  title: string;
};

const ColorsWedges: ForwardRefExoticComponent<
  ColorsWedgesProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ColorsWedgesProps>(({ className, children, title, ...otherProps }, ref) => {
  return (
    <div className="my-8">
      {title ? (
        <div className="mb-3 mt-2 flex items-center gap-2 text-sm font-medium text-surface-900">
          <span>{title}</span>
          <span className="select-none text-xs text-surface-200">•</span>
          <span className="not-prose font-mono text-xs text-surface-500">{`wg-${title.toLowerCase()}`}</span>
        </div>
      ) : null}

      <div ref={ref} className={cn("grid grid-cols-10", className)} {...otherProps}>
        {children}
      </div>
    </div>
  );
});

type ColorProps = HTMLAttributes<HTMLElement> & {
  title: string;
  hex: string;
};

const Color: ForwardRefExoticComponent<ColorProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, ColorProps>(({ className, title, hex, ...otherProps }, ref) => {
  return (
    <div className="group flex w-full flex-col">
      <div
        ref={ref}
        className={cn("h-10 w-full group-first:rounded-l group-last:rounded-r", className)}
        {...otherProps}
      />

      <span className="mt-1 pl-1 text-center text-xs text-surface-700 md:text-start">{title}</span>
      <span className="hidden pl-1 font-mono text-[9px] text-surface-400 md:block">{hex}</span>
    </div>
  );
  });

const ColorThemable: ForwardRefExoticComponent<
  ColorProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ColorProps>(({ className, title, hex, ...otherProps }, ref) => {
  return (
    <div className="group flex w-full flex-col">
      <div
        ref={ref}
        className={cn("h-10 w-full rounded-sm ring-1 ring-inset ring-black/10 sm:h-12", className)}
        {...otherProps}
      />

      <span className="mt-1.5 pl-1 text-xs text-surface-700">{title}</span>
      {hex && <span className="pl-1 font-mono text-[9px] text-surface-400">{hex}</span>}
    </div>
  );
});

Color.displayName = "Color";
ColorsWedges.displayName = "Colors";
ColorThemable.displayName = "ColorThemable";

type ColorsComponent = typeof ColorsWedges & {
  Color: typeof Color;
  ColorThemable: typeof ColorThemable;
};

export const Colors: ColorsComponent = Object.assign(ColorsWedges, { Color, ColorThemable });
