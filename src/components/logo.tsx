import Image from "next/image";

/** Lambang Alumni Kedokteran UMM. Versi kecil (256px) supaya ringan dimuat. */
export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <Image
      src="/logo-256.png"
      alt="Lambang Alumni Kedokteran UMM"
      width={256}
      height={256}
      priority
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
