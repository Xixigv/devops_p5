import { describe, it, expect, vi } from "vitest";
import worker from "../src/index";

const ctx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as unknown as ExecutionContext;

function createMockDb(results: unknown[]) {
  const all = vi.fn().mockResolvedValue({ results });
  const prepare = vi.fn().mockReturnValue({ all });
  return { db: { prepare } as unknown as D1Database, prepare, all };
}

describe("Worker fetch handler", () => {
  it("responde con status 200 y JSON", async () => {
    const { db } = createMockDb([]);
    const request = new Request("http://example.com/");

    const response = await worker.fetch!(request as any, { p6: db }, ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("incluye el mensaje esperado", async () => {
    const { db } = createMockDb([]);
    const request = new Request("http://example.com/");

    const response = await worker.fetch!(request as any, { p6: db }, ctx);
    const body = (await response.json()) as { message: string };

    expect(body.message).toBe("Hello, World! 3");
  });

  it("devuelve los usuarios que regresa la base de datos", async () => {
    const users = [
      { id: 1, name: "Ana" },
      { id: 2, name: "Luis" },
    ];
    const { db } = createMockDb(users);
    const request = new Request("http://example.com/");

    const response = await worker.fetch!(request as any, { p6: db }, ctx);
    const body = (await response.json()) as { dbData: unknown[] };

    expect(body.dbData).toEqual(users);
  });

  it("consulta la tabla users", async () => {
    const { db, prepare, all } = createMockDb([]);
    const request = new Request("http://example.com/");

    await worker.fetch!(request as any, { p6: db }, ctx);

    expect(prepare).toHaveBeenCalledWith("SELECT * FROM users");
    expect(all).toHaveBeenCalledTimes(1);
  });

  it("devuelve una lista vacía si no hay usuarios", async () => {
    const { db } = createMockDb([]);
    const request = new Request("http://example.com/");

    const response = await worker.fetch!(request as any, { p6: db }, ctx);
    const body = (await response.json()) as { dbData: unknown[] };

    expect(body.dbData).toEqual([]);
  });

  it("falla si la base de datos lanza un error", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    } as unknown as D1Database;
    const request = new Request("http://example.com/");

    await expect(
      worker.fetch!(request as any, { p6: db }, ctx),
    ).rejects.toThrow("DB error");
  });
});