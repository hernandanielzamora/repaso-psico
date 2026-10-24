import type { Question } from "../data";
import type { AperceptiveMode, DeterminantRow, Region } from "../lib/proyectivas-types";
import { aperceptiveGuide } from "../lib/proyectivas";
import { plateMedia } from "./proyectivas-plates";

const whole: Region = { x: .1, y: .06, width: .8, height: .88 };
const center: Region = { x: .37, y: .32, width: .26, height: .35 };
const left: Region = { x: .1, y: .25, width: .26, height: .5 };
const right: Region = { x: .64, y: .25, width: .26, height: .5 };
const row = (response: string, inquiry: string, codes: string[], explanation: string, region = whole, mode: AperceptiveMode = "W"): DeterminantRow => ({ response, inquiry, codes, explanation, region, mode, localization: aperceptiveGuide[mode].evidence, modeExplanation: aperceptiveGuide[mode].explanation });

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
  ] },
  { plate: 3, title: "Detalles usuales y espacio blanco", pages: [53, 63], rows: [
    row("Una persona levantando algo.", "Uso solo la figura lateral izquierda, bien separable del conjunto; por su postura está levantando un objeto. El color no interviene.", ["M"], "Acción humana sustentada en el interrogatorio: M. El detalle de una figura no es global.", { x: .23, y: .22, width: .22, height: .6 }, "D"),
    row("Un moño rojo.", "Únicamente la pequeña figura roja del centro, por sus dos lóbulos bien delimitados y su color.", ["FC"], "FC: color cromático subordinado a forma definida. D y FC responden preguntas distintas.", { x: .42, y: .37, width: .16, height: .17 }, "D"),
    row("Un objeto claro con alas.", "Solo interpreto el hueco blanco entre las figuras. Por su contorno; el blanco como color no me hizo verlo.", ["F"], "S es localización; no obliga a sumar color acromático. El fundamento declarado es solo formal.", { x: .43, y: .53, width: .13, height: .13 }, "S")
  ] },
  { plate: 1, title: "Recortes inusuales: interior, borde y límite no habitual", pages: [55, 59], rows: [
    row("Un ojo.", "Lo recorto en un punto oscuro dentro de la parte derecha; no toca el borde ni el blanco. Solo su forma me hace verlo.", ["F"], "El contraste sirve para ubicar el recorte; no se usa como textura o profundidad.", { x: .66, y: .46, width: .045, height: .045 }, "Ddi"),
    row("Un perfil.", "Sigo un tramo del contorno exterior izquierdo, sin incluir la superficie. No hay color ni movimiento en mi respuesta.", ["F"], "Respuesta formal en un detalle de borde. El dato de localización es el contorno exclusivamente.", { x: .15, y: .27, width: .13, height: .15 }, "Dde"),
    row("Una criatura con alas.", "Recorto la porción superior con una línea imaginaria que atraviesa la mancha y excluyo lo inferior, sin seguir una división habitual. Me guío por forma.", ["F"], "Ddr se fundamenta en el límite imaginario no habitual, no en que el nombre de la criatura resulte raro.", { x: .08, y: .06, width: .84, height: .4 }, "Ddr")
  ] },
  { plate: 2, title: "Blanco puro: localización y determinante son diferentes", pages: [53, 66], rows: [
    row("Un trompo.", "Utilizo exclusivamente el hueco blanco central. Es por su contorno, no por su blancura.", ["F"], "El espacio interpretado es S; el rasgo que determina el percepto es la forma, F.", { x: .4, y: .45, width: .2, height: .2 }, "S"),
    row("Una pequeña nave que asciende.", "La nave ocupa solo el espacio blanco, tiene contorno preciso y se mueve como objeto. El blanco como color no influyó.", ["Fm"], "Movimiento inanimado con forma definida: Fm. No confundir S, localización, con movimiento.", { x: .4, y: .45, width: .2, height: .2 }, "S"),
    row("Una estatuilla blanca.", "Solo ese espacio blanco. La figura es precisa y su blancura, además de la forma, sí es necesaria para que la vea.", ["FC'"], "Aquí el interrogatorio sí incorpora color acromático a la forma. El modo sigue siendo S.", { x: .4, y: .45, width: .2, height: .2 }, "S")
  ] },
  { plate: 8, title: "Diferenciar detalle usual e inusual", pages: [53, 63], rows: [
    row("Un cuadrúpedo trepando.", "Solo el animal lateral izquierdo; uso su silueta y la postura de trepar, no el color.", ["FM"], "Movimiento animal propio, FM; el área lateral se establece como detalle usual en este caso.", left, "D"),
    row("Una pequeña forma irregular.", "Recorto una zona poco separable del conjunto central. No se aportan datos suficientes para precisar un subtipo de detalle inusual. Uso solo el contorno.", ["F"], "Se pide Dd general: no hay fundamento para inventar si es interno, externo, raro o diminuto.", { x: .44, y: .32, width: .12, height: .14 }, "Dd"),
    row("Un animal quieto.", "Únicamente la figura lateral derecha, bien separable. Me baso en su contorno y excluyo color y movimiento.", ["F"], "Contenido animal no implica FM. El interrogatorio describe forma solamente y un detalle usual.", right, "D")
  ] },
  { plate: 1, title: "Blanco complementario o punto de partida", pages: [53, 66], rows: [
    row("Una mariposa con huecos blancos en sus alas.", "Primero organizo toda la mancha como mariposa y luego incorporo los huecos como marcas. Solo los contornos, no el color, sustentan la respuesta.", ["F"], "WS: organización global desde la mancha y blanco complementario. El blanco no se codifica automáticamente como C'.", whole, "WS"),
    row("Figuras blancas flotando en una escena nocturna.", "Parto de los huecos blancos y después incorporo toda la mancha como escena. Las figuras tienen forma definida; flotan por una fuerza física, sin usar el color.", ["Fm"], "SW: organización desde el blanco con totalidad pigmentada complementaria. La flotación por fuerza física sostiene Fm.", whole, "SW"),
    row("Un pequeño óvalo.", "Solo una zona dentro de la superficie pigmentada derecha, sin llegar al borde ni usar los blancos. Es por su contorno.", ["F"], "Ddi: recorte interior. No se clasifica S porque el interrogatorio excluye el blanco.", { x: .73, y: .49, width: .06, height: .07 }, "Ddi")
  ] },
  { plate: 2, title: "Detalle y blanco en distinto orden", pages: [53, 63], rows: [
    row("Un animal con la boca abierta.", "Parto de un detalle lateral bien segregable e incorporo un hueco blanco como abertura de su boca. Lo veo solo por los contornos, sin acción ni color.", ["F"], "DS: el detalle inicia la organización; el blanco lo complementa. La boca abierta no basta para atribuir movimiento.", { x: .2, y: .32, width: .29, height: .46 }, "DS"),
    row("Un cohete que sube y una llama roja debajo.", "Empiezo por el hueco blanco como cohete preciso que asciende y agrego el detalle rojo como llama. La llama la veo solo por el rojo, sin forma.", ["Fm", "C"], "SD: el blanco inicia la escena. El cohete de forma definida aporta Fm y la llama cromática sin forma aporta C.", { x: .32, y: .44, width: .36, height: .4 }, "SD"),
    row("Una mancha de sangre.", "Tomo únicamente la zona roja inferior, fácilmente segregable. El rojo domina y el contorno es vago.", ["CF"], "D y CF: detalle usual con color predominante y forma secundaria.", { x: .38, y: .64, width: .24, height: .22 }, "D")
  ] },
  { plate: 10, title: "Detalles diminutos e independientes", pages: [55, 63], rows: [
    row("Una pequeña semilla.", "Solo el pequeño punto marrón en lo amarillo inferior izquierdo, bastante aislado. Es por su contorno; el color no intervino.", ["F"], "Ddd por el carácter pequeño e independiente establecido en el caso. F por el contorno.", { x: .39, y: .69, width: .045, height: .06 }, "Ddd"),
    row("Un objeto diminuto de color marrón.", "Tomo el pequeño elemento aislado del lado inferior derecho. Su forma es precisa y el marrón también determina lo que veo.", ["FC"], "Detalle diminuto más forma-color cromático. Pequeño describe la localización, no la calidad formal.", { x: .56, y: .69, width: .045, height: .06 }, "Ddd"),
    row("Un pequeño objeto que cae.", "Uso solamente un pequeño elemento separado del resto; le doy forma precisa y lo veo caer por gravedad, sin usar el color.", ["Fm"], "Ddd no impide movimiento: Fm por la caída y la forma definida.", { x: .47, y: .38, width: .06, height: .07 }, "Ddd")
  ] },
  { plate: 5, title: "Conservar globales y contrastar recortes", pages: [50, 61], rows: [
    row("Una mariposa quieta.", "Uso toda la mancha como una sola figura; exclusivamente por sus contornos.", ["F"], "Se conserva el caso global W y el determinante F.", whole, "W"),
    row("Solo alas de un murciélago.", "Interpreto únicamente las alas y no integro el animal completo; el caso toma la convención histórica de un área donde suele organizarse esa figura completa. Es por su forma.", ["F"], "Do: reducción a una parte de una figura habitualmente integrada, según el ejemplo del resumen. No es un diagnóstico de la persona.", { x: .12, y: .3, width: .76, height: .38 }, "Do"),
    row("Un perfil en un borde.", "Sigo solo un tramo del límite exterior del ala izquierda, sin usar su superficie ni el resto del animal. Lo veo por forma.", ["F"], "Dde: uso exclusivo del borde; no confundir con toda el ala ni con una global.", { x: .12, y: .33, width: .16, height: .12 }, "Dde")
  ] }
];

