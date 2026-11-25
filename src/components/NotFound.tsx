import { Link } from 'react-router-dom';

/**
 * Ruta inexistente. Antes quedaba la pantalla negra con la navbar sola; ahora
 * el mismo papel del sitio, una línea y una salida.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f2efe6] text-[#191510] flex items-center px-4 sm:px-10">
      <div className="max-w-[1520px] w-full mx-auto">
        <p
          className="text-[0.875rem] font-semibold uppercase tracking-[0.08em] text-[#191510]/60"
          style={{ fontFamily: 'var(--arch-sans, Inter, sans-serif)' }}
        >
          Error 404
        </p>
        <h1
          className="mt-3 text-[3.5rem] sm:text-[5rem] leading-[0.95]"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Esta página no existe.
        </h1>
        <Link
          to="/works"
          className="mt-8 inline-flex items-center min-h-12 px-[26px] rounded-full bg-[#191510] text-[#f2efe6] text-base font-semibold transition-colors duration-200 ease-[ease] hover:bg-[#2f6f6b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f6f6b]"
          style={{ fontFamily: 'var(--arch-sans, Inter, sans-serif)' }}
        >
          Ver trabajos
        </Link>
      </div>
    </main>
  );
}
