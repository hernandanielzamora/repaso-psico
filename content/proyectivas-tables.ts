import type { Question } from "../data";
import type { DeterminantRow, Region } from "../lib/proyectivas-types";
import { plateMedia } from "./proyectivas-plates";

const whole: Region = { x: .1, y: .06, width: .8, height: .88 };
const center: Region = { x: .37, y: .32, width: .26, height: .35 };
const left: Region = { x: .1, y: .25, width: .26, height: .5 };
const right: Region = { x: .64, y: .25, width: .26, height: .5 };
const row = (response: string, inquiry: string, codes: string[], explanation: string, region = whole): DeterminantRow => ({ response, inquiry, codes, explanation, region });

const sets: { plate: number; title: string; pages: [number, number]; rows: DeterminantRow[] }[] = [
  { plate: 1, title: "Forma y color acromático", pages: [57, 67], rows: [
    row("Una figura con alas.", "Me guío solo por el contorno de alas y cuerpo. El negro no influyó y no se mueve.", ["F"], "Hay forma solamente. El color físico no basta: fue excluido de modo explícito por el interrogatorio."),
    row("Un murciélago negro.", "Las alas y el cuerpo tienen límites definidos; además tiene que ser negro para que yo lo vea así.", ["FC'"], "Forma definida y negro como color del objeto: FC’. No es FC cromático ni textura, porque no se menciona tacto."),
    row("Una masa oscura.", "El gris oscuro es lo principal; algo de contorno hay, pero no tiene una forma específica.", ["C'F"], "Acromático predominante con forma vaga. No corresponde FC’ porque el interrogatorio subordina el contorno.", center)
  ] },
  { plate: 2, title: "Predominio cromático", pages: [63, 66], rows: [
    row("Un objeto rojo de bordes definidos.", "Lo reconozco por su silueta precisa y por su color rojo; primero manda la forma.", ["FC"], "Color cromático subordinado a forma definida. No se agregan F y C como códigos separados de esa misma relación.", { x: .32, y: .67, width: .36, height: .24 }),
    row("Una mancha de sangre.", "Principalmente por el rojo. Hay un borde vago, pero no una figura precisa.", ["CF"], "Color predominante con forma secundaria: CF. El contenido sangre no decide por sí solo: aquí lo aclara el interrogatorio.", { x: .32, y: .67, width: .36, height: .24 }),
    row("Sangre.", "Únicamente por el rojo; no le atribuyo contorno ni figura.", ["C"], "Color sin forma: C. No debe inventarse una F por el mero hecho de que la mancha tenga borde físico.", { x: .32, y: .67, width: .36, height: .24 })
  ] },
  { plate: 3, title: "Movimiento humano y determinantes múltiples", pages: [60, 69], rows: [
    row("Dos personas haciendo una tarea juntas.", "Por las siluetas y la postura: están levantando algo; no intervienen el color ni los matices.", ["M"], "Acción humana: M. La forma inherente al movimiento no se duplica como F aislada."),
    row("Un moño rojo.", "Por el lazo con dos puntas bien delimitadas y también por el rojo. No está moviéndose.", ["FC"], "FC, no M por estar en la lámina kinestésica. Se codifica esta respuesta, no el nombre atribuido a la tarjeta.", { x: .42, y: .37, width: .16, height: .17 }),
    row("Dos figuras bailan con accesorios rojos y ropa suave.", "La acción de bailar es humana; los accesorios tienen forma precisa y el rojo es necesario; los matices me dan la sensación táctil de tela suave con forma definida.", ["M", "FC", "Fc"], "Tres fundamentos explícitos: acción humana (M), forma-color cromático (FC) y forma-textura (Fc). Es un caso construido para practicar multiplicidad, sin evaluar adecuación formal ni frecuencia.")
  ] },
  { plate: 4, title: "Color acromático y movimiento inanimado", pages: [61, 67], rows: [
    row("Petróleo negro.", "Solo por lo negro, sin forma y sin movimiento.", ["C'"], "Color acromático puro. Ni C cromático ni K: no se describe profundidad o bruma."),
    row("Una figura bien delimitada cayendo.", "Tiene una silueta precisa y cae por gravedad; no actúa voluntariamente.", ["Fm"], "Movimiento inanimado con forma definida. Lo decisivo es la fuerza física, no si el contenido parece humano o animal."),
    row("Nubes que pasan.", "Se desplazan; sus contornos son vagos. El gris no determina la respuesta.", ["mF"], "Movimiento inanimado con forma secundaria. No es Fm porque la forma no está definida.")
  ] },
  { plate: 5, title: "No deducir movimiento por el contenido", pages: [57, 66], rows: [
    row("Una mariposa quieta.", "Solo la silueta de las alas y el cuerpo. No está volando; el negro no tuvo importancia.", ["F"], "Animal quieto y forma solamente: F, no FM. La especie no crea movimiento."),
    row("Un animal que cae sin vida.", "Cae por su peso; la figura tiene un contorno preciso. No atribuyo movimiento propio al animal.", ["Fm"], "La caída por gravedad se codifica como movimiento inanimado, aunque el contenido sea un animal."),
    row("Un murciélago negro.", "Forma definida de alas y cuerpo; ser negro es parte de lo que me hizo verlo.", ["FC'"], "La explicación incluye negro como color. No omitirlo, ni confundirlo con una sensación táctil.")
  ] },
  { plate: 6, title: "Textura y predominio formal", pages: [67, 69], rows: [
    row("Un cuero de vaca suave.", "Reconozco una forma definida de cuero y los matices me dan sensación al tacto. Predomina la forma.", ["Fc"], "Textura con forma definida: Fc, c minúscula. No FC, porque no se usa color cromático como fundamento."),
    row("Una superficie de cuero blanda.", "Lo principal es la sensación táctil que me dan los tonos; la forma del cuero es secundaria e imprecisa.", ["cF"], "Textura predominante con forma secundaria: cF. No basta nombrar cuero para suponer predominio formal."),
    row("Suavidad.", "Únicamente la sensación de suave por los matices; no le doy figura a nada.", ["c"], "Textura sin forma: c. No C cromático; tampoco añadir F si el interrogatorio la excluye.")
  ] },
  { plate: 7, title: "Profundidad por claroscuro", pages: [69, 70], rows: [
    row("Un relieve con dos paredes bien definidas.", "Los tonos me hacen ver profundidad entre las paredes; sus contornos son precisos y organizan el conjunto.", ["FK"], "Claroscuro de profundidad/volumen con forma predominante: FK. K mayúscula no equivale a k de radiografía."),
    row("Un paisaje lejano.", "Lo que predomina es la distancia por los matices; las figuras del paisaje son vagas.", ["KF"], "Profundidad con forma secundaria: KF."),
    row("Bruma muy densa.", "Por lo difuso y oscuro; no hay forma definida, movimiento ni sensación táctil.", ["K"], "Claroscuro difuso sin forma, en el sistema del resumen: K. No confundir neblina estática con movimiento inanimado ni con color acromático puro.")
  ] },
  { plate: 8, title: "Acción animal, humana y fuerzas físicas", pages: [60, 62], rows: [
    row("Un cuadrúpedo trepando.", "Está trepando como lo haría un animal; no usé su color ni su textura.", ["FM"], "Movimiento animal propio: FM. El color de la lámina fue explícitamente excluido.", left),
    row("Un animal bailando una danza humana.", "Baila por sí mismo como una persona; no es circo ni está adiestrado. Lo veo por la postura, sin usar color.", ["M"], "El apunte clasifica como M la acción humana atribuida al animal sin adiestramiento, aunque el contenido siga siendo animal.", right),
    row("Un animal cayendo.", "Su contorno es definido, pero el movimiento es una caída por gravedad. No uso color.", ["Fm"], "Fm, movimiento por una fuerza física con forma definida. No FM solo por el contenido animal.", left)
  ] },
  { plate: 9, title: "Representación tridimensional en bidimensión", pages: [69, 70], rows: [
    row("Una radiografía de pelvis.", "Los matices dan la imagen radiográfica; puedo localizar la pelvis con límites precisos. No la veo con volumen real ni por sus colores.", ["Fk"], "Tridimensión representada en bidimensión, con forma definida: Fk. No FK de profundidad percibida directamente."),
    row("Una radiografía de huesos.", "Por los matices; apenas hay una forma vaga de huesos, que es secundaria.", ["kF"], "Tridimensión en bidimensión con forma secundaria: kF."),
    row("Una radiografía.", "Únicamente el efecto radiográfico de los matices, sin ninguna estructura reconocible.", ["k"], "Tridimensión en bidimensión sin forma: k. Son respuestas didácticas: no se juzga adecuación formal del percepto en esta lámina.")
  ] },
  { plate: 10, title: "Nombrar, describir y proyectar movimiento", pages: [61, 66], rows: [
    row("Azul, verde y rosa.", "Solo estoy nombrando los colores; no veo objetos.", ["C n"], "Color nombrado: enumera colores sin construir perceptos. No es forma-color por el hecho de pronunciar varios nombres."),
    row("El azul se aclara al borde y se mezcla con el rosa hacia el centro.", "Describo las relaciones entre colores, sin objetos ni formas.", ["C desc"], "Color descripto: desarrolla características y relaciones, no solo una lista de nombres."),
    row("Una energía que se expande.", "Solo el movimiento de expandirse, sin forma ni participación del color.", ["m"], "Movimiento inanimado sin forma: m. El ejemplo no sostiene C porque el interrogatorio excluye el color.")
  ] },
  { plate: 10, title: "Colores forzado, arbitrario y simbólico", pages: [63, 65], rows: [
    row("Una araña celeste.", "La forma de araña es precisa; aunque no sea su color natural, fuerzo el celeste para verla de ese color.", ["FC forz"], "Forma definida con relación de color forzada: FC forz según los ejemplos del apunte. La aclaración evita deducirlo solo por una especie o un color.", left),
    row("Un esquema de órganos definidos.", "Uso los colores solamente para delimitar los órganos, que reconozco por su forma. Podría intercambiar los colores sin cambiar lo que veo.", ["FC arb"], "Color arbitrario como delimitador, no como color natural necesario del objeto.", whole),
    row("Una figura vestida de verde que representa la esperanza.", "La figura tiene forma precisa y el verde lo empleo expresamente como símbolo de esperanza, no para delimitar partes.", ["FC simb"], "Forma definida más valor simbólico del color explicitado. No se infiere una simbolización universal del verde sin el interrogatorio.", center)
  ] }
];

export const determinantQuestions: Question[] = sets.map((set, index) => ({
  id: `proy-cuadro-${index + 1}`, subjectId: "proyectivas", type: "determinant-table", unit: "u6", topic: "Determinantes", difficulty: "Aplicación",
  prompt: `Cuadro · Lámina ${set.plate}: ${set.title}. Completá hasta tres determinantes por respuesta.`,
  sourcePages: set.pages, source: `Resumen Completo Proyectivas.pdf, pp. ${set.pages[0]}–${set.pages[1]} (páginas del archivo).`, media: plateMedia(set.plate),
  explanation: "Las verbalizaciones e interrogatorios son ficticios. Los cuadros marcan áreas aproximadas de referencia, no localizaciones D/Dd normadas. El ejercicio corrige la familia y el predominio de los determinantes explicitados; no evalúa calidad formal ni realiza diagnóstico. El orden entre códigos independientes no se penaliza. No se duplican F y un compuesto que ya incorpora forma.",
  rubric: ["Justifica cada código con el interrogatorio.", "Respeta mayúsculas, orden dentro del código y apóstrofos.", "Deja vacías las columnas que no corresponden."],
  projection: { plate: set.plate, rows: set.rows, criteria: [] }
}));
