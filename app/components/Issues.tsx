import { AxeResults } from "axe-core";
import React from "react";

type Props = {
  results: AxeResults | null;
  screenshot: string | null;
};

const Issues = (props: Props) => {
  const { results, screenshot } = props;
  console.log("results", results);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-3xl font-semibold">
        Issues{" "}
        <span className="text-3xl text-muted">
          ({results?.violations.length})
        </span>
      </h2>
      <div className="flex flex-row  gap-12">
        <img
          src={screenshot ? `data:image/png;base64,${screenshot}` : undefined}
          alt="Screenshot of the scanned page"
          className="w-2/3 h-auto rounded-lg shadow-md"
        />

        <ul className="flex flex-col gap-4">
          {results?.violations.map((violation) => (
            <li key={violation.id} className="flex flex-col gap-2">
              <h3 className="text-xl font-medium">{violation.help}</h3>
              <p className="text-muted">{violation.description}</p>
              <p className="text-muted">
                <a
                  href={violation.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Issues;
