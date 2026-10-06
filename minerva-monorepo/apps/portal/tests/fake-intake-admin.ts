/**
 * In-memory fake for the IntakeAdmin surface (mirrors _lib.ts exactly).
 * Supports only the chains the intake module uses: select/insert/update +
 * eq/gte/order/limit + single/maybeSingle/await. Anything else throws, so a
 * widening query surface fails loudly here instead of silently untested.
 */
import { randomUUID } from "node:crypto";

import type { IntakeAdmin, IntakeQuery } from "../app/api/v1/intake/_lib";

type Row = Record<string, unknown>;

class FakeQuery implements IntakeQuery {
  private filters: Array<(row: Row) => boolean> = [];
  private ordering: { column: string; ascending: boolean } | null = null;
  private limitN: number | null = null;
  private countHead = false;
  private insertRow: Row | null = null;
  private updateRow: Row | null = null;

  constructor(private rows: Row[]) {}

  select(_columns?: string, options?: { count?: "exact"; head?: boolean }): IntakeQuery {
    if (options?.count === "exact" && options?.head) this.countHead = true;
    return this;
  }
  insert(row: Record<string, unknown>): IntakeQuery {
    this.insertRow = { ...row };
    return this;
  }
  update(row: Record<string, unknown>): IntakeQuery {
    this.updateRow = { ...row };
    return this;
  }
  eq(column: string, value: unknown): IntakeQuery {
    this.filters.push((row) => row[column] === value);
    return this;
  }
  gte(column: string, value: unknown): IntakeQuery {
    this.filters.push((row) => String(row[column] ?? "") >= String(value));
    return this;
  }
  order(column: string, options?: { ascending?: boolean }): IntakeQuery {
    this.ordering = { column, ascending: options?.ascending !== false };
    return this;
  }
  limit(n: number): IntakeQuery {
    this.limitN = n;
    return this;
  }

  private matched(): Row[] {
    let out = this.rows.filter((row) => this.filters.every((f) => f(row)));
    if (this.ordering) {
      const { column, ascending } = this.ordering;
      out = [...out].sort((a, b) => {
        const cmp = String(a[column] ?? "").localeCompare(String(b[column] ?? ""));
        return ascending ? cmp : -cmp;
      });
    }
    if (this.limitN !== null) out = out.slice(0, this.limitN);
    return out;
  }

  private run(): { data: unknown[] | Row | null; count?: number | null; error: { message: string } | null } {
    if (this.insertRow) {
      const row: Row = { ...this.insertRow };
      if (row["id"] === undefined) row["id"] = randomUUID();
      if (row["created_at"] === undefined) row["created_at"] = new Date().toISOString();
      this.rows.push(row);
      return { data: row, error: null };
    }
    if (this.updateRow) {
      const hit = this.matched();
      for (const row of hit) Object.assign(row, this.updateRow);
      return { data: hit, error: null };
    }
    const hit = this.matched();
    if (this.countHead) return { data: [], count: hit.length, error: null };
    return { data: hit, error: null };
  }

  async single(): Promise<{ data: Row | null; error: { message: string } | null }> {
    const result = this.run();
    const row = Array.isArray(result.data) ? (result.data[0] as Row | undefined) : (result.data as Row | null);
    if (!row) return { data: null, error: { message: "no rows" } };
    return { data: row, error: null };
  }

  async maybeSingle(): Promise<{ data: Row | null; error: { message: string } | null }> {
    const result = this.run();
    const row = Array.isArray(result.data) ? (result.data[0] as Row | undefined) : (result.data as Row | null);
    return { data: row ?? null, error: null };
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown[] | null; count?: number | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    try {
      const result = this.run();
      const value = {
        data: (Array.isArray(result.data) ? result.data : [result.data]) as unknown[],
        count: result.count ?? null,
        error: result.error,
      };
      return Promise.resolve(onfulfilled ? onfulfilled(value) : (undefined as unknown as TResult1));
    } catch (err) {
      if (onrejected) return Promise.resolve(onrejected(err));
      throw err;
    }
  }
}

export class FakeIntakeAdmin implements IntakeAdmin {
  readonly tables = new Map<string, Row[]>([
    ["agency_api_keys", []],
    ["portal_intake_submissions", []],
  ]);

  from(table: string): IntakeQuery {
    let rows = this.tables.get(table);
    if (!rows) {
      rows = [];
      this.tables.set(table, rows);
    }
    return new FakeQuery(rows);
  }

  seedKey(row: Row): void {
    this.tables.get("agency_api_keys")!.push({
      status: "active",
      purpose: "server",
      expires_at: null,
      ...row,
    });
  }

  seedSubmission(row: Row): void {
    this.tables.get("portal_intake_submissions")!.push({
      id: randomUUID(),
      status: "queued",
      created_at: new Date().toISOString(),
      ...row,
    });
  }

  submissions(): Row[] {
    return this.tables.get("portal_intake_submissions")!;
  }
}
