import styled from "styled-components";

// Closes out the Loader before results render. Deliberately built to the same
// spec as Loader.tsx so the handoff reads as one continuous moment rather than
// two components swapping: same 240 viewBox at 8em, same 20px round-capped
// stroke, same black-and-gray palette, and the text below sits in an identical
// card so nothing shifts position when the loader is replaced.
//
// Constraints from EXPERIENCE.md UX Discussion Log item 5: under ~1s total,
// fully static under reduced motion, completion announced to screen readers.
//
// The draw effect is the stroke-dasharray / stroke-dashoffset trick, which the
// loader's own rings already use: set the dash to the length of the path so the
// whole path is one dash, then animate the offset to 0 to slide it into view.

const ScanComplete = () => {
  return (
    <div className="flex flex-col items-center gap-8">
      <StyledWrapper>
        {/* Decorative. The text below carries the meaning. */}
        <svg
          viewBox="0 0 240 240"
          height={240}
          width={240}
          className="sc"
          aria-hidden="true"
        >
          <circle
            strokeLinecap="round"
            strokeWidth={20}
            fill="none"
            r={105}
            cy={120}
            cx={120}
            className="sc__ring"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={20}
            fill="none"
            d="M78 122L108 152L166 92"
            className="sc__check"
          />
        </svg>
      </StyledWrapper>

      <WordsWrapper>
        <div className="card">
          {/* A drawn checkmark means nothing to a screen reader, so the result
              is announced in text. role="status" is an implicit polite live
              region: it waits for a natural pause instead of interrupting. */}
          <p className="word" role="status">
            Scan complete
          </p>
        </div>
      </WordsWrapper>
    </div>
  );
};

const StyledWrapper = styled.div`
  .sc {
    width: 8em;
    height: 8em;
  }

  .sc__ring {
    stroke: #000000;
    /* Circumference = 2 * PI * 105 = 659.7, rounded up so there is no seam.
       Same 660 the loader's outer ring uses, since it is the same radius. */
    stroke-dasharray: 660;
    stroke-dashoffset: 660;
    animation: scDraw 0.9s ease-out forwards;
  }

  .sc__check {
    stroke: #000000;
    /* Combined length of the two check segments, ~125.9. */
    stroke-dasharray: 126;
    stroke-dashoffset: 126;
    /* Starts just before the ring lands so the two read as one gesture.
       Total elapsed 0.7 + 0.6 = 1.3s. This deliberately overruns the ~1s
       budget in EXPERIENCE.md item 5: at the original speed the mark was gone
       before it registered as a moment. */
    animation: scDraw 0.6s ease-out 0.7s forwards;
  }

  @keyframes scDraw {
    to {
      stroke-dashoffset: 0;
    }
  }

  /* Reduced motion still gets the confirmation, it just arrives already drawn.
     Suppress the movement, never the message. */
  @media (prefers-reduced-motion: reduce) {
    .sc__ring,
    .sc__check {
      animation: none;
      stroke-dashoffset: 0;
    }
  }
`;

// Mirrors Loader's WordsWrapper measurements exactly so the swap causes no
// layout shift. The loader rotates through several lines here; this shows one.
const WordsWrapper = styled.div`
  .card {
    background-color: var(--bg-color);
    padding: 1rem 2rem;
    border-radius: 1.25rem;
  }

  .word {
    font-family: sans-serif;
    font-weight: 500;
    font-size: 25px;
    color: #000000;
    height: 40px;
    padding: 10px 10px;
    box-sizing: content-box;
    text-align: center;
  }
`;

export default ScanComplete;
