import { Link } from "@tanstack/react-router";
import { Instagram, Facebook } from "lucide-react";
import logo from "@/assets/perceptia-logo.svg";

const SOCIAL = [
  { name: "Instagram", href: "https://www.instagram.com/semilleroperceptia?igsh=MTh6Z3VraTIzOTB5ZA==", icon: Instagram },
  { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61581273467496", icon: Facebook },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@semillero.percept?_r=1&_t=ZS-96MDAs7FY5U",
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.84a8.16 8.16 0 0 0 4.77 1.52V6.92a4.85 4.85 0 0 1-1.84-.23z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" aria-hidden="true" className="h-10 w-auto" />
            <span className="font-display text-xl font-bold text-foreground text-slate-500">
              Percept<span className="text-primary">IA</span>
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Semillero de investigación en percepción artificial, ciencia de datos,
            IA y TinyML aplicada a entornos reales con recursos limitados.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Adscrito al grupo de investigación <span className="font-semibold text-foreground">MODSIM</span>.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {SOCIAL.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Navegación</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/sobre" className="hover:text-primary">Sobre nosotros</Link></li>
            <li><Link to="/lineas" className="hover:text-primary">Líneas de investigación</Link></li>
            <li><Link to="/proyectos" className="hover:text-primary">Proyectos</Link></li>
            <li><Link to="/integrantes" className="hover:text-primary">Integrantes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Institución</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Universidad Nacional de Chimborazo</li>
            <li>Facultad de Ingeniería</li>
            <li>Carrera de Ciencia de Datos e IA</li>
            <li><Link to="/contacto" className="text-primary hover:underline">Contacto</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} PerceptIA · Semillero de Investigación</span>
          <span>perceptia.dev</span>
        </div>
      </div>
    </footer>
  );
}
