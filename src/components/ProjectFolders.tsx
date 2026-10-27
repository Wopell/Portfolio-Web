import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CategoryData } from '../data/projects';

/**
 * =========================================================================
 * CONFIGURACIÓN DE CARPETAS - FASES 1 A 6 (COMPLETO)
 * =========================================================================
 * Cumple estrictamente con docs/specs/carpetas.md:
 * - F1: Cascada en reposo (1200px centrado), outline #4A4036 (2px continuo),
 *       placeholders neutros locales.
 * - F2: Hover 3D con rotación horizontal sobre eje inferior (rotateX: -14°),
 *       elevación Y (-32px), compactación de las demás carpetas (-18px arriba,
 *       +28px abajo), intención de 80ms para evitar parpadeos, soporte teclado (Tab)
 *       y touch (doble tap: asomar -> abrir). Soporte prefers-reduced-motion.
 * - F3: Rotación cíclica de previews cada 10s en la carpeta asomada, pausa al salir,
 *       precarga de la siguiente imagen, indicador numérico (ej. "01 / 04"),
 *       correspondencia unívoca de click y crossfade suave.
 * - F4: Apertura y vuelo a pantalla completa: las demás carpetas salen del viewport
 *       (primera: bajan; intermedia: arriba suben, abajo bajan; última: suben).
 * - F5: Cierre y archivado elástico detrás del bolsillo, reacomodación en cascada,
 *       restauración de scroll y foco, respuesta en < 300ms.
 * - F6: Responsive 1920px a 360px, accesibilidad por teclado y estabilidad sin fugas.
 * =========================================================================
 */
export const FOLDERS_CONFIG = {
  // 0. CONTROL DE FASES
  enableInteraction: true,

  // 1. GEOMETRÍA EN REPOSO (1920px)
  topOffsets: [0, 58, 109, 194],
  outlineColor: '#4A4036',

  // 2. PARÁMETROS CINÉTICOS DE HOVER (Fase 2)
  hoverRotateX: -14,          // Inclinación 3D en grados (rango spec: -10° a -18°)
  hoverLiftY: -32,            // Elevación de la carpeta activa en px (-32px)
  compactUpY: -18,            // Desplazamiento hacia arriba de carpetas superiores en px
  compactDownY: 28,           // Desplazamiento hacia abajo de carpetas inferiores en px
  intentDebounceMs: 80,       // Umbral de intención para hover estable sin parpadeo (80ms)

  // 3. ROTACIÓN DE PREVIEWS (Fase 3)
  rotationIntervalMs: 10000,  // Rotación cada 10 segundos

  // 4. SALIDA Y CIERRE (Fases 4 & 5)
  exitOffsetUpY: -1400,       // Desplazamiento fuera del viewport hacia arriba
  exitOffsetDownY: 1400,      // Desplazamiento fuera del viewport hacia abajo

  // 5. PALETA Y DIMENSIONES DE PESTAÑAS
  categories: {
    'category-animation': {
      tabBg: '#3B5BDB',       // Azul plano
      tabWidth: 260,
      tabLeft: 0,
      slug: 'animation',
    },
    'category-3d-art': {
      tabBg: '#F5C518',       // Amarillo plano
      tabWidth: 150,
      tabLeft: 72,
      slug: '3d-art',
    },
    'category-ia': {
      tabBg: '#8C8CF0',       // Lila plano
      tabWidth: 140,
      tabLeft: 180,
      slug: 'ia',
    },
    'category-post-production': {
      tabBg: '#F26B6B',       // Coral plano
      tabWidth: 360,
      tabLeft: 0,
      slug: 'post-production',
    },
  },
};

interface ProjectFoldersProps {
  categories: CategoryData[];
  onOpenProject?: (categoryId: string, projectId: string) => void;
  isCategoryOpen?: boolean;
  activeCategoryId?: string | null;
}

