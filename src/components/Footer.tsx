import { Link } from "@tanstack/react-router";
import logo from "@/assets/perceptia-logo.svg";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" aria-hidden="true" className="h-10 w-auto" />
            <span className="font-display text-xl font-bold text-foreground text-slate-400">
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
            <li>Facultad de Ciencias de la Educación, Humanas y Tecnologías</li>
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
