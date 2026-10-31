<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';

  // The reports the desk read as a one-day move, with what the reporter wrote.
  const rows = $derived(uniqueById(reports as Report[]).filter((r) => notes.oneDayMove.includes(r.id)));
</script>

<table>
  <thead><tr><th>id</th><th>tenant</th><th>channel</th><th>received</th><th>what the reporter wrote</th></tr></thead>
  <tbody>
    {#each rows as r (r.id)}
      <tr><td><code>{r.id}</code></td><td>{r.tenant}</td><td>{r.channel}</td><td>{r.receivedAt.slice(0, 10)}</td><td>{r.body}</td></tr>
    {/each}
  </tbody>
</table>
