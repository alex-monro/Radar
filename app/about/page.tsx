import Link from "next/link";

export const metadata = {
  title: "About | Radar",
  description:
    "Why web accessibility matters, what Radar checks, and what an automated scan can and can't catch.",
};

// Written to the same plain-language bar as the rest of the product
// (grade-3 reading level, no jargon). This page is also the "learn more"
// destination for the scan disclaimer.
const AboutPage = () => {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col gap-12 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold">About Radar</h1>
        <p className="text-lg leading-relaxed">
          Radar scans a web page and shows you what might be hard to use for
          some people. It marks each problem right on a picture of your page
          and explains it in plain words.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">Why this matters</h2>
        <p className="leading-relaxed">
          About one in six people live with some form of disability. Many more
          find the web hard to use at times: older eyes, a broken mouse, a
          bright sunny screen, a slow hand.
        </p>
        <p className="leading-relaxed">
          Small things can lock these people out. A button with no name means a
          screen reader can only say &quot;button&quot;. Pale text on a pale
          background can be impossible to read. A form with no labels is a
          guessing game. The people hitting these walls are customers, readers,
          and friends who simply want to use your site.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">What Radar checks</h2>
        <p className="leading-relaxed">
          Radar opens your page in a real browser and runs axe-core, a trusted
          open source checker used across the industry. It tests your page
          against the web&apos;s accessibility guidelines and finds things like
          missing image descriptions, low contrast text, unlabeled buttons and
          fields, and confusing page structure.
        </p>
        <p className="leading-relaxed">
          For each issue, Radar shows where it is on your page, explains it in
          plain words, and suggests who would usually fix it.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">
          What a scan can&apos;t catch
        </h2>
        <p className="leading-relaxed">
          An automated scan can only find some kinds of problems. It can tell
          that an image has a description, but not whether the description
          makes sense. It can&apos;t feel whether the page is easy to move
          through with a keyboard, or whether a video&apos;s captions are any
          good.
        </p>
        <p className="leading-relaxed">
          So a clean scan is a good sign, not proof. Radar is our own
          assessment, not a certification. For real confidence, have people
          test your site, including people who use screen readers and
          keyboards every day.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">Learn more</h2>
        <p className="leading-relaxed">
          The W3C&apos;s{" "}
          <a
            href="https://www.w3.org/WAI/fundamentals/accessibility-intro/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            introduction to web accessibility
          </a>{" "}
          is a friendly place to start. Radar itself is open source, and you
          can read every line of it{" "}
          <a
            href="https://github.com/alex-monro/Radar"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            on GitHub
          </a>
          .
        </p>
      </div>

      <div>
        <Link
          href="/"
          className="inline-block rounded-lg bg-footer px-6 py-3 text-on-dark"
        >
          Scan your site
        </Link>
      </div>
    </section>
  );
};

export default AboutPage;
