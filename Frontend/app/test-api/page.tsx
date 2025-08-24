async function getJSON(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  let data: any = null;
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

export default async function TestAPI() {
  const base = process.env.NEXT_PUBLIC_API_BASE || "/api";

  const health = await getJSON(`${base}/health`);
  const indexResp = await getJSON(`${base}/index`);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">API Test</h1>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">/api/health</h2>
        <pre className="mt-2 bg-black/5 p-3 rounded">{JSON.stringify(health, null, 2)}</pre>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">/api/index</h2>
        <p className="text-sm opacity-75">Visar antal domare, lag och säsonger om allt funkar.</p>
        <pre className="mt-2 bg-black/5 p-3 rounded">{JSON.stringify(indexResp, null, 2)}</pre>
      </section>
    </main>
  );
}
