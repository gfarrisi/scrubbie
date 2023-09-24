import styles from "@/styles/Home.module.css";

const indexColor = {
  red: "#FF6B6B",
  orange: "#FF922B",
  yellow: "#FCC419",
  green: "#51CF66",
};

interface IndexBlockProps {
  range: {
    min: number;
    max: number;
  };
  score: number;
  color: string;
}

function IndexBlock(props: IndexBlockProps) {
  const { range, score, color } = props;
  const ratio = 20;
  const { min, max } = range;
  const width = (max - min) * ratio;

  const containsScore = score >= min && score <= max;

  // Relative score within the range of min and max
  const relativeScore = (score - min) / (max - min);

  // Compute left position as a percentage of the width of the current block
  let leftPosition = 0;
  if (score && score >= 80) {
    leftPosition = Math.min(82, score * relativeScore);
  } else if (score && score >= 30) {
    leftPosition = Math.min(82, score * relativeScore);
  } else if (score && score >= 10) {
    leftPosition = Math.min(82, score * relativeScore);
  }

  return (
    <>
      <div
        style={{
          height: 7,
          width: `${width}%`,
          backgroundColor: color,
          borderRadius: `${
            min === 0 && max !== 100
              ? "10px 0px 0px 10px"
              : max === 100
              ? "0px 10px 10px 0px"
              : "0px 0px 0px 0px"
          }`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 10,
            left: -10,
          }}
        >
          <p>{min}</p>
        </div>
        {max === 100 && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: max + 15,
            }}
          >
            <p>{max}</p>
          </div>
        )}

        {containsScore && (
          <div
            style={{
              position: "absolute",
              top: -50,
              left: `${leftPosition}%`,
            }}
          >
            <div>
              <div
                className={styles.scoreIndexNumber}
                style={{
                  position: "absolute",
                  top: 8,
                  left: score === 100 ? 7 : score < 10 ? 14 : 10,
                  color: color,
                }}
              >
                {score}
              </div>
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="37"
                  height="45"
                  viewBox="0 0 37 45"
                  fill="none"
                >
                  <g opacity="0.3">
                    <rect
                      x="0.935303"
                      y="0.455688"
                      width="35.9318"
                      height="35.9318"
                      rx="17.9659"
                      fill={color}
                    />
                    <path
                      d="M18.9012 44.1974L6.00717 30.9777L31.7953 30.9777L18.9012 44.1974Z"
                      fill={color}
                    />
                  </g>
                </svg>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                top: 45,
                left: 12,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <circle
                  cx="6.90161"
                  cy="6.80627"
                  r="5.73389"
                  fill={color}
                  stroke="white"
                  stroke-width="2"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

interface ScoreIndexProps {
  score: number;
}

export default function ScoreIndex(porps: ScoreIndexProps) {
  return (
    <div className={styles.scoreIndexContainer}>
      <IndexBlock
        range={{
          min: 0,
          max: 9,
        }}
        score={porps.score}
        color={indexColor.red}
      />
      <IndexBlock
        range={{
          min: 10,
          max: 29,
        }}
        score={porps.score}
        color={indexColor.orange}
      />
      <IndexBlock
        range={{
          min: 30,
          max: 79,
        }}
        score={porps.score}
        color={indexColor.yellow}
      />
      <IndexBlock
        range={{
          min: 80,
          max: 100,
        }}
        score={porps.score}
        color={indexColor.green}
      />
    </div>
  );
}
