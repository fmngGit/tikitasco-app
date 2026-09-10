import React from 'react';

interface RadarChartProps {
  ataque: number;
  defesa: number;
  fisico: number;
  passe: number;
  guardaRedes: number;
  fairplay: number;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  ataque = 50,
  defesa = 50,
  fisico = 50,
  passe = 50,
  guardaRedes = 50,
  fairplay = 50,
  size = 280
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.72; // margem para labels

  const stats = [
    { label: 'ATQ', value: Math.min(Math.max(ataque, 1), 99), name: 'Ataque' },
    { label: 'DEF', value: Math.min(Math.max(defesa, 1), 99), name: 'Defesa' },
    { label: 'FIS', value: Math.min(Math.max(fisico, 1), 99), name: 'Físico' },
    { label: 'PAS', value: Math.min(Math.max(passe, 1), 99), name: 'Passe' },
    { label: 'GR', value: Math.min(Math.max(guardaRedes, 1), 99), name: 'Guarda-Redes' },
    { label: 'FP', value: Math.min(Math.max(fairplay, 1), 99), name: 'Fairplay' },
  ];

  const totalPoints = stats.length;
  const angleStep = (Math.PI * 2) / totalPoints;

  // Converte valor e índice de eixo em coordenadas x, y
  const getCoordinates = (value: number, index: number, maxRadius = radius) => {
    const angle = index * angleStep - Math.PI / 2; // Começa no topo (12 horas)
    const normalizedValue = value / 100;
    const x = center + maxRadius * normalizedValue * Math.cos(angle);
    const y = center + maxRadius * normalizedValue * Math.sin(angle);
    return { x, y };
  };

  // Coordenadas para as teias concêntricas de referência (20, 40, 60, 80, 100)
  const rings = [20, 40, 60, 80, 100];
  const ringPolygons = rings.map((ringVal) => {
    const points = Array.from({ length: totalPoints })
      .map((_, i) => {
        const { x, y } = getCoordinates(ringVal, i);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return { ringVal, points };
  });

  // Coordenadas para os valores do jogador
  const playerPoints = stats
    .map((s, i) => {
      const { x, y } = getCoordinates(s.value, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
      >
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Círculo suave de brilho no fundo */}
        <circle cx={center} cy={center} r={radius} fill="url(#radarGlow)" />

        {/* Teias poligonais de referência */}
        {ringPolygons.map(({ ringVal, points }) => (
          <polygon
            key={ringVal}
            points={points}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={ringVal === 100 ? '1.5' : '1'}
            strokeDasharray={ringVal === 100 ? undefined : '2,2'}
          />
        ))}

        {/* Eixos radiais do centro a cada vértice */}
        {Array.from({ length: totalPoints }).map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* Polígono de estatísticas do jogador */}
        <polygon
          points={playerPoints}
          fill="url(#radarGradient)"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          style={{ transition: 'all 0.4s ease' }}
        />

        {/* Nós nas pontas dos atributos */}
        {stats.map((s, i) => {
          const { x, y } = getCoordinates(s.value, i);
          return (
            <circle
              key={s.label}
              cx={x}
              cy={y}
              r="4"
              fill="var(--primary)"
              stroke="#0f172a"
              strokeWidth="2"
              style={{ transition: 'all 0.4s ease' }}
            />
          );
        })}

        {/* Rótulos dos atributos e valores com posicionamento angular inteligente */}
        {stats.map((s, i) => {
          const { x, y } = getCoordinates(118, i); // posição além do raio máximo
          return (
            <g key={'lbl-' + s.label} transform={`translate(${x}, ${y})`}>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--text-main)"
                fontSize="11"
                fontWeight="700"
                letterSpacing="0.5px"
              >
                {s.label}
              </text>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                y="13"
                fill="var(--primary)"
                fontSize="10"
                fontWeight="800"
              >
                {s.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
