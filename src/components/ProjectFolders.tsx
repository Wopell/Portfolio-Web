import React from 'react';
import { CategoryData } from '../data/projects';

/**
 * =========================================================================
 * CONFIGURACIÓN DE CARPETAS - FASE 1 (ENSAMBLADO FIEL A LA REFERENCIA)
 * =========================================================================
 * Estructura de dos capas por carpeta (según referencia del usuario):
 * 1. Capa inferior: Carpeta completa de color plano con pestaña y contorno #4A4036.
 * 2. Capa superior: El trabajo/preview con máscara redondeada que cubre todo
 *    el cuerpo de la carpeta, dejando asomar únicamente la pestaña ("la etiqueta").
 * 3. Cascada apretada: Salto de 34px entre carpetas.
 * 4. Interacción desactivada: enableInteraction = false.
 * =========================================================================
 */
export const FOLDERS_CONFIG = {
  // 0. CONTROL DE FASES (Interacción bloqueada en reposo hasta aprobación)
  enableInteraction: false,

  // 1. GEOMETRÍA EN REPOSO
  stepYPx: 34,                // Salto vertical exacto entre carpetas (~34px visible)
  outlineColor: '#4A4036',    // Contorno oscuro fino continuo (~2px, gris-marrón)

  // 2. PALETA Y DIMENSIONES DE PESTAÑAS (Carpeta completa de color plano)
  categories: {
    'category-animation': {
      tabBg: '#3B5BDB',       // Azul plano
      tabWidth: 168,
    },
    'category-3d-art': {
      tabBg: '#F5C518',       // Amarillo plano
      tabWidth: 148,
    },
    'category-ia': {
      tabBg: '#8C8CF0',       // Lila plano
      tabWidth: 118,
    },
    'category-post-production': {
      tabBg: '#F26B6B',       // Coral plano
      tabWidth: 218,
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
}) => {
  return (
    <div
      id="selected-projects"
      className="w-full my-12 sm:my-16 relative select-none overflow-visible"
    >
      {/* Título de la sección */}
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-tight text-zinc-950 uppercase">
          SELECTED PROJECTS
        </h2>
      </div>

      {/* Contenedor de la baraja en cascada: Altura total compacta */}
      <div className="w-full relative mx-auto h-[380px] sm:h-[400px] md:h-[420px] overflow-visible">
        {categories.map((cat, idx) => {
          const isHero = idx === 3; // Carpeta 004 (POST PRODUCTION) es la protagonista en reposo
          const topOffset = idx * FOLDERS_CONFIG.stepYPx; // 0px, 34px, 68px, 102px
          const zIndex = 10 + idx * 10;                  // 10, 20, 30, 40

          const catConfig =
            FOLDERS_CONFIG.categories[cat.id as keyof typeof FOLDERS_CONFIG.categories] || {
              tabBg: cat.badgeColor,
              tabWidth: 160,
            };

          const W_tab = catConfig.tabWidth;
          const H_tab = 36;
          const filletEnd = W_tab + 18;

          return (
            <div
              key={cat.id}
              className="absolute inset-x-0 w-full"
              style={{
                top: `${topOffset}px`,
                zIndex,
              }}
              aria-label={`Carpeta ${cat.number} ${cat.title}`}
            >
              <div className="relative w-full">
                {/* =========================================================================
                   PARTE 1: LA CARPETA COMPLETA DE COLOR PLANO (Pestaña + Cuerpo completo)
                   ========================================================================= */}
                <div className="w-full relative">
                  {/* Pestaña superior */}
                  <div className="relative flex items-end h-[36px] z-10 pointer-events-none">
                    <svg
                      width={filletEnd + 4}
                      height={H_tab + 2}
                      viewBox={`-1 -1 ${filletEnd + 6} ${H_tab + 4}`}
                      className="block select-none overflow-visible"
                    >
                      {/* Relleno con el color de la categoría */}
                      <path
                        d={`M 0 ${H_tab} L 0 12 Q 0 0 12 0 L ${W_tab - 10} 0 Q ${W_tab} 0 ${W_tab} 10 L ${W_tab} 20 C ${W_tab} 28 ${W_tab + 8} ${H_tab} ${filletEnd} ${H_tab} L 0 ${H_tab} Z`}
                        fill={catConfig.tabBg}
                      />

                      {/* Contorno continuo #4A4036 (2px): lado izquierdo, parte superior y empalme curvo */}
                      <path
                        d={`M 0 ${H_tab} L 0 12 Q 0 0 12 0 L ${W_tab - 10} 0 Q ${W_tab} 0 ${W_tab} 10 L ${W_tab} 20 C ${W_tab} 28 ${W_tab + 8} ${H_tab} ${filletEnd} ${H_tab}`}
                        stroke="#4A4036"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />

                      {/* Texto monoespaciado en mayúsculas exclusivo de la pestaña */}
                      <text
                        x="16"
                        y="23"
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                        fontSize="12"
                        fontWeight="900"
                        fill="#18181b"
                        letterSpacing="1"
                      >
                        {cat.number} // {cat.title}
                      </text>
                    </svg>
                  </div>

                  {/* Cuerpo completo de la carpeta de color plano (sits behind the work card) */}
                  <div
                    className="w-full absolute inset-x-0 top-[34px] bottom-0 border-2 border-[#4A4036] rounded-tr-[24px] sm:rounded-tr-[28px] rounded-b-[24px] sm:rounded-b-[28px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
                    style={{
                      backgroundColor: catConfig.tabBg,
                    }}
                  />
                </div>

                {/* =========================================================================
                   PARTE 2: EL TRABAJO / PREVIEW CON MÁSCARA QUE CUBRE TODO MENOS LA PESTAÑA
                   ========================================================================= */}
                <div
                  className="w-full relative -mt-[2px] border-2 border-[#4A4036] rounded-tr-[24px] sm:rounded-tr-[28px] rounded-b-[24px] sm:rounded-b-[28px] overflow-hidden shadow-sm z-20"
                  style={{
                    height: isHero ? 'auto' : '50px',
                    backgroundColor: isHero ? '#0c0d10' : undefined,
                  }}
                >
                  <img
                    src={isHero ? '/ref/tomy_vintage_card.png' : cat.image}
                    alt=""
                    className={`w-full ${
                      isHero
                        ? 'h-auto block rounded-b-[22px] sm:rounded-b-[26px]'
                        : 'h-full object-cover object-top'
                    } select-none pointer-events-none`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
