"use client";
import React, { useRef } from "react";

const Btn = () => {
  const glowRef = useRef(null);

  const handleMouseMove = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left; // x inside button
    const y = e.clientY - rect.top; // y inside button

    if (glowRef.current) {
      glowRef.current.style.transform = `translateX(${x - 500}px) translateY(${y - 0}px) translateZ(0)`;
    }
  };

  const handleMouseLeave = () => {
    if (glowRef.current) {
      glowRef.current.style.transform = `translateX(105.953px) translateY(0px) translateZ(0)`;
    }
  };

  return (
    <a
      className="transition-colors transition-all duration-200 uppercase font-bold flex items-center justify-center h-10 px-16 text-[12px] text-black -tracking-[0.015em] relative z-10 overflow-hidden rounded-full border border-white/60 bg-[#d1d1d1] space-x-1 sm:pl-[59px] sm:pr-[52px]"
      href="/signup"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={glowRef}
        className="absolute -z-10 flex w-[204px] items-center justify-center pointer-events-none"
        style={{
          transform: "translateX(105.953px) translateZ(0px)",
          transition: "transform 0.2s ease",
        }}
      >
        <div className="absolute top-1/2 h-[121px] w-[121px] -translate-y-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,#FFFFF5_3.5%,_#FFAA81_26.5%,#FFDA9F_37.5%,rgba(255,170,129,0.50)_49%,rgba(210,106,58,0.00)_92.5%)]"></div>
        <div className="absolute top-1/2 h-[103px] w-[204px] -translate-y-1/2 bg-[radial-gradient(43.3%_44.23%_at_50%_49.51%,_#FFFFF7_29%,_#FFFACD_48.5%,_#F4D2BF_60.71%,rgba(214,211,210,0.00)_100%)] blur-[5px]"></div>
      </div>
      <span className="text-[#5A250A]">Try it Free</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 17 9"
        className="h-[9px] w-[17px] text-[#5A250A]"
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="m12.495 0 4.495 4.495-4.495 4.495-.99-.99 2.805-2.805H0v-1.4h14.31L11.505.99z"
          clipRule="evenodd"
        />
      </svg>
    </a>
  );
};

export default Btn;
