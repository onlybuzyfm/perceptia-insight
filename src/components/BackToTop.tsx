import { useEffect, useState } from "react";
import { ArrowUp, Home } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {!isHome && (
        <Link
          to="/"
          aria-label="Ir a la página de inicio"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-soft"
        >
          <Home className="h-5 w-5" />
        </Link>
      )}
      <button
        type="button"
        aria-label="Volver al inicio de la página"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:-translate-y-0.5 ${
          visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}
