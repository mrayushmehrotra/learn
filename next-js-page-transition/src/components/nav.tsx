"use client";
import { useTransitionRouter } from "next-view-transitions";
import Link from "next/link";
import React from "react";

const Nav = () => {
  const router = useTransitionRouter();
  const routes = [
    {
      label: "Home",
      url: "/",
    },
    {
      label: "Blogs",
      url: "/blogs",
    },
  ];
  return (
    <div className="p-6 flex justify-between  ">
      <ul className="gap-4 flex">
        {routes.map((route) => (
          <li key={route.label}>
            <Link
              href={route.url}
              onClick={(e) => {
                e.preventDefault();
                router.push(route.url, {
                  onTransitionReady: pageAnimation,
                });
              }}
            >
              {route.label}
            </Link>
          </li>
        ))}
      </ul>

      <button
        className="[--background:#000000] [--color:#ffffff] [--muted:#242424] [--muted-foreground:#9c9c9c] [--border:#2e2e2e] relative inline-flex items-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-[--border] bg-[--background] hover:bg-[--muted] text-[--muted-foreground] hover:text-[--color] px-4 py-2 justify-start rounded-[0.5rem] text-sm font-normal shadow-none h-8 w-64"
        type="button"
      >
        <span className="hidden lg:inline-flex">Search docs...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] flex h-5 select-none items-center gap-1 rounded border border-[--border] bg-[--muted] px-1.5 font-mono text-[10px] font-medium opacity-100 [&amp;_span]:text-xs">
          <span>⌘</span>K
        </kbd>
      </button>
    </div>
  );
};

const pageAnimation = () => {
  document.documentElement.animate(
    [
      {
        opacity: 1,
        scale: 1,
        transform: "translateY(0)",
      },
      {
        opacity: 0.1,
        scale: 0.9,
        transform: "translateY(-200px)",
      },
    ],
    {
      duration: 1000,
      easing: "cubic-bezier(0.76,0,0.24,1)",
      fill: "forwards",
      pseudoElement: "::view-transition-old(root)",
    },
  );
  document.documentElement.animate(
    [
      {
        transform: "translateY(100%)",
      },
      {
        transform: "translateY(0)",
      },
    ],
    {
      duration: 1000,
      easing: "cubic-bezier(0.76,0,0.24,1)",
      fill: "forwards",
      pseudoElement: "::view-transition-new(root)",
    },
  );
};

export default Nav;
