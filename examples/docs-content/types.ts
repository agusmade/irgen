export type DocCodeBlock = {
  language: string;
  snippet: string;
};

export type DocSubsection = {
  title: string;
  content?: string;
  code?: DocCodeBlock;
};

export type DocSection = {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  hideHeader?: boolean;
  content?: string;
  hero?: {
    badge?: string;
    title: string;
    subtitle?: string;
  };
  features?: Array<{ title: string; description: string; icon?: string }>;
  code?: DocCodeBlock;
  subsections?: DocSubsection[];
};
