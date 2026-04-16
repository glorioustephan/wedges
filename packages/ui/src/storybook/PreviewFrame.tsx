import * as React from "react";

import { cn } from "../helpers/utils";

type PreviewFrameAlign = "start" | "center" | "end";

type PreviewFrameProps = {
  align?: PreviewFrameAlign;
  children: React.ReactNode;
};

export function PreviewFrame({ align = "center", children }: PreviewFrameProps) {
  return (
    <div className="preview not-prose relative flex w-full max-w-7xl items-center justify-center rounded-lg border border-surface-100 bg-background text-sm text-foreground shadow-wg-xs">
      <div
        className={cn("flex min-h-[300px] w-full overflow-x-auto p-10", {
          "items-center": align === "center",
          "items-start": align === "start",
          "items-end": align === "end",
        })}
      >
        <div className="mx-auto block w-full min-w-fit text-center">{children}</div>
      </div>
    </div>
  );
}
