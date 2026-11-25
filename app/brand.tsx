"use client";
import Image from "next/image";

export function FortinetBar({ subtitle }: { subtitle?: string }) {
  return (
    <div className="brandbar">
      <Image
        src="/fortinet-mark.png"
        alt="Fortinet"
        width={34}
        height={24}
        priority
      />
      <div className="wm">
        Fortinet<span className="sep">|</span>XPERTS26
      </div>
      {subtitle && (
        <span className="text-xs text-[var(--muted)] ml-2 hidden sm:inline">
          · {subtitle}
        </span>
      )}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      © Fortinet · XPERTS26 · Laboratorio PHP2Shell
    </footer>
  );
}
