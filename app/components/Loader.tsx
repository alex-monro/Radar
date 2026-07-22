import React from "react";
import styled from "styled-components";

const Loader = () => {
  return (
    <div className="flex flex-col items-center gap-8">
      <StyledWrapper>
        <svg viewBox="0 0 240 240" height={240} width={240} className="pl">
          <circle
            strokeLinecap="round"
            strokeDashoffset={-330}
            strokeDasharray="0 660"
            strokeWidth={20}
            stroke="#000"
            fill="none"
            r={105}
            cy={120}
            cx={120}
            className="pl__ring pl__ring--a"
          />
          <circle
            strokeLinecap="round"
            strokeDashoffset={-110}
            strokeDasharray="0 220"
            strokeWidth={20}
            stroke="#000"
            fill="none"
            r={35}
            cy={120}
            cx={120}
            className="pl__ring pl__ring--b"
          />
          <circle
            strokeLinecap="round"
            strokeDasharray="0 440"
            strokeWidth={20}
            stroke="#000"
            fill="none"
            r={70}
            cy={120}
            cx={85}
            className="pl__ring pl__ring--c"
          />
          <circle
            strokeLinecap="round"
            strokeDasharray="0 440"
            strokeWidth={20}
            stroke="#000"
            fill="none"
            r={70}
            cy={120}
            cx={155}
            className="pl__ring pl__ring--d"
          />
        </svg>
      </StyledWrapper>

      <WordsWrapper>
        <div className="card">
          <div className="loader">
            <div className="words">
              {/* Each line is a real, specific check the scan actually runs,
                  not decoration, plain language matches the rest of Radar's
                  copy. First line repeated at the end so the rotation loops
                  seamlessly, same trick the original snippet used. */}
              <span className="word">Checking color contrast</span>
              <span className="word">Looking for missing alt text</span>
              <span className="word">Reviewing heading structure</span>
              <span className="word">Checking form labels</span>
              <span className="word">Checking color contrast</span>
            </div>
          </div>
        </div>
      </WordsWrapper>
    </div>
  );
};

