<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { splitTicket, type ProblemKey } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';
  import type { Report } from '#lib/kb/causes';

  // One row per problem. `tickets` maps a problem to its GitHub issue in `repo`.
  let {
    ticket,
    repo,
    tickets = {},
  }: { ticket: number; repo: string; tickets?: Partial<Record<ProblemKey, number>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const fmt = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
  const NAME: Record<ProblemKey, string> = {
    parser: 'parser reads month first',
    hint: 'booking-v3 hint says MM/DD',
    'one-day-move': 'date moves one day',
    unplaced: 'no tenant on file',
  };
</script>

<p class="sum">
  <strong>{split.rows}</strong> rows in the export → <strong>{split.unique}</strong> unique reports
  ({split.rows - split.unique} exact duplicates from overlapping export pages) ·
  <strong>{split.merged}</strong> merged into #{ticket} ·
  <strong>{split.problems.length}</strong> problems
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>intake tagged as</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.problems as p (p.key)}
      <tr>
        <td><code>{p.key}</code><br /><span class="name">{NAME[p.key]}</span></td>
        <td><strong>{p.reports.length}</strong></td>
        <td class="small">{fmt(p.channels)}</td>
        <td class="small">{fmt(p.taggedAs)}</td>
        <td>{p.tenants.length}</td>
        <td class="small">{p.firstSeen} → {p.lastSeen}</td>
        <td>
          {#if tickets[p.key]}
            <a href="https://github.com/{repo}/issues/{tickets[p.key]}">{repo.split('/')[1]}#{tickets[p.key]}</a>
          {:else}
            <span class="warn">no ticket yet</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>all</td><td><strong>{split.problems.reduce((n, p) => n + p.reports.length, 0)}</strong></td><td colspan="5">every report counted once</td></tr>
  </tfoot>
</table>

<style>
  .sum { font-size: 1.05rem; }
  .small, .name { color: var(--muted); font-size: 0.85em; }
  .warn { color: var(--warn); font-weight: 600; }
  tfoot td { border-top: 2px solid var(--line); border-bottom: 0; }
</style>
