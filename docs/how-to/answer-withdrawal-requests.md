# Answer withdrawal requests (support inbox)

Process behind PV-D2 / OD-50. Hotmart allows one global guarantee, so the site promises two things:

- **Guarantee, automatic:** `guaranteeDays` (7) days from purchase, refunded in Hotmart
  (`refund.hotmart.com`). Nothing to do here.
- **Longer legal windows, by email:** the windows in `withdrawalWindows` (`config/commerce.ts`:
  Argentina, Brazil, Chile, Colombia, Spain, the rest of the EU, Uruguay). The buyer writes to the
  support mailbox (`supportEmail`) and the owner refunds manually.

All numbers come from `config/commerce.ts`; never retype them in replies you save as macros without
checking that file. Public copy lives in `content/es/legal/withdrawal.ts`.

## Steps

1. Identify the buyer: purchase email and the Hotmart transaction code (`HP...`) or order number. If
   missing, ask once in the same reply.
2. Find the purchase date and the buyer's country, then compare against the table below.
3. Inside `guaranteeDays`: point the buyer to Hotmart, or file the refund yourself in Hotmart.
4. Outside `guaranteeDays` but inside the buyer's legal window: refund manually (Hotmart sales
   panel, or the payment method agreed with the buyer) and confirm by email. This is a commitment
   (DR-06): answer within the legal window of the country, normally within `supportResponseTime`.
5. Outside every window: reply kindly, offer help with the material, and say the refund is at the
   owner's discretion. Never invent a period.
6. Argentina: send the request code within `withdrawalRequestCodeHours` (24 h) by the same channel
   (Disposicion SSDCyLC 954/2025 art. 5), even when the request is later declined. The code's
   numbering scheme is an owner input: until it is defined, use a unique reference of your own and
   keep it in the reply thread.
7. Save the thread as the record of the request. Do not copy payment data or seller personal data
   into replies.

## Reply template (es-419, tú)

Replace the placeholders in `{braces}`; delete the paragraph that does not apply.

```text
Asunto: Tu solicitud de arrepentimiento {codigo_ar_si_aplica}

Hola, {nombre}:

Recibimos tu solicitud de arrepentimiento de la compra hecha con el correo {correo_compra}
(transacción {codigo_hp}).

[Argentina] Tu código de identificación es {codigo}. Guárdalo: sirve para seguir el trámite y para
cualquier reclamo posterior.

[Dentro del plazo] Tu solicitud está dentro del plazo de {plazo_pais} que corresponde a {pais}. Ya
gestionamos el reembolso: te llegará por el mismo medio de pago que usaste y, según tu banco o
plataforma de pago, puede tardar unos días en verse. Después, Hotmart retira el acceso a los
archivos.

[Fuera del plazo] Revisamos tu compra y el plazo de {plazo_pais} ya venció. Si tuviste algún
problema con el material, cuéntanos y vemos cómo ayudarte.

[Faltan datos] Para continuar necesitamos el código de transacción de Hotmart (empieza con HP; está
en el correo de confirmación) o la fecha de la compra.

Cualquier duda, responde a este correo.

Equipo de Pequeverso
```

`{plazo_pais}` is the period of that country in `withdrawalWindows`, written as the site does, for
example "10 días corridos". Do not paraphrase the unit: calendar, business and "natural" days
differ by statute.

## Owner inputs still open

- Numbering scheme of the Argentine request code.
- Whether the manual refund is issued through Hotmart's sales panel or through another method.
- Counsel review of the withdrawal wording before M7 (PV-D8, DR-07).
