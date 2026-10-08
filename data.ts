import { saniQuestions, saniTopics, saniUnits } from "./content/sani";

export type Topic = "RMf" | "Estadística" | "tES" | "Integración";
export type SubjectId = "psicologia-experimental" | (string & {});
export type QuestionType = "choice" | "development" | "true-false" | "image-analysis" | "case-study" | "flashcard";

export type StudyUnit = { id: string; name: string; pages: [number, number] };

export type MediaAsset = {
  type: "image";
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
  credit?: string;
};

export type Subject = {
  id: SubjectId;
  name: string;
  shortName: string;
  description: string;
  questionTypes: QuestionType[];
  topics: string[];
  demo?: boolean;
  accent: string;
  soft: string;
  mark: string;
  units?: StudyUnit[];
  studyNote?: string;
};

export const subjects: Subject[] = [
  {
    id: "psicologia-experimental",
    name: "Psicología Experimental",
    shortName: "Psico Experimental",
    description: "RMf, salmón muerto, estadística y tES.",
    questionTypes: ["choice", "development", "image-analysis"],
    topics: ["RMf", "Estadística", "tES", "Integración"],
    accent: "#31513a", soft: "#e3eee1", mark: "E"
  },
  {
    id: "sani", name: "Psicología Sanitaria", shortName: "Sani",
    description: "Cinco unidades para preparar tus parciales y el final: conceptos, derechos, epidemiología y práctica comunitaria.",
    questionTypes: ["choice", "true-false", "development", "case-study", "flashcard", "image-analysis"],
    topics: saniTopics, units: saniUnits,
    studyNote: "Actividades basadas en Sani Final PDF (107 páginas). Los casos y esquemas son ejercicios didácticos. Las referencias legales e históricas se estudian según el resumen, no como una actualización normativa.",
    accent: "#31513a", soft: "#e3eee1", mark: "S"
  },
  {
    id: "psicopato", name: "PsicoPato", shortName: "PsicoPato",
    description: "Probá la práctica con imágenes. Falta incorporar el material de la materia.",
    questionTypes: ["image-analysis"], topics: ["Demostración"],
    demo: true, accent: "#8d522f", soft: "#fff0d7", mark: "🦆"
  }
];

export const questionTypeLabels: Record<QuestionType, string> = {
  choice: "Elección múltiple",
  development: "Desarrollo",
  "true-false": "Verdadero o falso",
  "image-analysis": "Análisis de imagen",
  "case-study": "Casos de aplicación",
  flashcard: "Repaso oral con tarjetas"
};

export type Question = {
  id: string;
  subjectId: SubjectId;
  type: QuestionType;
  topic: string;
  unit?: string;
  finalOnly?: boolean;
  sourcePages?: [number, number];
  difficulty: "Base" | "Aplicación" | "Integración";
  prompt: string;
  options?: string[];
  answer?: number;
  explanation: string;
  source: string;
  rubric?: string[];
  media?: MediaAsset;
};

