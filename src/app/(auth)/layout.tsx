import Link from "next/link";
import { Logo } from "@/components/logo";

export default function TataLetakAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-14 sm:py-20">
      <Link href="/" className="mx-auto mb-8 flex items-center gap-2.5">
        <Logo className="size-16" />
        <span className="text-lg font-bold tracking-tight text-slate-900">Alumni Kedokteran UMM</span>
      </Link>
      {children}
    </div>
  );
}
