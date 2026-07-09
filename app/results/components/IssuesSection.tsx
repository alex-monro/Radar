import Image from "next/image";
import type { Scan } from "../../fixtures/fake-university-scan";

export default function IssuesSection({ scan }: { scan: Scan }) {
  const elementFindings = scan.findings.filter((f) => !f.is_page_level);

  return (
    <section aria-labelledby="issues-heading" className="px-8 pt-20 pb-40">
      <h2 id="issues-heading" className="text-5xl font-bold mb-16">Issues</h2>

      <div className="flex gap-8 min-h-[70vh]">
        {/* Screenshot — left */}
        <figure className="w-[55%] shrink-0 border border-gray-200 rounded-lg overflow-hidden flex items-start justify-center bg-gray-50">
          {/* Fixture screenshot is low-res (466px) — real pipeline will capture at full width */}
          <Image
            src={scan.screenshot_ref}
            alt=""
            aria-hidden="true"
            width={466}
            height={1024}
            unoptimized
            className="h-auto"
            style={{ maxWidth: "100%", width: "auto" }}
          />
        </figure>

        {/* Issue list — right */}
        <ul className="flex-1 flex flex-col gap-2 list-none">
          {elementFindings.map((finding) => (
            <li key={finding.id} className="border border-gray-200 rounded-lg px-4 py-3">
              <p>{finding.explanation}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
