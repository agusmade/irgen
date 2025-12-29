export interface CliCommand {
  name: string;
  description?: string;
  options?: Array<{ name: string; flag?: string; description?: string; type?: "string" | "number" | "boolean"; required?: boolean }>;
  action?: string;
}

export interface CliIR {
  domain: "cli";
  name: string;
  commands: CliCommand[];
}
