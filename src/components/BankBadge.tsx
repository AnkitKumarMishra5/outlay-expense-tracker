import { bankById } from "@/lib/banks";

export default function BankBadge({ bankId, size = 36 }: { bankId: string; size?: number }) {
  const bank = bankById(bankId);
  return (
    <span
      aria-hidden
      title={bank.name}
      className="inline-flex shrink-0 select-none items-center justify-center rounded-lg font-bold"
      style={{
        width: size,
        height: size,
        background: bank.color,
        color: bank.fg ?? "#ffffff",
        fontSize: size * 0.38,
        letterSpacing: "0.02em",
      }}
    >
      {bank.short}
    </span>
  );
}
