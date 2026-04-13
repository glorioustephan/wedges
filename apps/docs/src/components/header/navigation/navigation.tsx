"use client";

import {
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";

import { cn } from "@/lib/utils";

/* ---------------------------------- Root ---------------------------------- */
type NavRootElement = React.ElementRef<typeof NavigationMenu.Root>;
type NavRootProps = React.ComponentPropsWithoutRef<typeof NavigationMenu.Root>;

const NavRoot: ForwardRefExoticComponent<NavRootProps & RefAttributes<NavRootElement>> =
  forwardRef<NavRootElement, NavRootProps>((props, ref) => {
  const { className, ...otherProps } = props;

  return (
    <NavigationMenu.Root
      className={cn("self-stretch text-[15px] leading-6 text-white/60", className)}
      {...otherProps}
      ref={ref}
    />
  );
  });
NavRoot.displayName = "NavRoot";

/* ---------------------------------- List ---------------------------------- */
type NavListElement = React.ElementRef<typeof NavigationMenu.List>;
type NavListProps = React.ComponentPropsWithoutRef<typeof NavigationMenu.List>;

const NavList: ForwardRefExoticComponent<NavListProps & RefAttributes<NavListElement>> =
  forwardRef<NavListElement, NavListProps>((props, ref) => {
    return <NavigationMenu.List {...props} ref={ref} />;
  });
NavList.displayName = "NavList";

/* --------------------------------- Trigger -------------------------------- */
type NavListTriggerElement = React.ElementRef<typeof NavigationMenu.Trigger>;
type NavListTriggerProps = React.ComponentPropsWithoutRef<typeof NavigationMenu.Trigger>;

const NavListTrigger: ForwardRefExoticComponent<
  NavListTriggerProps & RefAttributes<NavListTriggerElement>
> = forwardRef<NavListTriggerElement, NavListTriggerProps>((props, ref) => {
  return <NavigationMenu.Trigger {...props} ref={ref} />;
});
NavListTrigger.displayName = "NavListTrigger";

/* --------------------------------- Content -------------------------------- */
type NavListContentElement = React.ElementRef<typeof NavigationMenu.Content>;
type NavListContentProps = React.ComponentPropsWithoutRef<typeof NavigationMenu.Content>;

const NavListContent: ForwardRefExoticComponent<
  NavListContentProps & RefAttributes<NavListContentElement>
> = forwardRef<NavListContentElement, NavListContentProps>((props, ref) => {
  return <NavigationMenu.Content {...props} ref={ref} />;
});
NavListContent.displayName = "NavListContent";

/* ---------------------------------- Item ---------------------------------- */
type NavItemElement = React.ElementRef<typeof NavigationMenu.Item>;
type NavItemProps = React.ComponentPropsWithoutRef<typeof NavigationMenu.Item>;

const NavItem: ForwardRefExoticComponent<NavItemProps & RefAttributes<NavItemElement>> =
  forwardRef<NavItemElement, NavItemProps>((props, ref) => {
    return <NavigationMenu.Item {...props} ref={ref} />;
  });
NavItem.displayName = "NavItem";

/* ---------------------------------- Link ---------------------------------- */
type NavLinkElement = React.ElementRef<typeof NavigationMenu.Link>;
type NavLinkProps = React.ComponentPropsWithoutRef<typeof NavigationMenu.Link>;

const NavLink: ForwardRefExoticComponent<NavLinkProps & RefAttributes<NavLinkElement>> =
  forwardRef<NavLinkElement, NavLinkProps>((props, ref) => {
    return <NavigationMenu.Link {...props} ref={ref} />;
  });
NavLink.displayName = "NavLink";

/* ----------------------------------- Sub ---------------------------------- */
type NavItemSubElement = React.ElementRef<typeof NavigationMenu.Sub>;
type NavItemSubProps = React.ComponentPropsWithoutRef<typeof NavigationMenu.Sub>;

const NavItemSub: ForwardRefExoticComponent<
  NavItemSubProps & RefAttributes<NavItemSubElement>
> = forwardRef<NavItemSubElement, NavItemSubProps>((props, ref) => {
  return <NavigationMenu.Sub {...props} ref={ref} />;
});
NavItemSub.displayName = "NavItemSub";

/* -------------------------------- Viewport -------------------------------- */
type NavViewportElement = React.ElementRef<typeof NavigationMenu.Viewport>;
type NavViewportProps = React.ComponentPropsWithoutRef<typeof NavigationMenu.Viewport>;

const NavViewport: ForwardRefExoticComponent<
  NavViewportProps & RefAttributes<NavViewportElement>
> = forwardRef<NavViewportElement, NavViewportProps>((props, ref) => {
  return <NavigationMenu.Viewport {...props} ref={ref} />;
});
NavViewport.displayName = "NavViewport";

/* ---------------------------------- Export --------------------------------- */
type NavigationComponent = typeof NavRoot & {
  Root: typeof NavRoot;
  List: typeof NavList;
  Trigger: typeof NavListTrigger;
  Content: typeof NavListContent;
  Item: typeof NavItem;
  Link: typeof NavLink;
  Sub: typeof NavItemSub;
  Viewport: typeof NavViewport;
};

export const Navigation: NavigationComponent = Object.assign(NavRoot, {
  Root: NavRoot,
  List: NavList,
  Trigger: NavListTrigger,
  Content: NavListContent,
  Item: NavItem,
  Link: NavLink,
  Sub: NavItemSub,
  Viewport: NavViewport,
});
