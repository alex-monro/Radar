type Props = {
  score: number;
};

const RADIUS = 80;
const STROKE_WIDTH = 18;
// Semicircle arc length = half the circumference of a full circle (πr).
const ARC_LENGTH = Math.PI * RADIUS;

const TRACK_PATH = `M 20 100 A ${RADIUS} ${RADIUS} 0 0 1 180 100`;

const getColor = (score: number) => {
  if (score >= 70) return "#16a34a";
  if (score >= 40) return "#ca8a04";
  return "#dc2626";
};

const ScoreGauge = ({ score }: Props) => {
  const clamped = Math.min(100, Math.max(0, score));
  const color = getColor(clamped);
  // Sliding the dash pattern's offset from ARC_LENGTH (fully hidden) down to
  // 0 (fully shown) is what makes the arc appear to "fill" toward the score.
  const offset = ARC_LENGTH * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="112" viewBox="0 0 200 112" className="overflow-visible">
        <path
          d={TRACK_PATH}
          fill="none"
          stroke="#E5E3DF"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <path
          d={TRACK_PATH}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
        />
      </svg>
      <span className="-mt-6 text-5xl font-bold">{clamped}</span>
    </div>
  );
};

export default ScoreGauge;
