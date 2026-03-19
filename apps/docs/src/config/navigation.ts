import { type FooterNav, type MainNav, type SecondaryNav } from "@/types/nav";

export const mainNav: MainNav = [
  {
    label: "Platform",
    children: [
      {
        label: "eCommerce",
        children: [
          {
            label: "Subscriptions",
            description: "Maximize your revenue with subscriptions",
            href: "#",
          },
          {
            label: "Payments",
            description: "Payments and billing made easy-peasy",
            href: "#",
          },
          {
            label: "Online Stores",
            description: "Your own online storefront in minutes",
            href: "#",
          },
          {
            label: "Digital Products",
            description: "Sell digital products any way you want",
            href: "#",
          },
          {
            label: "Checkout Overlay",
            description: "Add a native checkout flow",
            href: "#",
          },
          {
            label: "Hosted Checkouts",
            description: "Increase conversions with hosted checkouts",
            href: "#",
          },
        ],
      },
      {
        label: "Features",
        children: [
          {
            label: "Affiliates",
            description: "Empower your superfans with affiliate tools",
            href: "#",
          },
          {
            label: "Usage-based Billing",
            description: "Track usage and bill based on consumption",
            href: "#",
            tag: "new",
          },
          {
            label: "Customer Portal",
            description: "A self-service customer portal for your store",
            href: "#",
            tag: "new",
          },
          {
            label: "Discount Codes",
            description: "Coupons & discounts for a feel-good checkout",
            href: "#",
          },
          {
            label: "Lead Magnets",
            description: "Distribute free products that build interest",
            href: "#",
          },
          {
            label: "Pay What You Want",
            description: "Let customers choose the price they pay",
            href: "#",
          },
        ],
      },
      {
        label: "Reporting",
        children: [
          {
            label: "Merchant of Record",
            description: "Global sales tax & compliance handled for you",
            href: "#",
          },
          {
            label: "Fraud Prevention",
            description: "Your always-on shield from financial fraud",
            href: "#",
          },
          {
            label: "Customer Management",
            description: "Build enduring customer partnerships",
            href: "#",
          },
          {
            label: "Changelog",
            description: "Freshly squeezed platform updates",
            href: "#",
            tag: "updates",
            separator: true,
          },
          {
            label: "Roadmap",
            description: "Learn what features are on the horizon",
            href: "#",
          },
        ],
      },
    ],
  },
  {
    label: "Resources",
    children: [
      {
        label: "Helpful Links",
        children: [
          {
            label: "Help Center",
            description: "Need help or have a question?",
            href: "#",
          },
          {
            label: "Help Docs",
            description: "Detailed help docs and knowledge base",
            href: "#",
          },
          {
            label: "Developer Docs",
            description: "Browse our extensive developer docs",
            href: "#",
          },
          {
            label: "Suggest a Feature",
            description: "Vote on new ideas or suggest your own",
            href: "#",
          },
        ],
      },
      {
        label: "Case Studies",
        buttonLabel: "All studies",
        buttonHref: "#",
        isCaseStudy: true,
      },
      {
        label: "Blog",
        buttonLabel: "All articles",
        buttonHref: "#",
        isBlog: true,
      },
    ],
  },
  { label: "Pricing", href: "#" },
  { label: "Wedges", href: "/" },
  { label: "Help", href: "#" },
];

export const secondaryNav: SecondaryNav = [
  {
    href: "/popular",
    label: "Popular",
    slug: "popular",
  },
];

/**
 * Footer navigation
 *
 * First level is the number of columns, the second level is the menus in each column and the third level is the links in each menu.
 */
export const footerNav: FooterNav = [
  //  first col (Resources + Compare)
  {
    children: [
      // first menu
      {
        label: "Resources",
        children: [
          {
            label: "Help Center",
            href: "#",
          },
          {
            label: "Help Docs",
            href: "#",
          },
          {
            label: "Developer Docs",
            href: "#",
          },
          {
            label: "Guide to MoR",
            href: "#",
          },
          {
            label: "Creators' Guide",
            href: "#",
          },
        ],
      },

      // Compare
      {
        children: [
          {
            label: "Compare",
            children: [
              {
                label: "Gumroad Alternative",
                href: "#",
              },
              {
                label: "Paddle Alternative",
                href: "#",
              },
            ],
          },
        ],
      },
    ],
  },

  // second col
  {
    children: [
      {
        label: "Features",
        children: [
          {
            label: "Affiliates",
            href: "#",
          },
          {
            label: "PayPal Subscriptions",
            href: "#",
          },
          {
            label: "Usage-based Billing",
            href: "#",
          },
          {
            label: "Customer Portal",
            href: "#",
          },
          {
            label: "Discount Codes",
            href: "#",
          },
          {
            label: "Lead Magnets",
            href: "#",
          },
          {
            label: "PWYW Pricing",
            href: "#",
          },
          {
            label: "Roadmap",
            href: "#",
          },
          {
            label: "Changelog",
            href: "#",
          },
          {
            label: "Suggest Features",
            href: "#",
          },
        ],
      },
    ],
  },

  // third col (Platform)
  {
    children: [
      {
        label: "Platform",
        children: [
          {
            label: "Merchant of Record",
            href: "#",
          },
          {
            label: "Subscriptions",
            href: "#",
          },
          {
            label: "Payments",
            href: "#",
          },
          {
            label: "Online Storefront",
            href: "#",
          },
          {
            label: "Digital Products",
            href: "#",
          },
          {
            label: "Checkout Overlays",
            href: "#",
          },
          {
            label: "Hosted Checkouts",
            href: "#",
          },
          {
            label: "Fraud Prevention",
            href: "#",
          },
          {
            label: "Customer Management",
            href: "#",
          },
        ],
      },
    ],
  },

  // fourth col (Company)
  {
    label: "Company",
    children: [
      {
        label: "About",
        href: "#",
      },
      {
        label: "Pricing",
        href: "#",
      },
      {
        label: "Case Studies",
        href: "#",
      },
      {
        label: "Wall of Love",
        href: "#",
      },
      {
        label: "Blog",
        href: "#",
      },
      {
        label: "Brand Assets",
        href: "#",
      },
      {
        label: "Migration Offer",
        href: "#",
      },
      {
        label: "@lmsqueezy",
        href: "https://twitter.com/lmsqueezy",
      },
    ],
  },
];

export const copyrightNav: FooterNav = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "DPA", href: "#" },
];
