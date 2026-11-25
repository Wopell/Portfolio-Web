import { DATA_MODES, readDataMode } from '../data/worst-case';

/**
 * Selector de datos de prueba (solo desarrollo). Aparece cuando la URL trae
 * `?data=` (demo | worst | empty | one | many) y recarga con el modo elegido,
 * así la selección sobrevive a una recarga. App solo lo monta si
 * import.meta.env.DEV es true: nunca llega a producción.
 */
export default function DevDataToggle() {
  const mode = readDataMode();
  if (!mode) return null;
  const pick = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('data', id);
    window.location.assign(url.toString());
  };
  return (
    <div
      role="group"
      aria-label="Datos de prueba"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 12,
        transform: 'translateX(-50%)',
        zIndex: 2147483000,
        display: 'flex',
        gap: 2,
        padding: 3,
        borderRadius: 999,
        background: '#d4d4d8',
        font: '500 12px/1 system-ui, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {DATA_MODES.map((d) => (
        <button
          key={d.id}
          type="button"
          aria-pressed={mode === d.id}
          onClick={() => pick(d.id)}
          style={{
            padding: '8px 12px',
            borderRadius: 999,
            border: 0,
            cursor: 'pointer',
            color: '#18181b',
            background: mode === d.id ? '#ffffff' : 'transparent',
          }}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
