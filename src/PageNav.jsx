import React, { useEffect, useMemo, useState } from "react";
import { NAV_LINKS, teamSees } from "./teams.js";
import { useDecision } from "./decision.jsx";

export default function PageNav() {
  const { team } = useDecision();
  const [active, setActive] = useState("recommendation");
  const links = useMemo(
    () => NAV_LINKS.filter((l) => teamSees(team, l.id)),
    [team],
  );

  useEffect(() => {
    const nodes = links
      .map((l) => document.getElementById(l.id))
      .filter(Boolean);
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
  }, [links]);

  return (
    <nav className="page-nav" aria-label="Jump to section">
      {links.map((link) => (
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
