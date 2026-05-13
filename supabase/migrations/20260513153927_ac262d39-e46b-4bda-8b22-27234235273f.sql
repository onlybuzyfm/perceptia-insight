ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS line text;

INSERT INTO public.projects (title, slug, description, status, is_published, icon, line) VALUES
  ('Dataset de frutas con visión por computador', 'dataset-frutas-vc', 'Construcción y curación de un dataset visual de frutas locales para clasificación con CNNs ligeras.', 'activo', true, 'apple', 'Datasets locales'),
  ('CVAT para anotación colaborativa', 'cvat-anotacion', 'Infraestructura compartida para etiquetado de imágenes y video del semillero.', 'activo', true, 'tags', 'Curación de datos'),
  ('Moodle PerceptIA con CodeRunner', 'moodle-coderunner', 'Plataforma académica con evaluación automática de código para formación interna.', 'activo', true, 'graduation-cap', 'Formación'),
  ('Agente académico (n8n + Notion + Telegram)', 'agente-academico', 'Automatización de seguimiento, recordatorios y bitácoras del semillero.', 'planificacion', true, 'bot', 'Agentes inteligentes'),
  ('Superresolución de imágenes satelitales', 'superresolucion-satelital', 'Modelos de SR aplicados a imágenes de baja resolución para análisis territorial.', 'planificacion', true, 'satellite', 'Visión artificial'),
  ('Avalúos catastrales con IA', 'avaluos-catastrales', 'Modelos predictivos de valoración predial integrando datos espaciales y socioeconómicos.', 'planificacion', true, 'landmark', 'Ciencia de Datos'),
  ('TinyML para percepción artificial embebida', 'tinyml-embebida', 'Despliegue de modelos en microcontroladores para inferencia en tiempo real.', 'activo', true, 'cpu', 'TinyML'),
  ('Portal académico PerceptIA', 'portal-perceptia', 'Sitio institucional y portal interno del semillero (este sitio).', 'activo', true, 'globe', 'Plataforma'),
  ('Clustering visual de frutas en diferentes estados', 'clustering-frutas', 'Agrupamiento no supervisado de imágenes de frutas según su estado de maduración y deterioro.', 'activo', true, 'scan-search', 'Visión artificial'),
  ('IA para la detección de lavado de activos', 'ia-lavado-activos', 'Modelos de aprendizaje automático para identificar patrones sospechosos en transacciones financieras.', 'planificacion', true, 'shield-alert', 'Ciencia de Datos'),
  ('Predicción del índice SPEI para el análisis de sequías', 'spei-sequias', 'Modelos predictivos del Índice Estandarizado de Precipitación-Evapotranspiración para monitoreo climático.', 'activo', true, 'cloud-rain', 'Ciencia de Datos'),
  ('Explorando los Agentes LLM', 'agentes-llm', 'Investigación aplicada sobre arquitecturas de agentes basados en modelos de lenguaje y sus casos de uso.', 'planificacion', true, 'brain-circuit', 'Agentes inteligentes')
ON CONFLICT (slug) DO NOTHING;