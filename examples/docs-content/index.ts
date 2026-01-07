import type { DocSection } from "./types.js";
import { architectureSection } from "./architecture.js";
import { backendSection } from "./backend.js";
import { cliReferenceSection } from "./cli-reference.js";
import { contributingSection } from "./contributing.js";
import { dslReferenceSection } from "./dsl-reference.js";
import { electronSection } from "./electron.js";
import { extensionsSection } from "./extensions.js";
import { frontendSection } from "./frontend.js";
import { installCliSection } from "./install-cli.js";
import { outputStructureSection } from "./output-structure.js";
import { policyReferenceSection } from "./policy-reference.js";
import { policiesSection } from "./policies.js";
import { quickStartSection } from "./quick-start.js";
import { reactSsgSection } from "./react-ssg.js";
import { releaseNotesSection } from "./release-notes.js";
import { staticSiteSection } from "./static-site.js";
import { troubleshootingSection } from "./troubleshooting.js";

export const DOCS_SECTIONS: DocSection[] = [
  quickStartSection,
  installCliSection,
  cliReferenceSection,
  dslReferenceSection,
  architectureSection,
  policiesSection,
  policyReferenceSection,
  backendSection,
  frontendSection,
  staticSiteSection,
  reactSsgSection,
  electronSection,
  extensionsSection,
  outputStructureSection,
  troubleshootingSection,
  releaseNotesSection,
  contributingSection,
];
