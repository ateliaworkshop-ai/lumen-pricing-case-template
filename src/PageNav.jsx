import React, { useEffect, useState } from "react";

const LINKS = [
  { id: "recommendation", label: "Rec" },
  { id: "explorer", label: "Price" },
  { id: "price-cac", label: "CAC" },
  { id: "shelf", label: "Shelf" },
  { id: "van-westendorp", label: "VW" },
  { id: "voices", label: "Who" },
  { id: "payback", label: "Payback" },
  { id: "timing", label: "Timing" },
  { id: "launch", label: "Map" },
  { id: "integrity", label: "Caveats" },
  { id: "cockpit", label: "Cockpit" },
];

export default function PageNav() {
  const [active, setActive] = useState("recommendation");

  useEffect(() => {
    const nodes = LINKS.map((l) => document.getElementById(l.id)).filter(
      Boolean,
    );
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );
    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="page-nav" aria-label="Jump to section">
      {LINKS.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className={active === link.id ? "is-active" : undefined}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
