// How #4471 splits into the problems it really holds. The page says it in words; this is what runs.
//
// causes.ts tells `parser` from `hint` by tenant and channel. desk-notes.json holds the reports the
// desk read as a one-day move: no month flip, a date shifted across a day boundary. Those are a third
// problem, and they are taken out of their cause group so every report is counted once.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type ProblemKey = 'parser' | 'hint' | 'one-day-move' | 'unplaced';

export type Problem = {
  key: ProblemKey;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export type Split = {
  rows: number; // rows in the export
  unique: number; // reports after uniqueById
  merged: number; // of those, merged into the ticket
  problems: Problem[];
};

const count = <K extends string>(xs: K[]): Record<string, number> =>
  xs.reduce<Record<string, number>>((n, k) => ({ ...n, [k]: (n[k] ?? 0) + 1 }), {});

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): ProblemKey {
  if (oneDayMove.includes(r.id)) return 'one-day-move';
  return causeOf(r, t) ?? 'unplaced';
}

export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const unique = uniqueById(reports);
  const merged = unique.filter((r) => r.mergedInto === ticket);
  const by = new Map<ProblemKey, Report[]>();
  for (const r of merged) {
    const k = problemOf(r, tenantOf(r), oneDayMove);
    by.set(k, [...(by.get(k) ?? []), r]);
  }
  const problems = [...by.entries()]
    .map(([key, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        key,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: count(rs.map((r) => r.channel)),
        taggedAs: count(rs.map((r) => r.meta.intakeTag)),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: reports.length, unique: unique.length, merged: merged.length, problems };
}
