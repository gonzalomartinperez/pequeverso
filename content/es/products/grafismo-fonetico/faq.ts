/**
 * The FAQ of the Grafismo Fonético landing: the ten reviewed answers of the published landing
 * plus the currency question. The guarantee answer sits third so the refund terms are read early.
 */
import { guaranteeDays } from "../../../../config/commerce.ts";
import type { FaqItem } from "../index.ts";

export const grafismoFaq: readonly FaqItem[] = [
  {
    q: "¿Mi hijo ya tiene que saber leer?",
    a: "No. Está pensado para acompañar una etapa inicial: reconocer letras y sonidos, combinar sílabas y practicar primeros trazos. Puedes elegir las páginas que mejor se adapten a su momento.",
  },
  {
    q: "¿Para qué edades se recomienda?",
    a: "La recomendación orientativa es de 3 a 7 años. La edad no reemplaza observar el ritmo, el interés y las habilidades actuales de cada niño.",
  },
  {
    q: `¿Cómo funciona la garantía de ${guaranteeDays} días?`,
    a: `Tienes ${guaranteeDays} días desde la compra para solicitar un reembolso a través de Hotmart, de acuerdo con las condiciones informadas en la página de pago.`,
  },
  {
    q: "¿Cuánto tiempo conviene practicar?",
    a: "Puedes comenzar con aproximadamente 10 minutos y una sola hoja. No es una regla: acorta, repite o pausa la actividad según la respuesta del niño.",
  },
  {
    q: "¿Qué incluye exactamente la compra?",
    a: "Recibes un PDF principal y ocho PDF complementarios: guía, tarjetas, reto, animales, juegos, sonidos del hogar, pósteres y actividades sobre el nombre y la familia. En total, 9 PDF y 414 páginas.",
  },
  {
    q: "¿Recibo un producto físico?",
    a: "No. Es un producto 100% digital. Recibes el acceso por correo electrónico y puedes imprimir el material en casa, en una papelería o en un centro de impresión.",
  },
  {
    q: "¿Tengo que imprimir todo el material?",
    a: "No. Puedes imprimir una sola página, elegir una actividad para ese día o crear una carpeta con tu selección. Los archivos quedan disponibles para volver a utilizarlos.",
  },
  {
    q: "¿Necesito experiencia docente?",
    a: "No. La guía explica una forma sencilla de comenzar. El material acompaña la práctica familiar y también puede servir como recurso complementario para docentes.",
  },
  {
    q: "¿El kit garantiza que aprenderá a leer?",
    a: "No se prometen resultados específicos ni plazos de aprendizaje. El kit aporta material organizado para practicar; cada niño avanza de manera diferente.",
  },
  {
    q: "¿Cómo accedo después de comprar?",
    a: "Hotmart envía el acceso al correo utilizado en la compra. También puedes ingresar en consumer.hotmart.com con ese mismo correo y revisar “Mis compras”.",
  },
  {
    q: "¿Puedo pagar en mi moneda?",
    a: "Hotmart muestra el total en tu moneda local y los métodos disponibles en tu país antes de confirmar.",
  },
];
