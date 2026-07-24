import { Suspense } from "react";
import Image from "next/image";
import ScanForm from "./components/ScanForm";

const Page = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col gap-6 -mt-8 md:-mt-16">
        <div className="flex items-center justify-center gap-3 md:gap-4">
          <h1 className="font-bold tracking-tight text-5xl md:text-6xl">
            RADAR
          </h1>
          <Image
            src="/FP_Satellite_icon.webp"
            alt=""
            aria-hidden="true"
            width={48}
            height={48}
            className="h-10 w-10 md:h-12 md:w-12 -rotate-[90deg] -scale-x-100"
          />
        </div>
        <p className="text-xl md:text-2xl text-center">
          Find accessibility issues. Understand them. Fix them
        </p>
        <Suspense fallback={null}>
          <ScanForm />
        </Suspense>

        <ul className="hidden md:flex items-center justify-center gap-8 text-muted">
          <li>Plain-English explanations</li>
          <li>Visual highlights</li>
          <li>An AI-ready fix prompt</li>
        </ul>
      </div>
    </div>
  );
};

export default Page;
