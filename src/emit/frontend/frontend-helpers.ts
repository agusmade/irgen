import fs from "node:fs";
import type { FrontendComponent } from "../../ir/domain/frontend.js";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";

export function hasMarkdownCodeBlocks(ir: FrontendTargetIR): boolean {
  const hasFence = (text?: string) => typeof text === "string" && /```/.test(text);
  const checkComponent = (component: FrontendComponent | undefined) => {
    if (!component) return false;
    if (hasFence(component.content)) return true;
    if (component.layout?.tabs?.some((tab) => hasFence(tab.content))) return true;
    return false;
  };

  for (const page of ir.pages ?? []) {
    for (const comp of page.components ?? []) {
      if (checkComponent(comp as any)) return true;
    }
  }

  for (const comp of ir.components ?? []) {
    if (checkComponent(comp as any)) return true;
  }

  return false;
}

export function hasMarkdownMermaid(ir: FrontendTargetIR): boolean {
  const hasMermaidFence = (text?: string) => typeof text === "string" && /```mermaid/.test(text);
  const checkComponent = (component: FrontendComponent | undefined) => {
    if (!component) return false;
    if (hasMermaidFence(component.content)) return true;
    if (component.layout?.tabs?.some((tab) => hasMermaidFence(tab.content))) return true;
    return false;
  };

  for (const page of ir.pages ?? []) {
    for (const comp of page.components ?? []) {
      if (checkComponent(comp as any)) return true;
    }
  }

  for (const comp of ir.components ?? []) {
    if (checkComponent(comp as any)) return true;
  }

  return false;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInlineMarkdown(input: string): string {
  let out = escapeHtml(input);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, href) => {
    return `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

export function slugifyHeading(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function renderMarkdownToHtml(input: string): string {
  const lines = input.split(/\r?\n/);
  const parts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^#{1,6}\s+/.test(line)) {
      const match = line.match(/^(#+)\s+(.*)$/);
      if (!match) { i += 1; continue; }
      const level = match[1].length;
      const text = match[2].trim();
      const baseId = slugifyHeading(text);
      let next = 0;
      while (parts.some((p) => p.includes(`id="${baseId}${next > 1 ? `-${next}` : ""}"`))) {
        next += 1;
      }
      const id = next > 1 ? `${baseId}-${next}` : baseId;
      parts.push(`<h${level} id="${escapeHtml(id)}">${renderInlineMarkdown(text)}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^```/.test(line.trim())) {
      const codeLines: string[] = [];
      let language = line.trim().slice(3).trim();
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      if (!language) language = "text";
      parts.push(`<pre><code class="language-${escapeHtml(language)}">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^(\*|-)\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const isOrdered = /^\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && (/^(\*|-)\s+/.test(lines[i]) || /^\d+\.\s+/.test(lines[i]))) {
        const raw = lines[i].replace(/^(\*|-)\s+/, "").replace(/^\d+\.\s+/, "");
        items.push(`<li>${renderInlineMarkdown(raw)}</li>`);
        i += 1;
      }
      parts.push(isOrdered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      continue;
    }

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length
      && lines[i].trim() !== ""
      && !/^#{1,6}\s+/.test(lines[i])
      && !/^```/.test(lines[i].trim())
      && !/^(\*|-)\s+/.test(lines[i])
      && !/^\d+\.\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }
    const paragraph = paragraphLines.join(" ").trim();
    if (paragraph) {
      if (paragraph.startsWith("<")) {
        parts.push(paragraph);
      } else {
        parts.push(`<p>${renderInlineMarkdown(paragraph)}</p>`);
      }
    }
  }

  return parts.join("\n");
}

export function ensureDir(p: string) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch (_) {}
}

export function collectComponentText(component: FrontendComponent): string {
  const parts: string[] = [];
  if (component.name) parts.push(String(component.name));
  if (component.content) parts.push(String(component.content));
  if (component.codeBlock?.snippet) parts.push(String(component.codeBlock.snippet));
  if (component.button?.label) parts.push(String(component.button.label));
  if (component.layout?.title) parts.push(String(component.layout.title));
  if (component.agentChat?.title) parts.push(String(component.agentChat.title));
  if (Array.isArray(component.agentChat?.messages)) {
    for (const msg of component.agentChat.messages) {
      if (msg?.content) parts.push(String(msg.content));
    }
  }
  if (component.cliUsage?.title) parts.push(String(component.cliUsage.title));
  if (component.cliUsage?.command) parts.push(String(component.cliUsage.command));
  if (Array.isArray(component.cliUsage?.options)) {
    for (const opt of component.cliUsage.options) {
      if (opt?.flag) parts.push(String(opt.flag));
      if (opt?.description) parts.push(String(opt.description));
    }
  }
  if (component.marketing?.title) parts.push(String(component.marketing.title));
  if (component.marketing?.subtitle) parts.push(String(component.marketing.subtitle));
  if (Array.isArray(component.marketing?.items)) {
    for (const item of component.marketing.items) {
      if (item?.title) parts.push(String(item.title));
      if (item?.description) parts.push(String(item.description));
      if (item?.value) parts.push(String(item.value));
      if (item?.label) parts.push(String(item.label));
    }
  }
  if (Array.isArray(component.marketing?.actions)) {
    for (const action of component.marketing.actions) {
      if (action?.label) parts.push(String(action.label));
    }
  }
  return parts.join(" ");
}

export function buildSearchIndex(ir: FrontendTargetIR) {
  const pages = ir.pages ?? [];
  return pages
    .map((page) => {
      const chunks = (page.components ?? []).map((component) => collectComponentText(component as any)).filter(Boolean);
      const text = chunks.join(" ").trim();
      return text ? { name: page.name, path: page.path, text } : null;
    })
    .filter(Boolean);
}
