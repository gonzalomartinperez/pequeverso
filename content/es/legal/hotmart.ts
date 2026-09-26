/**
 * Hotmart facts quoted on the legal pages, from Hotmart's own terms and help center (read
 * 2026-09-24; URLs in docs/legal-checklist.md). Hotmart can change them: re-read the sources
 * before editing and keep the pages reading from here.
 */
export const hotmartFacts = {
  /** Contracting entity for buyers outside Brazil and the US (Términos Generales de Compra §1.2). */
  entity: "Hotmart B.V. (Frederiksplein 1, 1017 XK Ámsterdam, Países Bajos)",
  /** Days the producer has to answer a refund request (Política General de Pago §3.6). */
  producerResponseDays: 5,
  /** "Tu solicitud puede tardar hasta 7 días en ser aprobada y liberada al banco" (help center). */
  approvalDays: 7,
  /** Refund timing (Términos Generales de Compra §3.4), always by the original payment method. */
  refundTiming:
    "hasta 30 días en transferencias bancarias y hasta 90 días en tarjetas de crédito; en tarjetas, PayPal, Google Pay y Apple Pay suele verse en el resumen actual o el siguiente",
  /** Where the transaction code (HP…) is shown in the buyer area. */
  transactionCodePath:
    "consumer.hotmart.com → Mis compras → el producto → Mostrar detalles → Historial de transacciones",
  urls: {
    refundForm: "https://refund.hotmart.com/refund?lang=es",
    refundTracking: "https://refund.hotmart.com/tracking",
    buyerHelp:
      "https://help.hotmart.com/es/categories/25851725931533/compre-o-quiero-comprar-y-necesito-ayuda?profile=BUYER",
    invoice: "https://purchase.hotmart.com/invoice",
    purchaseTerms: "https://hotmart.com/es/legal/plazo-de-compra",
  },
} as const;
