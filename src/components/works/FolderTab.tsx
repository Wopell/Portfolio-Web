import React from 'react';

/** Pestaña de carpeta (SVG): contorno de tinta, relleno y texto mono. */
export const FolderTab: React.FC<{
  label: string;
  height: number;
  fill: string;
  ink?: string;
  outline?: string;
}> = ({ label, height: H, fill, ink = '#191510', outline = 'rgba(25, 21, 16, 0.72)' }) => {
  const W = Math.round(label.length * 8.6 + 34);
  const end = W + 16;
  const shape = `M 0 ${H} L 0 12 Q 0 0 12 0 L ${W - 10} 0 Q ${W} 0 ${W} 10 L ${W} ${H - 14} C ${W} ${H - 4} ${W + 6} ${H} ${end} ${H}`;
  return (
    <svg width={end + 2} height={H + 2} viewBox={`-1 -1 ${end + 2} ${H + 2}`} className="block overflow-visible" aria-hidden="true">
      <path d={`${shape} L 0 ${H} Z`} fill={fill} />
      <path d={shape} fill="none" stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />
      <text
        x="16"
        y={H / 2 + 4.5}
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontSize="12"
        fontWeight="600"
        letterSpacing="1.4"
        fill={ink}
      >
        {label}
      </text>
    </svg>
  );
};

/** ancho que ocupa la pestaña (para alinear la regla superior del cuerpo) */
export const folderTabWidth = (label: string) => Math.round(label.length * 8.6 + 34) + 16;
