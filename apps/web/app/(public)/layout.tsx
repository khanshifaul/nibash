export const runtime = "edge";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <section className="space-y-4">{children}</section>;
}
