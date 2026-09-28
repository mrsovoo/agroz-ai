export default function AgrozLogo({
  className = "h-8 w-auto",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Yashil dumaloq belgi */}
      <img
        src="/logo-icon.svg"
        alt="Agroz"
        className="h-8 w-8 object-contain shrink-0"
      />

      {/* AgrozGO matni */}
      <div className="flex items-center font-black tracking-tight leading-none text-[26px]">
        <span className="text-[#1c1c1e]">Agroz</span>
        <span className="text-[#f59e0b]">GO</span>
      </div>
    </div>
  );
}

