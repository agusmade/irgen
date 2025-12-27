// Generated: http client adapter (fetch)
export async function httpGet(url: string) {
  const res = await fetch(url);
  return await res.json();
}

export async function httpPost(url: string, body: any) {
  const res = await fetch(url, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return await res.json();
}


