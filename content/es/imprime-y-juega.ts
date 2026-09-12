/**
 * Copy for /imprime-y-juega/ — the optional post-purchase offer. Both views (upsell and
 * downsell) are rendered; the Hotmart sales-funnel widget is the only decision control.
 */
export const packCopy = {
  meta: {
    title: "Pack Imprime y Juega | 384 páginas de actividades",
    description:
      "Seis PDF con 384 páginas y nueve recursos para casa, viajes, esperas, creatividad, observación, valores y juego. Oferta opcional después de comprar Grafismo Fonético.",
  },
  topbar: "Tu compra principal está confirmada · Esta oferta es opcional",
  header: { subtitle: "Pack Imprime y Juega", cta: "Ver opciones Sí / No" },
  facts: [
    { label: "6 PDF", detail: "descargables" },
    { label: "384 páginas", detail: "en A4" },
    { label: "9 recursos", detail: "visibles" },
    { label: "3 a 7 años", detail: "orientativo" },
  ],
  upsell: {
    kicker: "Oferta complementaria opcional",
    title: "Ya tienes letras y sonidos. Ahora suma actividades listas para tardes, esperas y viajes.",
    lead: "El Pack Imprime y Juega no repite Grafismo Fonético: amplía las opciones con propuestas para colorear, observar, contar, recortar, dibujar y jugar.",
    priceKicker: "Precio de esta oferta",
    decisionHint: "Elige Sí para sumar el pack a tu compra o No para continuar solo con Grafismo Fonético.",
  },
  downsell: {
    kicker: "Oferta final de este paso",
    title: "Antes de terminar: el mismo pack completo por menos.",
    lead: "Mismo contenido, mismos 6 PDF y 384 páginas. Es la última vez que verás este precio dentro del proceso de compra.",
    priceKicker: "Precio final de este paso",
    previousLabel: "Oferta anterior",
    proof: "No se reduce el contenido: 6 PDF · 384 páginas · 9 recursos",
    objections: [
      {
        title: "“No quería gastar tanto.”",
        text: "Por eso este paso baja el precio sin recortar el contenido.",
      },
      {
        title: "“No voy a imprimir 384 páginas.”",
        text: "No hace falta. Imprimes una actividad cuando la necesitas; el resto queda guardado.",
      },
      {
        title: "“Tal vez repite lo que compré.”",
        text: "No. Grafismo Fonético trabaja letras y sílabas; este pack trabaja juego, observación, valores y creatividad.",
      },
    ],
    decisionHint: "Elige Sí para agregar el pack a este precio o No para terminar tu compra.",
  },
  complement: {
    kicker: "El complemento, no una repetición",
    title: "Dos materiales, dos momentos distintos.",
    grafismo: {
      title: "Grafismo Fonético (ya es tuyo)",
      points: ["Letras y sonidos", "Sílabas y palabras", "Trazos guiados"],
    },
    pack: {
      title: "Pack Imprime y Juega (esta oferta)",
      points: [
        "Tardes en casa y viajes",
        "Observar, contar, recortar, colorear",
        "Valores, creatividad y juego",
      ],
    },
  },
  included: {
    kicker: "Qué incluye",
    title: "Nueve recursos en seis PDF.",
    lead: "Kit Tardes Tranquilas incorpora tres bonos internos (guía rápida, reconocimientos y checklist) y se completa con cinco packs temáticos.",
    total: "6 PDF · 384 páginas · 9 recursos visibles",
  },
  pages: {
    kicker: "Páginas reales",
    title: "Doce páginas tal como se imprimen.",
    lead: "Actividades reales de los distintos packs, sin maquetas.",
  },
  moments: {
    kicker: "Para qué momentos",
    title: "Una actividad lista cuando la necesitas.",
    items: [
      { icon: "home", title: "Tardes en casa", text: "Colorear, observar y recortar sin pantallas." },
      { icon: "car", title: "Viajes y esperas", text: "Aventuras para llevar en el bolso." },
      { icon: "calendar", title: "Un día a la vez", text: "30 propuestas breves con 12 comodines." },
      { icon: "heart", title: "Valores en familia", text: "Cuentos y tarjetas de conversación." },
    ],
  },
  faq: {
    kicker: "Preguntas frecuentes",
    title: "Antes de decidir.",
    items: [
      {
        q: "¿Qué recibo exactamente?",
        a: "Recibes seis PDF descargables que suman 384 páginas: Kit Tardes Tranquilas y cinco packs complementarios. El kit central también incorpora tres bonos internos.",
      },
      {
        q: "¿Los nueve recursos se entregan como nueve archivos?",
        a: "No. Recibes seis PDF. Tres de las nueve propuestas son bonos integrados dentro de Kit Tardes Tranquilas para que puedas encontrarlos en el mismo archivo.",
      },
      {
        q: "¿Es un producto físico?",
        a: "No. Es un producto digital imprimible. Recibes el acceso mediante Hotmart y eliges qué páginas imprimir.",
      },
      {
        q: "¿Para qué edades se recomienda?",
        a: "Está pensado principalmente para niños de 3 a 7 años. Puedes elegir propuestas más simples o más desafiantes según cada etapa.",
      },
      {
        q: "¿Tengo que imprimir todo?",
        a: "No. Puedes imprimir una sola actividad, preparar una selección para la semana o crear distintas carpetas por tipo de propuesta.",
      },
      {
        q: "¿Repite el kit de Grafismo Fonético que ya compré?",
        a: "No. Grafismo Fonético se concentra en letras, sonidos, sílabas y primeros trazos. Este pack amplía las opciones con actividades visuales, creatividad, viajes, valores, observación y juego.",
      },
      {
        q: "¿Necesito materiales especiales?",
        a: "No. La mayoría de las actividades se utiliza con lápices, colores, tijeras de uso infantil y materiales habituales del hogar.",
      },
      {
        q: "¿Cuándo recibo el acceso?",
        a: "Cuando Hotmart aprueba el pago, envía el acceso al correo utilizado durante la compra.",
      },
      {
        q: "¿La compra es obligatoria?",
        a: "No. Es una propuesta opcional para complementar la compra principal. Puedes continuar sin agregarla.",
      },
    ],
  },
  close: {
    kicker: "Tu decisión",
    title: "Sumar el pack o continuar: las dos opciones están bien.",
    text: "Las opciones Sí y No las muestra Hotmart dentro de esta página. Tu compra principal ya está confirmada pase lo que pase.",
    cta: "Ir a las opciones Sí / No",
  },
  widget: {
    loading: "Cargando las opciones de Hotmart…",
    fallbackTitle: "No pudimos cargar las opciones de Hotmart.",
    fallbackText:
      "Tu compra principal ya está confirmada. Puedes recargar esta página para volver a intentarlo o cerrar la ventana y revisar tu correo para acceder a Grafismo Fonético.",
    reload: "Recargar la página",
  },
  sticky: { upsell: "Sumar el pack completo", downsell: "Agregar por menos" },
} as const;
