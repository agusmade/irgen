export type DocCodeBlock = {
  language: string;
  snippet: string;
};

export type DocContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "code"; language: string; snippet: string }
  | { type: "features"; items: Array<{ title: string; description: string; icon?: string }> }
  | { type: "hero"; badge?: string; title: string; subtitle?: string }
  | { type: "section"; title: string; blocks: DocContentBlock[] }
  | { type: "calloutLinks"; links: Array<{ label: string; href: string }> };

export type DocSection = {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  hideHeader?: boolean;
  content: DocContentBlock[];
};
