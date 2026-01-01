// FrontendIR (domain-level, post-mapping)
export interface FrontendField {
  name: string;
  type: string;
  label?: string;
  validators?: Record<string, any>;
  multiple?: boolean;
  // Expanded properties
  placeholder?: string;
  description?: string;
  icon?: string;
  options?: { label: string; value: string }[];
  dataSource?: {
    url: string;
    labelKey: string;
    valueKey: string;
    searchParam?: string;
    pageParam?: string;
    pageSizeParam?: string;
    pageSize?: number;
    debounceMs?: number;
  };
  visibleIf?: string;
  disabledIf?: string;
  defaultValue?: string;
  computeValue?: string;
  className?: string;
  tooltip?: string;
  prefix?: string;
  suffix?: string;
  searchPlaceholder?: string;
  ariaLabel?: string;
  clearable?: boolean;
  accept?: string;
  step?: number;
  defaultCurrency?: string;
  helpHtml?: string;
}

export interface FrontendForm {
  fields: FrontendField[];
  submit?: {
    url?: string;
    method?: "POST" | "PUT" | "PATCH";
    successMessage?: string;
    errorMessage?: string;
    draftKey?: string;
    confirmMessage?: string;
    beforeSubmit?: string;
    onSuccess?: string;
    redirect?: string;
    onError?: string;
    afterSubmit?: string;
  };
}

export interface FrontendComponent {
  name: string;
  props?: Record<string, string>;
  form?: FrontendForm;
  entityRef?: string;
  layout?: {
    kind: "row" | "column" | "panel" | "tabs";
    title?: string;
    columns?: number;
    items?: string[];
    tabs?: { label: string; content?: string; items?: string[] }[];
  };
  content?: string;
  html?: string;
  button?: { label: string; variant?: "primary" | "secondary" | "ghost"; icon?: string };
}

export interface FrontendPage {
  name: string;
  path: string;
  components: FrontendComponent[];
}

export interface FrontendPwaIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface FrontendPwaConfig {
  enabled: boolean;
  name: string;
  shortName: string;
  description?: string;
  startUrl: string;
  scope: string;
  display: string;
  backgroundColor: string;
  themeColor: string;
  orientation?: string;
  icons?: FrontendPwaIcon[];
}

export interface FrontendIR {
  domain: "frontend";
  appName: string;
  pages: FrontendPage[];
  components: FrontendComponent[];
  pwa?: FrontendPwaConfig;
}
