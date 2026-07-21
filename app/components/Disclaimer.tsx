type Props = {
  // Zero issues found is the highest-risk moment for false confidence, a
  // perfect score can easily be misread as "certified accessible," which
  // this never is. That case gets a fuller paragraph, not the normal
  // one-liner.
  issueCount: number;
};

const Disclaimer = ({ issueCount }: Props) => {
  const isCleanScan = issueCount === 0;

  return (
    <div className="border-l-2 border-gray-300 pl-6 py-1 text-muted text-sm max-w-3xl">
      {isCleanScan ? (
        <p>
          This is Radar&apos;s own automated check, not an accessibility
          certification, and no automated scan catches every issue.
          Screen readers, keyboard navigation, and color contrast in context
          all need a real person to verify. A clean scan is a good sign, not
          a guarantee. If you want a full manual review, we can help with
          that too.
        </p>
      ) : (
        <p>
          This is Radar&apos;s own automated check, not a certification.
          Automated scanning catches a meaningful slice of accessibility
          issues, but not everything, some problems only show up with a real
          person navigating by screen reader or keyboard.
        </p>
      )}
    </div>
  );
};

export default Disclaimer;
