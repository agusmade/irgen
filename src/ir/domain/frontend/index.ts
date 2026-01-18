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
  loweredValidators?: LoweredValidationRule[];
  loweredVisibleIf?: LoweredLogicExpression;
  loweredDisabledIf?: LoweredLogicExpression;
  loweredDefaultValue?: LoweredLogicExpression;
  loweredComputeValue?: LoweredLogicExpression;
}

export interface LoweredLogicExpression {
  logic: any;
  dependencies: string[];
}

export interface LoweredValidationRule {
  id: string;
  type: "required" | "min" | "max" | "minLength" | "maxLength" | "pattern" | "format" | "equalsField" | "notEqualsField" | "greaterThanField" | "lessThanField" | "custom" | "uniqueIn" | "requiredIf";
  message: string;
  logic?: any; // for requiredIf or custom logic
  params?: Record<string, any>;
}

export type FrontendActionSpec =
  | { kind: "invoke"; operationId: string; args?: LoweredLogicExpression; confirmMessage?: string }
  | { kind: "navigate"; to: LoweredLogicExpression; confirmMessage?: string };

export interface FrontendForm {
  fields: FrontendField[];
  submit?: {
    operationId?: string;
    url?: string;
    method?: "POST" | "PUT" | "PATCH";
    label?: string;
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
  load?: {
    operationId: string;
    args?: LoweredLogicExpression;
    when?: LoweredLogicExpression;
    mapFields?: Record<string, LoweredLogicExpression>;
    onSuccess?: LoweredLogicExpression;
    onError?: LoweredLogicExpression;
  };
}

export interface FrontendComponent {
  name: string;
  props?: Record<string, string>;
  form?: FrontendForm;
  entityRef?: string;
  agentChat?: {
    title?: string;
    messages: Array<{
      role: "user" | "agent";
      label?: string;
      content: string;
    }>;
  };
  cliUsage?: {
    title?: string;
    command: string;
    options?: Array<{ flag: string; description: string }>;
  };
  layout?: {
    kind: "row" | "column" | "panel" | "tabs";
    title?: string;
    columns?: number;
    items?: string[];
    tabs?: { label: string; content?: string; items?: string[] }[];
  };
  content?: string;
  button?: { label: string; variant?: "primary" | "secondary" | "ghost"; icon?: string; onClick?: FrontendActionSpec };
  table?: {
    resourceId?: string;
    operationId?: string;
    rowNavigateTo?: string;
    rowActions?: Array<{ label: string; onClick?: FrontendActionSpec }>;
    columns?: Array<{ header: string; accessor: string; render?: string }>;
  };
  themeToggle?: boolean;
  codeBlock?: { snippet: string; language: string; showLineNumbers?: boolean };
  marketing?: FrontendMarketing;
}

export interface FrontendMarketing {
  kind: "hero" | "features" | "testimonials" | "faq" | "logos" | "cta" | "stats" | "timeline";
  align?: "left" | "center";
  title?: string;
  subtitle?: string;
  items?: {
    title?: string;
    description?: string;
    icon?: string;
    image?: string;
    author?: string;
    role?: string;
    value?: string;
    label?: string;
  }[];
  actions?: {
    label: string;
    href?: string;
    onClick?: FrontendActionSpec;
    variant?: "primary" | "secondary" | "ghost";
    icon?: string;
  }[];
  badge?: string;
}

export interface FrontendPage {
  name: string;
  path: string;
  hideHeader?: boolean;
  description?: string;
  docsLayout?: boolean;
  docsGroupLabel?: string;
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

import type {
  DataSourceRuntimeConfig,
  OperationSpec,
  ResourceSpec
} from "../../frontend-contract.js";

export interface FrontendIR {
  domain: "frontend";
  appName: string;
  basePath: string;
  pages: FrontendPage[];
  components: FrontendComponent[];
  datasources: DataSourceRuntimeConfig[];
  operations: OperationSpec[];
  resources: ResourceSpec[];
  pwa?: FrontendPwaConfig;
  auth?: {
    enabled?: boolean;
    loginPath?: string;
    meOperationId?: string;
    logoutOperationId?: string;
    hideLoginWhenAuthed?: boolean;
  };
  requiredComponentKeys?: string[];
}
