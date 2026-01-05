import type { DocSection } from "./types.js";
import { architectureSection } from "./architecture.js";
import { contributingSection } from "./contributing.js";
import { frontendSection } from "./frontend.js";
import { policiesSection } from "./policies.js";
import { quickStartSection } from "./quick-start.js";
import { reactSsgSection } from "./react-ssg.js";
import { staticSiteSection } from "./static-site.js";

export const DOCS_SECTIONS: DocSection[] = [
  quickStartSection,
  architectureSection,
  policiesSection,
  frontendSection,
  staticSiteSection,
  reactSsgSection,
  contributingSection,
];
