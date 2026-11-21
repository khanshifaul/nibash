import { PushNotifications } from "@/components/push-notifications";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      {children}
      <PushNotifications />
    </section>
  );
}
