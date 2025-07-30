// components/PopperButton.tsx
"use client";

import { useEffect } from "react";

const createDot = (x: number, y: number) => {
  const dot = document.createElement("div");
  const size = Math.random() * 8 + 4;
  const color = `hsl(${Math.random() * 360}, 100%, 60%)`;

  dot.style.position = "absolute";
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  dot.style.width = `${size}px`;
  dot.style.height = `${size}px`;
  dot.style.backgroundColor = color;
  dot.style.borderRadius = "50%";
  dot.style.pointerEvents = "none";
  dot.style.opacity = "1";
  dot.style.zIndex = "9999";
  dot.style.transition = "all 0.6s ease-out";

  document.body.appendChild(dot);

  requestAnimationFrame(() => {
    dot.style.transform = `translate(${(Math.random() - 0.5) * 200}px, ${
      (Math.random() - 1) * 200
    }px)`;
    dot.style.opacity = "0";
  });

  setTimeout(() => {
    dot.remove();
  }, 600);
};

export default function PopperButton() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    for (let i = 0; i < 25; i++) {
      createDot(clientX, clientY);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="p-4 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 transition-transform"
    >
      Click me for magic!
    </button>
  );
}
