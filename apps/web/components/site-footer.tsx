import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground mt-3">
              Find verified apartments across buildings. Compare details, inquire, and move in with confidence.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-foreground transition-colors">Search properties</Link></li>
              <li><Link href="/search" className="hover:text-foreground transition-colors">Featured properties</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">For owners</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link href="/dashboard/properties/new" className="hover:text-foreground transition-colors">Add property</Link></li>
              <li><Link href="/dashboard/inbox" className="hover:text-foreground transition-colors">Inbox</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link></li>
              <li><Link href="/dashboard/profile" className="hover:text-foreground transition-colors">Profile</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} nibash. All rights reserved.</p>
          <p>Built for renters and property owners.</p>
        </div>
      </div>
    </footer>
  );
}
