const MODEL = "gemini-3.1-flash-image";

function json(res, body, status = 200) {
  res.status(status).setHeader("cache-control", "no-store");
  res.json(body);
}

function parseImage(response) {
  const parts = response?.candidates?.flatMap((candidate) => candidate?.content?.parts || []) || [];
  const imagePart = parts.find((part) => part?.inlineData?.data || part?.inline_data?.data);
  const data = imagePart?.inlineData || imagePart?.inline_data;
  return data?.data && data?.mimeType
    ? `data:${data.mimeType};base64,${data.data}`
    : data?.data
      ? `data:image/png;base64,${data.data}`
      : null;
}

export default async function handler(request, response) {
  if (request.method !== "POST") return json(response, { error: "Method not allowed" }, 405);
  if (!process.env.GEMINI_API_KEY) {
    return json(response, { error: "Gemini is not configured. Add GEMINI_API_KEY in Vercel." }, 503);
  }

  let payload;
  try {
    payload = typeof request.body === "string" ? JSON.parse(request.body) : (request.body || {});
  } catch { return json(response, { error: "Invalid JSON body" }, 400); }
  const image = typeof payload?.image === "string" ? payload.image : "";
  const prompt = typeof payload?.prompt === "string" ? payload.prompt.trim() : "";
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match || !prompt) return json(response, { error: "An image and prompt are required" }, 400);
  if (match[2].length > 8_000_000) return json(response, { error: "Image is too large" }, 413);

  const upstream = await fetch(`https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [
        { text: prompt },
        { inline_data: { mime_type: match[1], data: match[2] } },
      ] }],
      generationConfig: {
        responseModalities: ["Image"],
        responseFormat: { image: { aspectRatio: "16:9", imageSize: "1K" } },
      },
    }),
  });
  const result = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return json(response, { error: result?.error?.message || "Gemini request failed" }, upstream.status >= 500 ? 502 : upstream.status);
  }
  const imageDataUrl = parseImage(result);
  if (!imageDataUrl) return json(response, { error: "Gemini returned no image" }, 502);
  return json(response, { image: imageDataUrl, model: MODEL });
}
