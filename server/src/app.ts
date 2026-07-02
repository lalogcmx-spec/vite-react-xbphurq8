import express, { Request, Response } from "express";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

app.post("/webhook/whatsapp", (req: Request, res: Response) => {
  const body = req.body as Record<string, string>;
  const from = body.From ?? "desconocido";
  const msg = body.Body ?? "";
  console.log(`[webhook] from=${from} msg="${msg}"`);
  res.set("Content-Type", "text/xml");
  res.send(`<Response><Message>FacturaBot recibio: ${msg || "(imagen)"}</Message></Response>`);
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] corriendo en puerto ${PORT}`);
});
