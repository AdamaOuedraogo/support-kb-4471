// How #4471 splits into the problems it really holds. The page says it in words; this is what runs.
//
// The desk counts the way CauseTable does: causes.ts tells `parser` from `hint` by tenant and channel,
// and the reports the desk read as a one-day move (desk-notes.json) stay counted where they were filed,
// footnoted. The one-day move is a third problem with its own ticket, so it gets a row of its own too;
// its reports are also inside the cause row that holds them.
import { groupByCause, readAs, uniqueById, type CauseGroup, type Report, type Tenant } from '#lib/kb/causes';

export type ProblemKey = CauseGroup['cause'] | 'one-day-move';

export type Problem = {
  key: ProblemKey;
  reports: Report[];
  tenants: number;
  channels: Record<string, number>;
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // For a cause row: how many of its reports the desk read as a one-day move (footnoted).
  readAsMove: number;
  // For the one-day-move row: the cause rows its reports are counted under.
  countedUnder: ProblemKey[];
};

export type Split = {
  rows: number; // rows in the export
  unique: number; // reports after uniqueById
  merged: number; // of those, merged into the ticket
  problems: Problem[];
};

const count = <K extends string>(xs: K[]): Record<string, number> =>
  xs.reduce<Record<string, number>>((n, k) => ({ ...n, [k]: (n[k] ?? 0) + 1 }), {});

const row = (key: ProblemKey, rs: Report[]): Omit<Problem, 'readAsMove' | 'countedUnder'> => {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    key,
    reports: rs,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: count(rs.map((r) => r.channel)),
    taggedAs: count(rs.map((r) => r.meta.intakeTag)),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
};

export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const unique = uniqueById(reports);
  const merged = unique.filter((r) => r.mergedInto === ticket);
  const groups = groupByCause(merged, tenantOf);
  const causes: Problem[] = groups.map((g) => ({ ...row(g.cause, g.reports), readAsMove: readAs(g, oneDayMove), countedUnder: [] }));
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  const move: Problem[] = moved.length
    ? [{ ...row('one-day-move', moved), readAsMove: 0, countedUnder: groups.filter((g) => readAs(g, oneDayMove) > 0).map((g) => g.cause) }]
    : [];
  return { rows: reports.length, unique: unique.length, merged: merged.length, problems: [...causes, ...move] };
}
