// Demo content for PerceptIA. Centralized so it can be swapped to backend later.

export const HERO = {
  title: "PerceptIA",
  subtitle: "Semillero de Investigación",
  tagline:
    "Investigación aplicada en percepción artificial, ciencia de datos, inteligencia artificial, TinyML y sistemas inteligentes embebidos.",
  quote:
    "Percepción artificial, ciencia de datos e inteligencia artificial aplicada para entornos reales con recursos limitados.",
};

export const ABOUT_PARAGRAPHS = [
  "PerceptIA es un semillero de investigación orientado al fortalecimiento de competencias investigativas y técnicas en estudiantes mediante el desarrollo de proyectos aplicados en inteligencia artificial, ciencia de datos, visión artificial, razonamiento aproximado, TinyML y sistemas embebidos.",
  "El semillero busca formar talento humano capaz de diseñar soluciones inteligentes que funcionen en escenarios reales, especialmente en contextos donde existen limitaciones de conectividad, energía, infraestructura tecnológica o capacidad de cómputo.",
];

export const ABOUT_FACTS = [
  { label: "Adscripción", value: "Grupo de investigación MODSIM" },
  { label: "Carrera", value: "Ciencia de Datos e Inteligencia Artificial" },
  { label: "Área de conocimiento", value: "Tecnologías de la Información y la Comunicación" },
  { label: "Sub línea", value: "Ciencia de los Datos y Sistemas Inteligentes" },
];

export const GENERAL_OBJECTIVE =
  "Diseñar, desarrollar y validar soluciones de percepción artificial embebida que integren principios de Ciencia de Datos, Inteligencia Artificial y Razonamiento Aproximado, incluyendo TinyML, para resolver problemáticas reales en entornos con recursos limitados.";

export const SPECIFIC_OBJECTIVES = [
  "Aplicar el ciclo de vida de Ciencia de Datos e Inteligencia Artificial: recolección, limpieza, análisis exploratorio, selección de modelos, entrenamiento, validación, despliegue y monitoreo.",
  "Fomentar la formación investigativa de estudiantes y docentes mediante participación en proyectos, publicaciones, eventos científicos y transferencia de conocimiento.",
  "Investigar principios neuro-cognitivos de la visión humana y seleccionar algoritmos ligeros de visión artificial e inferencia difusa o neuro-difusa.",
  "Construir y curar conjuntos de datos visuales, sensoriales y perceptuales, asegurando calidad, trazabilidad y reproducibilidad.",
  "Evaluar la correspondencia entre percepción humana y percepción de máquina mediante métricas de precisión, latencia, eficiencia energética y robustez al ruido.",
  "Desarrollar prototipos embebidos que integren captura sensorial, preprocesamiento, inferencia en tiempo real y toma de decisiones autónoma.",
];

export const RESEARCH_LINES = [
  { title: "Ciencia de Datos e Inteligencia Artificial", desc: "Modelos clásicos y modernos aplicados al ciclo completo del dato." },
  { title: "Visión artificial y percepción computacional", desc: "Algoritmos ligeros inspirados en la cognición visual humana." },
  { title: "TinyML y sistemas embebidos", desc: "Inferencia en microcontroladores con eficiencia energética." },
  { title: "Razonamiento aproximado e inferencia difusa", desc: "Sistemas neuro-difusos para entornos con incertidumbre." },
  { title: "Datasets locales y curación de datos", desc: "Construcción de corpus contextualizados al entorno andino." },
  { title: "Prototipado inteligente de bajo consumo", desc: "Hardware-software co-diseñado para escenarios offline." },
  { title: "Aplicaciones sectoriales", desc: "Monitoreo ambiental, agricultura, salud preventiva y movilidad segura." },
  { title: "Agentes inteligentes y automatización académica", desc: "Pipelines y agentes que asisten la investigación." },
];

export const JUSTIFICATIONS = [
  {
    title: "Pertinencia tecnológica y social",
    desc: "Soluciones de IA aplicadas a salud preventiva, agricultura de precisión, movilidad segura y monitoreo ambiental con impacto local directo.",
  },
  {
    title: "Vacío de conocimiento local",
    desc: "Construcción de datasets y modelos contextualizados al entorno andino-ecuatoriano, hoy subrepresentado en la literatura.",
  },
  {
    title: "Formación de capital humano",
    desc: "Estudiantes capaces de diseñar y desplegar soluciones de IA embebida desde el dato hasta el dispositivo.",
  },
  {
    title: "Impacto sostenible y escalable",
    desc: "TinyML e IA ligera democratizan el acceso a la tecnología en zonas con restricciones de cómputo, energía y conectividad.",
  },
];

