"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  name?: string;
  className?: string;
  hideName?: boolean;
}

const OnionIcon = () => {
  return (
    <div className="relative flex h-7 w-7 items-center justify-center">
      <div className="absolute h-6 w-6 rounded-[45%] bg-violet-500 rotate-45" />

      <div className="absolute h-5 w-5 rounded-[45%] border-2 border-violet-300 rotate-45" />
      <div className="absolute h-3.5 w-3.5 rounded-[45%] border border-violet-200 rotate-45" />

      <div className="absolute -top-1 h-2 w-1 rounded-full bg-green-500" />
    </div>
  );
};

const Logo = ({
  name = "onion.ai",
  className,
  hideName = false,
}: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 shadow-md">
        <OnionIcon />
      </div>

      {!hideName && (
        <span className="text-lg font-bold tracking-tight">
          <span className="text-white">onion</span>
          <span className="text-violet-400">.ai</span>
        </span>
      )}
    </div>
  );
};

export default Logo;