const experimentalQuestions: Omit<Question, "subjectId">[] = [
  {
    id: "vigilance-image", type: "image-analysis", topic: "tES", difficulty: "Aplicación",
    prompt: "Observá las dos curvas. ¿Cuál representa la estimulación simulada y qué permite concluir la comparación?",
    explanation: "La curva B representa la estimulación simulada: el rendimiento disminuye con el tiempo. La curva A representa la estimulación real, que mantiene el rendimiento relativamente estable. Según el resumen, la estimulación real mitigó el decremento en vigilancia frente a sham. El esquema no permite deducir valores numéricos ni significación estadística.",
    rubric: ["Identifica B como sham y A como estimulación real.", "Describe el decremento en vigilancia en sham y el mantenimiento relativo en real.", "Distingue el patrón cualitativo de una prueba de significación estadística."],
    source: "Resumen aportado, pp. 19–20: estudio de vigilancia de Luna y colaboradores (2020).",
    media: { type: "image", src: "/images/vigilancia.svg", alt: "Esquema de aciertos de detección a lo largo del tiempo: la curva A se mantiene horizontal y la curva B desciende. Ambas parten del mismo nivel.", width: 800, height: 480, caption: "Esquema didáctico basado en el resumen; sin valores numéricos. No es la figura original del estudio.", credit: "Elaboración para Núcleo a partir del resumen aportado." }
  },
  {
    id: "rmf-indirecta",
    type: "choice",
    topic: "RMf",
    difficulty: "Base",
    prompt: "¿Qué registra principalmente la RMf según los textos?",
    options: [
      "La actividad eléctrica de cada neurona en tiempo real",
      "Cambios asociados a la oxigenación de la sangre mediante la señal BOLD",
      "La conducta del participante sin ningún procesamiento estadístico",
      "La activación consciente de una región cerebral"
    ],
    answer: 1,
    explanation: "La RMf no mide directamente la actividad neuronal: registra cambios relacionados con la proporción de oxihemoglobina y desoxihemoglobina. Por eso es una medida indirecta y retrasada.",
    source: "Textos 1 y 2: IRMf/BOLD y medición indirecta."
  },
  {
    id: "salmon",
    type: "choice",
    topic: "Estadística",
    difficulty: "Aplicación",
    prompt: "¿Por qué el salmón muerto pareció mostrar actividad cerebral?",
    options: [
      "Porque el salmón conservaba actividad neuronal residual",
      "Porque el análisis sin corrección permitió confundir ruido con señal",
      "Porque la RMf solo funciona en animales vivos",
      "Porque se usó EEG en vez de RMf"
    ],
    answer: 1,
    explanation: "El ejemplo muestra que, con ruido y muchas comparaciones, un umbral inadecuado puede producir un falso positivo incluso en un cerebro sin actividad.",
    source: "Texto 1: estudio de Bennett y Baird (2009)."
  },
  {
    id: "multiple-comparisons",
    type: "choice",
    topic: "Estadística",
    difficulty: "Base",
    prompt: "¿Qué problema resuelve principalmente la corrección por comparaciones múltiples?",
    options: [
      "El retraso hemodinámico de la BOLD",
      "La pérdida de resolución espacial de la tES",
      "El aumento de falsos positivos al probar muchos vóxeles o clusters",
      "La variabilidad individual de la vigilancia"
    ],
    answer: 2,
    explanation: "Cuando se prueban miles de puntos, algunos parecerán significativos por azar. FWE, FDR, clusters o simulaciones Montecarlo controlan ese riesgo con distintos compromisos.",
    source: "Textos 1 y 2: dardos, FWE, FDR, cluster y Montecarlo."
  },
  {
    id: "double-dipping",
    type: "choice",
    topic: "Estadística",
    difficulty: "Aplicación",
    prompt: "Un equipo selecciona los vóxeles más activos y correlaciona la personalidad con esos mismos datos. ¿Cuál es el problema?",
    options: [
      "Es una ROI anatómica correctamente definida",
      "Es double dipping: la selección y el análisis no son independientes",
      "Es MVPA, que evita la sustracción",
      "Es una corrección FDR demasiado estricta"
    ],
    answer: 1,
    explanation: "El análisis es circular: se eligen los vóxeles por su relación con los datos y luego se vuelve a evaluar esa relación. La solución propuesta es usar datos independientes o un criterio anatómico.",
    source: "Texto 2: double dipping y selección de ROI."
  },
  {
    id: "fwe-fdr",
    type: "choice",
    topic: "Estadística",
    difficulty: "Base",
    prompt: "¿Cuál es la diferencia general entre FWE y FDR?",
    options: [
      "FWE es más restrictiva; FDR es más laxa",
      "FWE se usa para tES y FDR para EEG",
      "FWE no controla falsos positivos; FDR sí los elimina por completo",
      "No hay diferencia metodológica"
    ],
    answer: 0,
    explanation: "FWE/Bonferroni limita con fuerza los falsos positivos, aunque puede aumentar falsos negativos. FDR es más laxa y acepta otro equilibrio entre ambos errores.",
    source: "Texto 2: correcciones por comparaciones múltiples."
  },
  {
    id: "subtraction",
    type: "choice",
    topic: "RMf",
    difficulty: "Integración",
    prompt: "¿Qué supone la lógica de sustracción y cuál es su crítica principal?",
    options: [
      "Resta tarea menos línea base y supone que la interacción entre procesos es nula",
      "Resta participantes entre sí y elimina toda variabilidad individual",
      "Resta el ruido del escáner sin necesitar una condición de control",
      "Resta BOLD de EEG y demuestra causalidad"
    ],
    answer: 0,
    explanation: "La sustracción compara tarea y base, pero la mera inserción puede ignorar interacciones funcionales o fisiológicas entre procesos preexistentes y el proceso estudiado.",
    source: "Texto 2: sustracción cognitiva, mera inserción y alternativas MVPA/reposo."
  },
  {
    id: "tes-mechanism",
    type: "choice",
    topic: "tES",
    difficulty: "Base",
    prompt: "¿Cómo actúa la tES sobre las neuronas?",
    options: [
      "Las dispara de manera obligatoria",
      "Las destruye temporalmente para medir su función",
      "Modula sus umbrales y la probabilidad de activación",
      "Reemplaza la señal BOLD por una señal eléctrica"
    ],
    answer: 2,
    explanation: "La tES no activa ni bloquea por sí sola: polariza y modifica la probabilidad de que las neuronas se activen ante otras entradas.",
    source: "Texto 3: mecanismo de modulación de umbrales."
  },
  {
    id: "tes-polarity",
    type: "choice",
    topic: "tES",
    difficulty: "Base",
    prompt: "Según el resumen, ¿qué efecto se espera cerca del ánodo y del cátodo?",
    options: [
      "Ánodo inhibidor y cátodo excitador",
      "Ambos siempre excitadores",
      "Ánodo excitador y cátodo inhibidor",
      "El montaje no modifica el efecto"
    ],
    answer: 2,
    explanation: "El resumen presenta el ánodo como facilitador y el cátodo como inhibidor, siempre dentro de la dependencia del montaje, la intensidad, la duración y la tarea.",
    source: "Texto 3: ánodo vs. cátodo."
  },
  {
    id: "vigilance",
    type: "choice",
    topic: "tES",
    difficulty: "Aplicación",
    prompt: "En el estudio de vigilancia, ¿qué ocurrió con la estimulación real frente a la simulada?",
    options: [
      "La simulada mantuvo los aciertos y la real los redujo",
      "La real mitigó el decremento; la simulada mostró una caída progresiva",
      "No hubo tarea prolongada ni condición de control",
      "Ambas condiciones aumentaron por igual el rendimiento"
    ],
    answer: 1,
    explanation: "La tarea duró aproximadamente 33 minutos. En sham el rendimiento cayó progresivamente; con estimulación real se mantuvo más constante.",
    source: "Texto 3: Luna y colaboradores (2020), vigilancia."
  },
  {
    id: "compare-techniques",
    type: "development",
    topic: "Integración",
    difficulty: "Integración",
    prompt: "Compare la RMf y la tES en cuanto a qué hace cada técnica sobre el cerebro y qué cuidado metodológico exige.",
    explanation: "Una respuesta sólida distingue registrar de modular: la RMf registra indirectamente la señal BOLD asociada a oxigenación, con retraso y análisis correlacional; la tES aplica corriente débil para modular umbrales, con efectos dependientes de ánodo/cátodo, montaje y parámetros. La RMf exige corrección estadística, independencia de datos y controles; la tES exige sham, enmascaramiento, localización y parámetros definidos.",
    source: "Síntesis integradora de los tres textos.",
    rubric: [
      "Explica BOLD/sangre como medida indirecta y retrasada.",
      "Explica tES como modulación probabilística, no activación obligatoria.",
      "Incluye un cuidado metodológico específico de cada técnica.",
      "Relaciona la comparación con la atribución causal o correlacional sin exagerarla."
    ]
  },
  {
    id: "design-experiment",
    type: "development",
    topic: "Integración",
    difficulty: "Aplicación",
    prompt: "Diseñe un experimento con tES para evaluar si mejora la vigilancia durante una tarea prolongada. Indique VI, VD, control y resultado esperado.",
    explanation: "El diseño del resumen compara estimulación real y sham durante una tarea de detección de señales infrecuentes de aproximadamente 33 minutos. La VI es el tipo de estimulación; la VD, el porcentaje de aciertos a lo largo del tiempo. Se espera una caída en sham y un decremento mitigado con estimulación real.",
    source: "Texto 3: estudio de vigilancia de Luna y colaboradores (2020).",
    rubric: [
      "Define real vs. sham como variable independiente.",
      "Define porcentaje de aciertos a lo largo del tiempo como variable dependiente.",
      "Incluye mismo montaje y sham con corriente breve para enmascarar.",
      "Predice caída en sham y mantenimiento relativo en real."
    ]
  },
  {
    id: "false-positive",
    type: "development",
    topic: "Estadística",
    difficulty: "Aplicación",
    prompt: "Explique cómo se relacionan ruido, comparaciones múltiples y falsos positivos usando el estudio del salmón muerto.",
    explanation: "El ruido puede adoptar patrones que parecen responder a la hipótesis. Si se analizan miles de puntos con un umbral no corregido, algunos superarán el corte por azar. El salmón muerto vuelve visible ese problema: sin corrección, se interpreta ruido como actividad.",
    source: "Textos 1 y 2: salmón muerto y correcciones estadísticas.",
    rubric: [
      "Define falso positivo como un efecto aparente debido a azar o ruido.",
      "Relaciona la cantidad de comparaciones con la probabilidad de aciertos azarosos.",
      "Explica qué demuestra el salmón muerto.",
      "Menciona la necesidad de corrección y/o replicación."
    ]
  }
];

const demoQuestions: Question[] = [
  {
    id: "psicopato-demo-image", subjectId: "psicopato", type: "image-analysis", topic: "Demostración", difficulty: "Base",
    prompt: "Describí las formas y su distribución en esta imagen de demostración.",
    explanation: "Hay dos círculos en la parte superior, un triángulo en el centro y un rectángulo en la parte inferior. El objetivo es probar la observación, la ampliación y la respuesta escrita. No es una lámina de Rorschach ni permite una interpretación psicológica.",
    rubric: ["Describe las formas visibles.", "Indica su posición sin atribuirles significado psicológico."], source: "Imagen geométrica creada para probar la interfaz; no es material de la cátedra.",
    media: { type: "image", src: "/images/demo-formas.svg", alt: "Dos círculos arriba, un triángulo en el centro y un rectángulo abajo, distribuidos simétricamente.", width: 800, height: 480, caption: "Imagen de demostración. No es una lámina de Rorschach." }
  }
];

export const questions: Question[] = [
  ...experimentalQuestions.map((question) => ({ ...question, subjectId: "psicologia-experimental" })),
  ...saniQuestions,
  ...demoQuestions
];

