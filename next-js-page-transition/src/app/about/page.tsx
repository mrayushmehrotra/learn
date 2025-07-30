"use client";
import Image from "next/image";
export default function FogPage() {
  return (
    <div className="relative w-full h-screen overflow-x-hidden">
      <div className="relative z-10  p-12 flex items-center justify-center">
        <div>
          <Image src="/Hero.jpg" height={150} width={300} alt="sketchBg" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Hi, I'm Ayush Mehrotra</h1>
          <p className="text-xl text-black  leading-relaxed">
            Software engineer specializing in Linux systems, web development,
            and Neovim configuration. Scroll down to see through the fog.
          </p>
        </div>
      </div>
    </div>
  );
}
