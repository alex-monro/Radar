type Props = {
  url: string | null;
};

const ResultsHeader = ({ url }: Props) => {
  return (
    <>
      <section className="flex flex-row mt-32 gap-12 justify-between flex-1 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-semibold">Scan Results</h1>
          <a
            href={url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-muted"
          >
            {url}
          </a>
          <h2 className="text-xl font-bold">OverView</h2>
          <p className="max-w-2xl">
            This site has a few accessibility problems that could make it hard
            for some visitors to use. The biggest one is a button on the
            homepage that's too light to read easily, especially for people with
            low vision or anyone using their phone outside in bright sunlight. A
            few images on the page don't have any text describing what they
            show, so someone using a screen reader has no way to know what those
            pictures are. One of the sign-up forms is also missing a proper
            label on its input field, meaning a screen reader might just say
            "edit text" instead of telling the person what to actually type
            there. There are also a couple of links on the page that say the
            same thing, like "click here," even though they point to two
            completely different places. That's confusing for anyone tabbing
            through the page with a keyboard or listening to a screen reader
            read
          </p>
        </div>
        <div>
          <span>Score</span>
        </div>
      </section>
    </>
  );
};

export default ResultsHeader;