export const ACTIVITIES = [
  "Evaluación comparativa y validación de modelos.",
  "Prototipado y despliegue en hardware embebido.",
  "Curación y construcción de datasets.",
  "Recolección de imágenes, audio y señales sensoriales.",
  "Limpieza, análisis exploratorio, visualización y etiquetado colaborativo de datos.",
  "Selección y desarrollo de modelos de IA tradicional y TinyML.",
  "Implementación de modelos clásicos: SVM, árboles de decisión, regresión logística, clustering y redes neuronales.",
  "Diseño y simulación de experimentos de percepción.",
  "Revisión bibliográfica y seminarios internos.",
  "Organización de eventos científicos y socialización de resultados.",
];

export type ProjectStatus = "En curso" | "En diseño" | "Activo" | "Piloto";

export const PROJECTS: { title: string; desc: string; status: ProjectStatus; line: string }[] = [
  { title: "Dataset de frutas con visión por computador", desc: "Construcción y curación de un dataset visual de frutas locales para clasificación con CNNs ligeras.", status: "En curso", line: "Datasets locales" },
  { title: "CVAT para anotación colaborativa", desc: "Infraestructura compartida para etiquetado de imágenes y video del semillero.", status: "Activo", line: "Curación de datos" },
  { title: "Moodle PerceptIA con CodeRunner", desc: "Plataforma académica con evaluación automática de código para formación interna.", status: "Activo", line: "Formación" },
  { title: "Agente académico (n8n + Notion + Telegram)", desc: "Automatización de seguimiento, recordatorios y bitácoras del semillero.", status: "Piloto", line: "Agentes inteligentes" },
  { title: "Superresolución de imágenes satelitales", desc: "Modelos de SR aplicados a imágenes de baja resolución para análisis territorial.", status: "En diseño", line: "Visión artificial" },
  { title: "Avalúos catastrales con IA", desc: "Modelos predictivos de valoración predial integrando datos espaciales y socioeconómicos.", status: "En diseño", line: "Ciencia de Datos" },
  { title: "TinyML para percepción artificial embebida", desc: "Despliegue de modelos en microcontroladores para inferencia en tiempo real.", status: "En curso", line: "TinyML" },
  { title: "Portal académico PerceptIA", desc: "Sitio institucional y portal interno del semillero (este sitio).", status: "Activo", line: "Plataforma" },
  { title: "Clustering visual de frutas en diferentes estados", desc: "Agrupamiento no supervisado de imágenes de frutas según su estado de maduración y deterioro.", status: "En curso", line: "Visión artificial" },
  { title: "IA para la detección de lavado de activos", desc: "Modelos de aprendizaje automático para identificar patrones sospechosos en transacciones financieras.", status: "En diseño", line: "Ciencia de Datos" },
  { title: "Predicción del índice SPEI para el análisis de sequías", desc: "Modelos predictivos del Índice Estandarizado de Precipitación-Evapotranspiración para monitoreo climático.", status: "En curso", line: "Ciencia de Datos" },
  { title: "Explorando los Agentes LLM", desc: "Investigación aplicada sobre arquitecturas de agentes basados en modelos de lenguaje y sus casos de uso.", status: "En diseño", line: "Agentes inteligentes" },
];

export const RESULTS = [
  { label: "Producción científica", value: "Artículos en revistas indexadas" },
  { label: "Producción regional", value: "Publicaciones de impacto local" },
  { label: "Capítulos de libro", value: "Contribuciones colectivas" },
  { label: "Libros", value: "Obras editadas" },
  { label: "Prototipos funcionales", value: "Hardware + software" },
  { label: "Datasets curados", value: "Corpus reproducibles" },
  { label: "Participación estudiantil", value: "Formación investigativa" },
  { label: "Eventos científicos", value: "Ponencias y socialización" },
];

export const MEMBERS = [
  { name: "José Andrés Zúñiga Cazorla", role: "Profesor asesor", carrera: "Ciencia de Datos e IA" },
  { name: "Estudiante coordinador/a", role: "Coordinación", carrera: "Ciencia de Datos e IA" },
  { name: "Estudiantes investigadores", role: "Investigación", carrera: "Ciencia de Datos e IA" },
  { name: "Docentes colaboradores", role: "Colaboración", carrera: "TIC / Ingeniería" },
  { name: "Equipos por proyecto", role: "Conformación dinámica", carrera: "Multidisciplinar" },
];
