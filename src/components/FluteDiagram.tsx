import type { FluteResult } from '../acoustics/types';

interface FluteDiagramProps {
  result: FluteResult;
  labels: string[];
}

export function FluteDiagram({ result, labels }: FluteDiagramProps) {
  const totalLengthMm = result.suggestedBlankMm;
  const positionX = (millimeters: number) =>
    55 + (millimeters / totalLengthMm) * 780;

  return (
    <div className="mt-3 border border-slate-200 bg-white p-3">
      <svg
        className="h-auto w-full"
        viewBox="0 0 900 260"
        role="img"
        aria-label="Scaled flute construction diagram"
      >
        <defs>
          <linearGradient id="tube" x2="0" y2="1">
            <stop stopColor="#d7e3e8" />
            <stop offset="0.5" stopColor="#78909c" />
            <stop offset="1" stopColor="#425762" />
          </linearGradient>
        </defs>
        <rect
          x="55"
          y="92"
          width="780"
          height="48"
          rx="6"
          fill="url(#tube)"
          stroke="#172a34"
          strokeWidth="2"
        />
        <MeasurementMarker
          x={55}
          label="OPEN FOOT · 0 mm"
          labelY={174}
          color="#172a34"
        />
        {result.holes.map((hole, index) => (
          <g className="cursor-help" key={index}>
            <circle
              cx={positionX(hole.fromFootMm)}
              cy="102"
              r={Math.max(5, (hole.diameterMm / totalLengthMm) * 700)}
              fill="#0e2731"
              stroke="white"
              strokeWidth="2"
            />
            <title>{`Hole ${index + 1} · ${labels[index]} · ${hole.frequencyHz.toFixed(2)} Hz · +${hole.cents} cents · Ø${hole.diameterMm.toFixed(1)} mm · ${hole.fromFootMm.toFixed(1)} mm from foot · ${hole.fromEmbouchureMm.toFixed(1)} mm from embouchure`}</title>
            <line
              x1={positionX(hole.fromFootMm)}
              y1="142"
              x2={positionX(hole.fromFootMm)}
              y2={185 + (index % 2) * 26}
              stroke="#a9b9bd"
              strokeDasharray="3"
            />
            <text
              x={positionX(hole.fromFootMm)}
              y={199 + (index % 2) * 26}
              textAnchor="middle"
              fill="#526870"
              fontFamily="DM Mono"
              fontSize="9"
            >
              H{index + 1} · {hole.fromFootMm.toFixed(1)}
            </text>
          </g>
        ))}
        <ellipse
          cx={positionX(result.soundingLengthMm)}
          cy="102"
          rx="13"
          ry="8"
          fill="#ed6d36"
          stroke="#70230a"
          strokeWidth="2"
        />
        <MeasurementMarker
          x={positionX(result.soundingLengthMm)}
          label={`EMBOUCHURE · ${result.soundingLengthMm.toFixed(1)} mm`}
          labelY={52}
          color="#e65d30"
        />
        <line
          x1={positionX(result.plugFaceMm)}
          y1="88"
          x2={positionX(result.plugFaceMm)}
          y2="145"
          stroke="#f0b634"
          strokeWidth="6"
        />
        <text
          x={positionX(result.plugFaceMm)}
          y="174"
          textAnchor="middle"
          fill="#526870"
          fontFamily="DM Mono"
          fontSize="9"
        >
          PLUG FACE · {result.plugFaceMm.toFixed(1)} mm
        </text>
        <MeasurementMarker
          x={positionX(totalLengthMm)}
          label={`HEAD END · ${totalLengthMm.toFixed(0)} mm`}
          labelY={228}
          color="#e65d30"
        />
      </svg>
      <p className="m-0 text-center font-mono text-[10px] text-slate-500">
        All positions are center measurements from the open foot. Hover or tap a
        hole for full details.
      </p>
    </div>
  );
}

function MeasurementMarker({
  x,
  label,
  labelY,
  color,
}: {
  x: number;
  label: string;
  labelY: number;
  color: string;
}) {
  return (
    <g>
      <line x1={x} y1="65" x2={x} y2="151" stroke={color} strokeWidth="2" />
      <text
        x={x}
        y={labelY}
        textAnchor="middle"
        fill="#526870"
        fontFamily="DM Mono"
        fontSize="9"
      >
        {label}
      </text>
    </g>
  );
}