export const ProjectFolders: React.FC<ProjectFoldersProps> = ({
  categories,
  onOpenProject,
  isCategoryOpen = false,
  activeCategoryId = null,
}) => {
  // Estado de carpeta activa en hover o foco de teclado (null = reposo total)
  const [activeFolderIndex, setActiveFolderIndex] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fase 3: Registro de proyecto activo por categoría { [catId]: projectIndex }
  const [activeProjectIndices, setActiveProjectIndices] = useState<Record<string, number>>({});
  const preloadedUrls = useRef<Set<string>>(new Set());

  // Referencias a los botones de carpeta para devolver foco en Fase 5
  const folderRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Detección reactiva de prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // FASE 3: Rotación Cíclica de Previews (10 segundos) en la carpeta activa
  useEffect(() => {
    if (activeFolderIndex === null || !FOLDERS_CONFIG.enableInteraction || isCategoryOpen) {
      return;
    }

    const activeCat = categories[activeFolderIndex];
    if (!activeCat || !activeCat.projects || activeCat.projects.length <= 1) {
      return;
    }

    // Intervalo de 10 segundos
    const timer = setInterval(() => {
      setActiveProjectIndices((prev) => {
        const current = prev[activeCat.id] ?? 0;
        const next = (current + 1) % activeCat.projects.length;
        return { ...prev, [activeCat.id]: next };
      });
    }, FOLDERS_CONFIG.rotationIntervalMs);

    // Limpieza inmediata del temporizador al perder el hover o cambiar de carpeta (cero fugas)
    return () => {
      clearInterval(timer);
    };
  }, [activeFolderIndex, categories, isCategoryOpen]);

  // FASE 3: Precarga de la siguiente imagen en segundo plano (con caché de URLs para evitar fugas de memoria)
  useEffect(() => {
    if (activeFolderIndex === null || isCategoryOpen) return;
    const activeCat = categories[activeFolderIndex];
    if (!activeCat || !activeCat.projects || activeCat.projects.length <= 1) return;

    const currentIdx = activeProjectIndices[activeCat.id] ?? 0;
    const nextIdx = (currentIdx + 1) % activeCat.projects.length;
    const nextProj = activeCat.projects[nextIdx];
    if (nextProj?.image && !preloadedUrls.current.has(nextProj.image)) {
      preloadedUrls.current.add(nextProj.image);
      const preloadImg = new Image();
      preloadImg.src = nextProj.image;
    }
  }, [activeFolderIndex, activeProjectIndices, categories, isCategoryOpen]);

  // Manejo de intención de hover (80ms para estabilidad sin micro-parpadeos)
  const handlePointerEnter = useCallback((idx: number) => {
    if (!FOLDERS_CONFIG.enableInteraction || isCategoryOpen) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveFolderIndex(idx);
    }, FOLDERS_CONFIG.intentDebounceMs);
  }, [isCategoryOpen]);

  const handlePointerLeave = useCallback(() => {
    if (!FOLDERS_CONFIG.enableInteraction) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveFolderIndex(null);
    }, FOLDERS_CONFIG.intentDebounceMs);
  }, []);

  // FASES 2, 3 & 4: Apertura y correspondencia unívoca
  const handleFolderClick = useCallback((idx: number, cat: CategoryData) => {
    if (!FOLDERS_CONFIG.enableInteraction) return;

    if (activeFolderIndex !== idx) {
      // Primer toque: asoma y compacta las demás
      setActiveFolderIndex(idx);
    } else {
      // Segundo toque o click cuando ya está asomada: abre la carpeta con el trabajo visible
      const currentProjIdx = activeProjectIndices[cat.id] ?? 0;
      const currentProj = cat.projects[currentProjIdx] || cat.projects[0];
      if (onOpenProject && currentProj) {
        onOpenProject(cat.id, currentProj.id);
      }
    }
  }, [activeFolderIndex, activeProjectIndices, onOpenProject]);

  // Índice de carpeta actualmente abierta en modal/catálogo
  const openedFolderIndex = isCategoryOpen && activeCategoryId
    ? categories.findIndex((c) => c.id === activeCategoryId)
    : -1;

  return (
    <div
      id="selected-projects"
      className="w-full pt-4 pb-10 relative select-none overflow-visible"
      onPointerLeave={handlePointerLeave}
    >
      {/* Título de la sección */}
      <div className="text-center mb-12 sm:mb-14">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-tight text-zinc-950 uppercase">
          SELECTED PROJECTS
        </h2>
      </div>

      {/* Contenedor de la baraja en cascada con perspectiva 3D preservada */}
      <div
        className="w-full relative mx-auto h-[540px] sm:h-[560px] overflow-visible"
        style={{
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        }}
      >
        {categories.map((cat, idx) => {
          const isHeroInRest = idx === 3;
          const isHovered = activeFolderIndex === idx;
          const hasActive = activeFolderIndex !== null;
          const isThisFolderOpen = openedFolderIndex === idx;

          // FASE 3: Proyecto actualmente visible en esta carpeta
          const currentProjIdx = activeProjectIndices[cat.id] ?? 0;
          const currentProj = cat.projects[currentProjIdx] || cat.projects[0];
          const totalProjects = cat.projects.length;

          // Imagen activa a renderizar
          let currentSrc = currentProj ? currentProj.image : cat.image;
          if (isHeroInRest && !hasActive && openedFolderIndex === -1 && currentProjIdx === 0) {
            currentSrc = '/ref/tomy_vintage_card.png';
          }

          // Cálculo cinético de transformaciones (Fases 2, 4 y 5)
          let translateY = 0;
          let rotateX = 0;
          let zIndex = 10 + idx * 10;
          let scale = 1.0;
          let opacity = 1.0;
          let pointerEvents: 'auto' | 'none' = 'auto';

          if (openedFolderIndex !== -1) {
            // =========================================================================
            // FASE 4: APERTURA (Las demás carpetas salen del viewport)
            // =========================================================================
            if (idx < openedFolderIndex) {
              // Si la carpeta abierta está abajo, las carpetas superiores suben fuera de pantalla
              translateY = FOLDERS_CONFIG.exitOffsetUpY;
              opacity = 0;
              pointerEvents = 'none';
            } else if (idx > openedFolderIndex) {
              // Si la carpeta abierta está arriba, las carpetas inferiores bajan fuera de pantalla
              translateY = FOLDERS_CONFIG.exitOffsetDownY;
              opacity = 0;
              pointerEvents = 'none';
            } else {
              // Carpeta abierta: elevada y activa
              translateY = FOLDERS_CONFIG.hoverLiftY;
              zIndex = 60;
              scale = 1.01;
            }
          } else if (FOLDERS_CONFIG.enableInteraction && hasActive) {
            // =========================================================================
            // FASE 2: HOVER 3D Y COMPACTACIÓN
            // =========================================================================
            if (isHovered) {
              // Carpeta activa: se levanta con rotación 3D sobre eje horizontal inferior
              translateY = FOLDERS_CONFIG.hoverLiftY;
              rotateX = prefersReducedMotion ? 0 : FOLDERS_CONFIG.hoverRotateX;
              zIndex = 60;
              scale = 1.01;
            } else if (idx < activeFolderIndex) {
              // Carpetas superiores: suben para compactarse y despejar la vista
              translateY = FOLDERS_CONFIG.compactUpY;
            } else if (idx > activeFolderIndex) {
              // Carpetas inferiores: bajan para compactarse
              translateY = FOLDERS_CONFIG.compactDownY;
            }
          }

          const baseTopOffset = FOLDERS_CONFIG.topOffsets[idx] ?? idx * 58;
          const currentTopOffset = baseTopOffset + translateY;

          const catConfig =
            FOLDERS_CONFIG.categories[cat.id as keyof typeof FOLDERS_CONFIG.categories] || {
              tabBg: cat.badgeColor,
              tabWidth: 180,
              tabLeft: 0,
              slug: cat.id,
            };

          const W_tab = catConfig.tabWidth;
          const H_tab = 38;
          const filletEnd = W_tab + 18;
          const tabLeft = catConfig.tabLeft;

          // Altura de la tarjeta de preview:
          // - En reposo: 004 está expandida (~324px), 001..003 compactas (65px).
          // - Con hover activo en esta carpeta: se expande a 324px mostrando la preview grande.
          // - Con hover activo en OTRA carpeta: se compacta a 50px (incluyendo 004).
          let cardHeight = '65px';
          if (!hasActive && openedFolderIndex === -1) {
            cardHeight = isHeroInRest ? 'auto' : '65px';
          } else {
            cardHeight = isHovered || isThisFolderOpen ? '324px' : '50px';
          }

          return (
            <div
              key={cat.id}
              ref={(el) => { folderRefs.current[idx] = el; }}
              className="absolute inset-x-0 w-full cursor-pointer"
              style={{
                top: `${currentTopOffset}px`,
                zIndex,
                transformOrigin: 'bottom center',
                transform: `rotateX(${rotateX}deg) scale(${scale})`,
                opacity,
                pointerEvents,
                transition: prefersReducedMotion
                  ? 'opacity 300ms ease'
                  : 'top 460ms cubic-bezier(0.16, 1, 0.3, 1), transform 460ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms ease',
                willChange: 'transform, top, opacity',
              }}
              onPointerEnter={() => handlePointerEnter(idx)}
              onClick={() => handleFolderClick(idx, cat)}
              tabIndex={0}
              role="button"
              aria-label={`Carpeta ${cat.number} ${cat.title}`}
              data-testid={`folder-${idx}`}
              data-category-id={cat.id}
              data-active-project-id={currentProj?.id}
              onFocus={() => setActiveFolderIndex(idx)}
              onBlur={() => setActiveFolderIndex(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFolderClick(idx, cat);
                }
              }}
            >
              <div className="relative w-full">
                {/* =========================================================================
                   PARTE 1: LA CARPETA COMPLETA DE COLOR PLANO (Pestaña + Cuerpo completo)
                   ========================================================================= */}
                <div className="w-full relative">
                  {/* Pestaña superior */}
                  <div
                    className="relative flex items-end h-[38px] z-10 pointer-events-none"
                    style={{ paddingLeft: `${tabLeft}px` }}
                  >
                    <svg
                      width={filletEnd + 4}
                      height={H_tab + 2}
                      viewBox={`-1 -1 ${filletEnd + 6} ${H_tab + 4}`}
                      className="block select-none overflow-visible"
                    >
                      {/* Relleno con el color de la categoría */}
                      <path
                        d={`M 0 ${H_tab} L 0 12 Q 0 0 12 0 L ${W_tab - 10} 0 Q ${W_tab} 0 ${W_tab} 10 L ${W_tab} 22 C ${W_tab} 30 ${W_tab + 8} ${H_tab} ${filletEnd} ${H_tab} L 0 ${H_tab} Z`}
                        fill={catConfig.tabBg}
                      />

                      {/* Contorno continuo #4A4036 (2px): lado izquierdo, parte superior y empalme curvo */}
                      <path
                        d={`M 0 ${H_tab} L 0 12 Q 0 0 12 0 L ${W_tab - 10} 0 Q ${W_tab} 0 ${W_tab} 10 L ${W_tab} 22 C ${W_tab} 30 ${W_tab + 8} ${H_tab} ${filletEnd} ${H_tab}`}
                        stroke="#4A4036"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />

                      {/* Texto monoespaciado en mayúsculas exclusivo de la pestaña */}
                      <text
                        x="16"
                        y="24"
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                        fontSize="12.5"
                        fontWeight="900"
                        fill="#18181b"
                        letterSpacing="1"
                      >
                        {cat.number} // {cat.title}
                      </text>
                    </svg>
                  </div>

                  {/* Cuerpo completo de la carpeta de color plano (fondo de la baraja) */}
                  <div
                    className="w-full absolute inset-x-0 top-[36px] bottom-0 border-2 border-[#4A4036] rounded-tr-[24px] sm:rounded-tr-[28px] rounded-b-[24px] sm:rounded-b-[28px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
                    style={{
                      backgroundColor: catConfig.tabBg,
                    }}
                  />
                </div>

                {/* =========================================================================
                   PARTE 2: EL TRABAJO / PREVIEW CON MÁSCARA QUE CUBRE TODO MENOS LA PESTAÑA
                   ========================================================================= */}
                <div
                  className="w-full relative -mt-[2px] border-2 border-[#4A4036] rounded-tr-[24px] sm:rounded-tr-[28px] rounded-b-[24px] sm:rounded-b-[28px] overflow-hidden z-20 group"
                  style={{
                    height: cardHeight,
                    backgroundColor: isHeroInRest ? '#0c0d10' : '#14151a',
                    boxShadow: isHovered
                      ? '0 24px 48px -12px rgba(0, 0, 0, 0.28), 0 12px 24px -8px rgba(0, 0, 0, 0.18)'
                      : '0 4px 12px rgba(0, 0, 0, 0.05)',
                    transition: prefersReducedMotion
                      ? 'none'
                      : 'height 360ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 360ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {/* FASE 3: Imagen activa con cross-fade y correspondencia de src */}
                  <img
                    key={currentSrc}
                    src={currentSrc}
                    alt={currentProj?.title || ''}
                    data-testid={`preview-image-${cat.id}`}
                    data-project-id={currentProj?.id}
                    className="w-full h-full object-cover object-top select-none pointer-events-none block rounded-b-[22px] sm:rounded-b-[26px] animate-[fadeIn_400ms_ease-out]"
                  />

                  {/* FASE 3: Indicador visual de conteo numérico (ej: "01 / 04") */}
                  {isHovered && totalProjects > 0 && (
                    <div
                      className="absolute bottom-4 right-5 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-white shadow-lg pointer-events-none select-none transition-all duration-300"
                      data-testid="preview-pagination-indicator"
                      data-category-id={cat.id}
                    >
                      <span className="font-mono text-xs font-bold tracking-wider">
                        {String(currentProjIdx + 1).padStart(2, '0')} / {String(totalProjects).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
