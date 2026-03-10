const PAYMENT_LABELS = { alias: "Alias", efectivo: "Efectivo", mercadopago: "Mercado Pago", whatsapp: "WhatsApp" };

export function buildWhatsAppMessage({ items, totalPrice, customer, orderId, paymentMethod }) {
  const lines = [];

  lines.push("🍔 NUEVO PEDIDO AMA COCINA");
  lines.push("");

  if (orderId) {
    lines.push(`Pedido: #${orderId}`);
  }
  lines.push(`Cliente: ${(customer?.name || "").trim() || "—"}`);
  lines.push("");

  lines.push("Detalle:");
  for (const i of items || []) {
    const qty = Number(i.qty) || 0;
    const price = Number(i.price) || 0;
    const lineTotal = qty * price;
    lines.push(`• ${qty}x ${i.name || "—"} — $${lineTotal}`);
  }
  lines.push("");

  lines.push(`Total: $${Number(totalPrice) || 0}`);
  const pago = paymentMethod ? (PAYMENT_LABELS[paymentMethod] || paymentMethod) : "—";
  lines.push(`Pago: ${pago}`);
  lines.push("");

  if (customer?.notes?.trim()) {
    lines.push("Notas:");
    lines.push(customer.notes.trim());
    lines.push("");
  }

  const now = new Date();
  const hora = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  lines.push(`Hora: ${hora}`);

  return lines.join("\n");
}

export function openWhatsApp({ phoneE164, message }) {
  const url = `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
