/**
 * Copy for /grafismo-fonetico/gracias/. Neutral by design: the URL is not proof of purchase,
 * so the page guides buyers to Hotmart and points visitors without a purchase to the landing.
 */
export const graciasCopy = {
  meta: {
    title: "Tu compra está lista | Grafismo Fonético",
    description:
      "Cómo acceder a Grafismo Fonético desde Hotmart y por dónde empezar: una sola página y diez minutos.",
  },
  topbar: "Compra confirmada · Acceso digital · Soporte disponible",
  hero: {
    kicker: "Todo listo",
    title: "Todo listo. Puedes comenzar con una sola página.",
    lead: "Hotmart envía el acceso al correo que usaste al comprar. Entra con ese mismo correo, descarga los PDF y elige la primera hoja.",
    cta: "Entrar a Hotmart y ver mis archivos",
    note: "Usa el mismo correo de la compra. Si no ves el mensaje, revisa Spam y Promociones.",
    facts: ["9 PDF", "414 páginas", "Acceso por Hotmart", "Soporte por correo"],
  },
  access: {
    kicker: "Acceso en tres pasos",
    title: "Encuentra tu kit.",
    steps: [
      {
        icon: "mail",
        title: "Revisa tu correo",
        text: "Hotmart envía un mensaje con el acceso cuando aprueba el pago. Si pagaste con un método no inmediato, puede tardar.",
      },
      {
        icon: "login",
        title: "Entra a consumer.hotmart.com",
        text: "Inicia sesión con el mismo correo de la compra y abre “Mis compras”.",
      },
      {
        icon: "download",
        title: "Descarga los PDF",
        text: "Guarda los nueve archivos en tu computadora o teléfono. Puedes volver a descargarlos cuando quieras.",
      },
    ],
    cta: "Ir a mis compras",
  },
  firstPractice: {
    kicker: "Tu primera práctica",
    title: "Una página reconocible es suficiente para comenzar.",
    steps: [
      "Abre “10 Minutos de Grafismo Fonético” y lee las dos páginas de inicio.",
      "Elige una hoja del PDF principal con una palabra que el niño reconozca (por ejemplo, MAPA o SOPA).",
      "Imprime solo esa hoja. Practica los cuatro gestos: mira, di, traza, une.",
      "Guarda la hoja en una carpeta. Mañana, otra página. Sin prisa.",
    ],
    printNote:
      "Tú eliges cuánto imprimir: una hoja, una semana o una carpeta completa. Los archivos no caducan.",
  },
  resources: {
    kicker: "Ya es tuyo",
    title: "Los nueve recursos, en orden sugerido.",
  },
  help: {
    kicker: "Ayuda",
    title: "Si algo no aparece.",
    items: [
      {
        title: "No llegó el correo",
        text: "Revisa Spam y Promociones. Luego entra directamente a consumer.hotmart.com con el correo de la compra.",
      },
      {
        title: "Pagué con boleto, transferencia o efectivo",
        text: "El acceso se libera cuando Hotmart confirma el pago; puede demorar hasta que el método lo procese.",
      },
      {
        title: "Compré con otro correo",
        text: "Hotmart puede ayudarte a cambiar el correo de acceso desde su centro de ayuda.",
      },
      {
        title: "Quiero un reembolso",
        text: "Tienes 7 días para pedirlo en refund.hotmart.com con tu número de transacción (empieza con HP).",
      },
    ],
    contact:
      "Para cualquier otra duda, escríbenos. Respondemos con calma, normalmente en menos de 48 horas hábiles.",
  },
  noPurchase: {
    title: "¿Llegaste aquí sin comprar?",
    text: "Esta página explica cómo acceder después de la compra. Si todavía no tienes el kit, puedes verlo aquí:",
    cta: "Ver Grafismo Fonético",
  },
  packNote: {
    title: "Si también agregaste el Pack Imprime y Juega",
    text: "Lo encontrarás en la misma cuenta de Hotmart, como una compra separada, con sus seis PDF.",
  },
} as const;
