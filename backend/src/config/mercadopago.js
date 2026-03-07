const { MercadoPagoConfig } = require("mercadopago");

function getMpClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  const isProd = process.env.NODE_ENV === "production";

  if (!token) {
    console.error("[MP CONFIG] MP_ACCESS_TOKEN no definido.");
    throw new Error("MP_ACCESS_TOKEN no configurado en variables de entorno.");
  }

  const maskedToken =
    token.length > 14
      ? `${token.slice(0, 8)}...${token.slice(-6)}`
      : "TOKEN_PRESENTE";

  console.log("[MP CONFIG] NODE_ENV:", process.env.NODE_ENV || "undefined");
  console.log("[MP CONFIG] FRONT_URL:", process.env.FRONT_URL || "undefined");
  console.log("[MP CONFIG] BACK_URL:", process.env.BACK_URL || "undefined");
  console.log("[MP CONFIG] ACCESS_TOKEN:", maskedToken);

  if (!isProd) {
    console.log("[MP CONFIG] Mercado Pago inicializado en modo LOCAL/DEV");
  } else {
    console.log("[MP CONFIG] Mercado Pago inicializado en PRODUCCIÓN");
  }

  return new MercadoPagoConfig({
    accessToken: token,
    options: {
      timeout: 5000,
    },
  });
}

module.exports = { getMpClient };