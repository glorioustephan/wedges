"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, SearchIcon } from "@iconicicons/react";
import { Button } from "@lemonsqueezy/wedges";

import { siteConfig } from "@/config/siteConfig";
import { focusClasses } from "@/lib/a11y";
import { cn } from "@/lib/utils";

import { Navigation } from "./Navigation";
import { useSidebar } from "./Providers";

export default function WedgesHeader() {
  const { toggleSidebar, toggleSearch } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      <div className="[&_a]:duration-180 sticky top-0 z-50 border-b border-white/20 bg-primary dark:bg-transparent [&_a]:transition-colors">
        <div className="container flex min-h-[72px] items-center gap-6 md:min-h-[88px]">
          <Link
            aria-label="Wedges home page"
            className={cn(
              focusClasses,
              "hidden shrink-0 whitespace-nowrap text-2xl font-medium text-white outline-white transition-opacity hover:opacity-70 md:block"
            )}
            href={siteConfig.wedgesURL}
          >
            Wedges
          </Link>

          <Navigation
            aria-label="Wedges Nav"
            className="-ml-3 flex-1 justify-center md:flex"
          >
            <Navigation.Item href={siteConfig.wedgesURL}>React</Navigation.Item>
            <Navigation.Item href={siteConfig.wedgesURL + "/figma"}>Figma</Navigation.Item>

            <Navigation.Item asChild active={!pathname.includes("/components")}>
              <Link href="/">Docs</Link>
            </Navigation.Item>

            <Navigation.Item
              asChild
              active={pathname.includes("/components")}
              className="hidden md:inline-flex"
            >
              <Link href="/components">Components</Link>
            </Navigation.Item>
          </Navigation>

          <Navigation
            aria-label="Mobile Menu"
            className="ml-auto flex shrink-0 self-center justify-self-end md:hidden"
          >
            <Button
              isIconOnly
              aria-label="Open search"
              className="duration-180 group h-10 w-10 items-center justify-center transition-colors hover:text-white"
              data-theme="dark"
              variant="transparent"
              onClick={toggleSearch}
            >
              <SearchIcon className="duration-180 text-white transition-colors group-hover:opacity-100" />
            </Button>

            <Button
              isIconOnly
              aria-label="Open menu"
              className="duration-180 group h-10 w-10 items-center justify-center transition-colors hover:text-white"
              data-theme="dark"
              variant="transparent"
              onClick={toggleSidebar}
            >
              <MenuIcon className="duration-180 text-white transition-colors group-hover:opacity-100" />
            </Button>
          </Navigation>
        </div>
      </div>
    </>
  );
}
