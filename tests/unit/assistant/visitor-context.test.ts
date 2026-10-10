import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicPath, visitorContext } from "../../../src/features/assistant/domain/visitor-context.ts";

describe("untrusted assistant visitor context", () => {
  it("canonicalizes only reviewed public paths", () => {
    for (const path of [
      "/",
      "/grafismo-fonetico/",
      "/soporte/",
      "/arrepentimiento/",
      "/aviso-legal/",
      "/compras-y-reembolsos/",
      "/cookies/",
      "/privacidad/",
      "/terminos/",
    ]) {
      assert.equal(publicPath(path), path);
      if (path !== "/") assert.equal(publicPath(path.slice(0, -1)), path);
    }
  });

  it("never forwards query, fragment, encoding, identifiers, origin or post-purchase routes", () => {
    for (const path of [
      null,
      "",
      "https://pequeverso.com/",
      "//evil.invalid/",
      "/soporte/?email=child@example.invalid",
      "/soporte/#private",
      "/soporte/%2e",
      "/%2573oporte/",
      "/soporte//",
      "/imprime-y-juega/",
      "/grafismo-fonetico/gracias/",
      "/unknown/",
      "/soporte/\n",
    ]) {
      assert.equal(publicPath(path), null, String(path));
    }
  });

  it("copies only allowed hints and drops unknown presentation modes", () => {
    const input = {
      opened_path: "/soporte/" as const,
      current_path: "/" as const,
      presentation: "compact" as const,
      theme: "private",
    };
    assert.deepEqual(visitorContext(input), {
      opened_path: "/soporte/",
      current_path: "/",
      presentation: "compact",
    });
    assert.equal(visitorContext(null), null);
    assert.equal(visitorContext({ opened_path: null, current_path: null, presentation: null }), null);
  });
});