const StyledWrapper = styled.div`
  .pl {
    width: 8em;
    height: 8em;
  }

  .pl__ring {
    animation: ringA 2s linear infinite;
  }

  .pl__ring--a {
    stroke: #000000;
  }

  .pl__ring--b {
    animation-name: ringB;
    stroke: #7e7e7e;
  }

  .pl__ring--c {
    animation-name: ringC;
    stroke: #686868;
  }

  .pl__ring--d {
    animation-name: ringD;
    stroke: #000000;
  }

  /* Animations */
  @keyframes ringA {
    from,
    4% {
      stroke-dasharray: 0 660;
      stroke-width: 20;
      stroke-dashoffset: -330;
    }

    12% {
      stroke-dasharray: 60 600;
      stroke-width: 30;
      stroke-dashoffset: -335;
    }

    32% {
      stroke-dasharray: 60 600;
      stroke-width: 30;
      stroke-dashoffset: -595;
    }

    40%,
    54% {
      stroke-dasharray: 0 660;
      stroke-width: 20;
      stroke-dashoffset: -660;
    }

    62% {
      stroke-dasharray: 60 600;
      stroke-width: 30;
      stroke-dashoffset: -665;
    }

    82% {
      stroke-dasharray: 60 600;
      stroke-width: 30;
      stroke-dashoffset: -925;
    }

    90%,
    to {
      stroke-dasharray: 0 660;
      stroke-width: 20;
      stroke-dashoffset: -990;
    }
  }

  @keyframes ringB {
    from,
    12% {
      stroke-dasharray: 0 220;
      stroke-width: 20;
      stroke-dashoffset: -110;
    }

    20% {
      stroke-dasharray: 20 200;
      stroke-width: 30;
      stroke-dashoffset: -115;
    }

    40% {
      stroke-dasharray: 20 200;
      stroke-width: 30;
      stroke-dashoffset: -195;
    }

    48%,
    62% {
      stroke-dasharray: 0 220;
      stroke-width: 20;
      stroke-dashoffset: -220;
    }

    70% {
      stroke-dasharray: 20 200;
      stroke-width: 30;
      stroke-dashoffset: -225;
    }

    90% {
      stroke-dasharray: 20 200;
      stroke-width: 30;
      stroke-dashoffset: -305;
    }

    98%,
    to {
      stroke-dasharray: 0 220;
      stroke-width: 20;
      stroke-dashoffset: -330;
    }
  }

  @keyframes ringC {
    from {
      stroke-dasharray: 0 440;
      stroke-width: 20;
      stroke-dashoffset: 0;
    }

    8% {
      stroke-dasharray: 40 400;
      stroke-width: 30;
      stroke-dashoffset: -5;
    }

    28% {
      stroke-dasharray: 40 400;
      stroke-width: 30;
      stroke-dashoffset: -175;
    }

    36%,
    58% {
      stroke-dasharray: 0 440;
      stroke-width: 20;
      stroke-dashoffset: -220;
    }

    66% {
      stroke-dasharray: 40 400;
      stroke-width: 30;
      stroke-dashoffset: -225;
    }

    86% {
      stroke-dasharray: 40 400;
      stroke-width: 30;
      stroke-dashoffset: -395;
    }

    94%,
    to {
      stroke-dasharray: 0 440;
      stroke-width: 20;
      stroke-dashoffset: -440;
    }
  }

  @keyframes ringD {
    from,
    8% {
      stroke-dasharray: 0 440;
      stroke-width: 20;
      stroke-dashoffset: 0;
    }

    16% {
      stroke-dasharray: 40 400;
      stroke-width: 30;
      stroke-dashoffset: -5;
    }

    36% {
      stroke-dasharray: 40 400;
      stroke-width: 30;
      stroke-dashoffset: -175;
    }

    44%,
    50% {
      stroke-dasharray: 0 440;
      stroke-width: 20;
      stroke-dashoffset: -220;
    }

    58% {
      stroke-dasharray: 40 400;
      stroke-width: 30;
      stroke-dashoffset: -225;
    }

    78% {
      stroke-dasharray: 40 400;
      stroke-width: 30;
      stroke-dashoffset: -395;
    }

    86%,
    to {
      stroke-dasharray: 0 440;
      stroke-width: 20;
      stroke-dashoffset: -440;
    }
  }
`;

const WordsWrapper = styled.div`
  .card {
    /* color used to softly clip top and bottom of the .words container */

    background-color: var(--bg-color);
    padding: 1rem 2rem;
    border-radius: 1.25rem;
  }
  .loader {
    color: rgb(124, 124, 124);
    font-family: sans-serif;
    font-weight: 500;
    font-size: 25px;
    box-sizing: content-box;
    height: 40px;
    padding: 10px 10px;
    display: flex;
    border-radius: 8px;
  }
  .words {
    overflow: hidden;
    position: relative;
  }
  .words::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      var(--bg-color) 10%,
      transparent 30%,
      transparent 70%,
      var(--bg-color) 90%
    );
    z-index: 20;
  }
  .word {
    text-align: center;
    display: block;
    height: 100%;
    padding-left: 6px;
    color: #000000;
    animation: spin_4991 15s infinite;
  }
  @keyframes spin_4991 {
    10% {
      transform: translateY(-102%);
    }
    25% {
      transform: translateY(-100%);
    }
    35% {
      transform: translateY(-202%);
    }
    50% {
      transform: translateY(-200%);
    }
    60% {
      transform: translateY(-302%);
    }
    75% {
      transform: translateY(-300%);
    }
    85% {
      transform: translateY(-402%);
    }
    100% {
      transform: translateY(-400%);
    }
  }
`;

export default Loader;
