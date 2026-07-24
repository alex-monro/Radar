import styled from "styled-components";

type Props = {
  onClick: () => void;
  label: string;
};

const BriefButton = ({ onClick, label }: Props) => {
  return (
    <StyledWrapper>
      <button type="button" onClick={onClick} className="cssbuttons-io">
        <span>
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <path
              d="M24 12l-5.657 5.657-1.414-1.414L21.172 12l-4.243-4.243 1.414-1.414L24 12zM2.828 12l4.243 4.243-1.414 1.414L0 12l5.657-5.657L7.07 7.757 2.828 12zm6.96 9H7.66l6.552-18h2.128L9.788 21z"
              fill="currentColor"
            />
          </svg>
          {label}
        </span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .cssbuttons-io {
    position: relative;
    font-family: inherit;
    font-weight: 500;
    font-size: 18px;
    letter-spacing: 0.05em;
    border-radius: 0.8em;
    border: none;
    background: linear-gradient(to top, #8f1e8f, #4a00e0);
    color: ghostwhite;
    overflow: hidden;
    cursor: pointer;
    /* The label swaps to "Copied", so a fixed floor stops the button resizing
       under the cursor mid-click. */
    min-width: 11rem;
  }

  .cssbuttons-io svg {
    width: 1.2em;
    height: 1.2em;
    margin-right: 0.5em;
  }

  .cssbuttons-io span {
    position: relative;
    z-index: 10;
    transition: color 0.4s;
    display: inline-flex;
    align-items: center;
    padding: 0.8em 1.2em 0.8em 1.05em;
  }

  .cssbuttons-io::before,
  .cssbuttons-io::after {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .cssbuttons-io::before {
    content: "";
    background: rgb(0, 0, 0);
    transition: transform 0.4s cubic-bezier(0.3, 1, 0.8, 1);
  }

  .cssbuttons-io:hover::before {
    transform: translate3d(0, -100%, 0);
  }

  /* The sweep is decoration, not feedback, so it goes under reduced motion.
     The button still changes on hover, it just doesn't slide. */
  @media (prefers-reduced-motion: reduce) {
    .cssbuttons-io::before,
    .cssbuttons-io span {
      transition: none;
    }
  }

  .cssbuttons-io:focus-visible {
    outline: 2px solid var(--color-fg);
    outline-offset: 2px;
  }
`;

export default BriefButton;
