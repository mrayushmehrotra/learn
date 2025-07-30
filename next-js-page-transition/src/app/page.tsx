"use client";
import Image from "next/image";
import Btn from "@/components/btn";
export default function FogPage() {
  return (
    <div className="relative w-full h-screen overflow-x-hidden bg-black">
      <Btn />
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Hero.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* SVG Text Mask */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 1000 400">
          <defs>
            <mask id="textMask">
              <rect width="100%" height="100%" fill="white" />
              <text
                x="50%"
                y="50%"
                fill="black"
                fontSize="120"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="sans-serif"
              >
                AYUSH MEHROTRA
              </text>
            </mask>
          </defs>

          <rect
            width="100%"
            height="100%"
            mask="url(#textMask)"
            fill="url(#gradient)"
          />

          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
