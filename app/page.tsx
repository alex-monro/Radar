import Image from "next/image";
import ScanForm from "./components/ScanForm";

const Page = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="w-full max-w-4xl px-6 flex flex-col gap-6 -mt-16">
        <div className="flex items-center justify-center gap-4">
          <h1 className="font-bold tracking-tight text-6xl">RADAR</h1>
          <Image src="/FP_Satellite_icon.webp" alt="" aria-hidden="true" width={48} height={48} className="-rotate-[90deg] -scale-x-100" />
        </div>
        <p className="text-2xl text-center">Scan a website and surface accessibility issues.</p>
        <ScanForm />
      </div>
    </div>
  );
};

export default Page;
