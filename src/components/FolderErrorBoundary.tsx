import React from 'react';

interface Props {
  children?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary específico para aislar cualquier fallo en el módulo de carpetas
 * y garantizar que la página NUNCA quede en blanco / negro si algo falla internamente.
 */
export class FolderErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[FolderErrorBoundary] Error atrapado en ProjectFolders:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full my-12 p-8 border border-black/20 rounded-2xl bg-[#fffdfa]/80 text-center font-mono">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-1">
            MÓDULO SELECTED PROJECTS // TEMPORALMENTE NO DISPONIBLE
          </span>
          <p className="text-[11px] text-zinc-400">
            {this.state.error?.message || 'Ocurrió un error inesperado al renderizar las carpetas.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
