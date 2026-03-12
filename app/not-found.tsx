import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      {/* Glowing 404 */}
      <div className="relative">
        <h1 className="text-[120px] font-bold leading-none text-white/5 sm:text-[180px]">
          404
        </h1>
        <h1 className="absolute inset-0 flex items-center justify-center text-[120px] font-bold leading-none text-neon/20 blur-2xl sm:text-[180px]">
          404
        </h1>
      </div>

      <div className="relative z-10 -mt-10 flex flex-col items-center gap-3">
        <h2 className="text-2xl font-bold text-white">Página no encontrada</h2>
        <p className="max-w-md text-sm text-white/40">
          La página que buscás no existe o fue movida. Verificá la URL o volvé al
          inicio.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-neon px-5 text-sm font-semibold text-black transition-colors hover:bg-neon/90"
        >
          Volver al Dashboard
        </Link>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 flex items-center gap-2">
        <span className="h-2 w-2 rounded-sm bg-neon" />
        <span className="text-xs font-bold tracking-wider text-white/20 uppercase">
          TicketOps
        </span>
      </div>
    </div>
  );
}
