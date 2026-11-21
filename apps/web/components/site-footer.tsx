import Link from "next/link";
import { Logo } from "@/components/logo";

const footerSections = [
  {
    title: "Explore",
    links: [
      { href: "/search", label: "Search properties" },
      { href: "/sign-up", label: "Create account" },
    ],
  },
  {
    title: "For owners",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/properties/new", label: "List a property" },
      { href: "/dashboard/inbox", label: "Inbox" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/dashboard/profile", label: "Profile" },
      { href: "/forgot-password", label: "Forgot password" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          <div>
            <Link href="/" className="inline-block">
              <Logo />
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Nibash helps renters discover verified apartments and helps owners manage listings,
              inquiries, and property details in one place.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Nibash. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/search" className="transition-colors hover:text-foreground">
              Browse listings
            </Link>
            <Link
              href="/dashboard/properties/new"
              className="transition-colors hover:text-foreground"
            >
              List your property
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
