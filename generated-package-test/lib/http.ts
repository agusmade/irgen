// Generated: http client adapter (axios)
// axios adapter: install axios in the generated project to use a real HTTP client
import axios from "axios";
export async function httpGet(url: string) {
  const res = await axios.get(url);
  return res.data;
}

export async function httpPost(url: string, body: any) {
  const res = await axios.post(url, body);
  return res.data;
}


