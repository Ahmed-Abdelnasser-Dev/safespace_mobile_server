import { randomUUID } from "node:crypto";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function createCentralUnitClient({
  baseUrl,
  timeoutMs = 5000,
  fetchImpl = fetch,
}) {
  if (!baseUrl) {
    throw new Error(
      "CENTRAL_UNIT_BASE_URL is required for outbound Central Unit calls",
    );
  }

  async function requestJson(
    path,
    { method, headers, body, idempotencyKey, retry = 2 },
  ) {
    const url = new URL(path, baseUrl).toString();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetchImpl(url, {
        method,
        headers: {
          "content-type": "application/json",
          ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) {
        const err = new Error(`Central Unit non-2xx: ${res.status}`);
        err.statusCode = 502;
        err.code = "CENTRAL_UNIT_BAD_RESPONSE";
        err.expose = true;
        err.details = { status: res.status, body: json };
        throw err;
      }

      return json;
    } catch (err) {
      // Retry only on network/timeout-like errors
      const canRetry =
        retry > 0 &&
        (err.name === "AbortError" ||
          err.code === "ETIMEDOUT" ||
          err.code === "ECONNRESET" ||
          err.code === "ENOTFOUND");

      if (canRetry) {
        await sleep(200 * (3 - retry));
        return requestJson(path, {
          method,
          headers,
          body,
          idempotencyKey,
          retry: retry - 1,
        });
      }
      throw err;
    } finally {
      clearTimeout(t);
    }
  }

  return {
    async sendAccident(payload, { idempotencyKey } = {}) {
      const key = idempotencyKey || randomUUID();
      // NOTE: Central Unit endpoint path is not specified in docs; keep it configurable.
      return requestJson("/api/central-unit/send-accident-to-central-unit", {
        method: "POST",
        body: payload,
        idempotencyKey: key,
      });
    },
  };
}
