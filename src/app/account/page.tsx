import { AccountOverview } from "@/components/account-overview";

export const metadata = {
  title: "내 정보",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountOverview />;
}
