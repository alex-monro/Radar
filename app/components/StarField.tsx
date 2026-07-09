"use client";

// Star field using tsparticles — https://github.com/tsparticles/react
import { Particles, ParticlesProvider, useParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

function StarParticles() {
  const { loaded } = useParticlesProvider();

  if (!loaded) return null;

  return (
    <Particles
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      options={{
        fullScreen: { enable: false },
        background: { color: "transparent" },
        particles: {
          number: { value: 100 },
          color: { value: "#FAF9F6" },
          opacity: { value: { min: 0.2, max: 0.65 } },
          size: { value: { min: 0.3, max: 1.4 } },
          move: { enable: false },
        },
      }}
    />
  );
}

export default function StarField() {
  return (
    <ParticlesProvider init={loadSlim}>
      <StarParticles />
    </ParticlesProvider>
  );
}
