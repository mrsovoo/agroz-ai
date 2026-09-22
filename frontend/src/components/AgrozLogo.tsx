import Image from "next/image";

export default function AgrozLogo({
  className = "h-8 w-auto",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/logo.svg"
        alt="Agroz AI"
        className="h-full w-auto object-contain"
        style={variant === "dark" ? { filter: "brightness(0) invert(1)" } : undefined}
      />
    </div>
  );
}
