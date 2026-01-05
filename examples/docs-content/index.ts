import type { DocSection } from "./types.js";
import { architectureSection } from "./architecture.js";
import { backendSection } from "./backend.js";
import { contributingSection } from "./contributing.js";
import { electronSection } from "./electron.js";
import { extensionsSection } from "./extensions.js";
import { frontendSection } from "./frontend.js";
import { policiesSection } from "./policies.js";
import { quickStartSection } from "./quick-start.js";
import { reactSsgSection } from "./react-ssg.js";
import { staticSiteSection } from "./static-site.js";

export const DOCS_SECTIONS: DocSection[] = [
  quickStartSection,
  architectureSection,
  policiesSection,
  backendSection,
  frontendSection,
  staticSiteSection,
  reactSsgSection,
  electronSection,
  extensionsSection,
  contributingSection,
];