// Explicit editorial localizations for the 33 existing rows, independent of rectangle size.
const originalModes: AperceptiveMode[][] = [
  ["W", "W", "Ddi"], ["D", "D", "D"], ["W", "D", "W"], ["W", "W", "W"],
  ["W", "W", "W"], ["W", "W", "W"], ["W", "W", "W"], ["D", "D", "D"],
  ["W", "W", "W"], ["W", "W", "W"], ["D", "W", "D"]
];

export const determinantQuestions: Question[] = sets.map((set, index) => ({
  id: `proy-cuadro-${index + 1}`, subjectId: "proyectivas", type: "determinant-table", unit: "u6", topic: "Determinantes", difficulty: "Aplicación",
  prompt: `Cuadro · Lámina ${set.plate}: ${set.title}. Completá el modo aperceptivo y hasta tres determinantes por respuesta.`,
  sourcePages: [50, set.pages[1]], source: `Resumen Completo Proyectivas.pdf, pp. 50–${set.pages[1]} (páginas del archivo).`, media: plateMedia(set.plate),
  explanation: "Las verbalizaciones e interrogatorios son ficticios. Los cuadros marcan áreas aproximadas; la localización se establece explícitamente en cada caso con las definiciones del apunte. La clave del modo se basa en esa descripción, no en una norma D/Dd deducida del rectángulo. Se corrigen por separado modo aperceptivo y determinantes; no se evalúa calidad formal ni se realiza diagnóstico. El orden entre códigos independientes no se penaliza.",
  rubric: ["Justifica cada código con el interrogatorio.", "Respeta mayúsculas, orden dentro del código y apóstrofos.", "Deja vacías las columnas que no corresponden."],
  projection: { plate: set.plate, rows: set.rows.map((r, i) => {
    const mode = originalModes[index]?.[i] ?? r.mode;
    return { ...r, mode, localization: aperceptiveGuide[mode].evidence, modeExplanation: aperceptiveGuide[mode].explanation,
      ...(index === 0 && i === 2 ? { region: { x: .65, y: .45, width: .08, height: .08 } } : {}) };
  }), criteria: [] }
}));
