import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh">
      {/* Left panel — hero with cityscape background */}
      <div className="relative hidden flex-1 items-end overflow-hidden lg:flex">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/BG Image.webp')" }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />

        {/* Branding */}
        <div className="relative z-10 flex flex-col gap-4 p-10 pb-16">
          <h1 className="text-5xl font-bold leading-tight text-white xl:text-6xl">
            Centro de
            <br />
            Operaciones
          </h1>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <span>gestión de tickets</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>control de horas</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>soporte 24/7</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[480px] lg:shrink-0 lg:px-16">
        {/* Logo */}
        <div className="mb-12">
          <span className="text-sm font-semibold tracking-widest text-neon uppercase">
            TicketOps
          </span>
        </div>

        {/* Mobile hero text (shown on small screens) */}
        <div className="mb-8 lg:hidden">
          <h1 className="text-3xl font-bold text-white">
            Centro de
            <br />
            Operaciones
          </h1>
        </div>

        {/* Form header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Ingresá tus credenciales para acceder al panel de soporte técnico
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
