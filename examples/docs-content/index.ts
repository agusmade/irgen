import type { DocSection } from "./types.js";
import { architectureSection } from "./architecture.js";
import { backendSection } from "./backend.js";
import { cliReferenceSection } from "./cli-reference.js";
import { contributingSection } from "./contributing.js";
import { dslReferenceSection } from "./dsl-reference.js";
import { electronSection } from "./electron.js";
import { emitterGuideSection } from "./emitter-guide.js";
import { extensionsSection } from "./extensions.js";
import { frontendSection } from "./frontend.js";
import { installCliSection } from "./install-cli.js";
import { outputStructureSection } from "./output-structure.js";
import { phpSharedHostingSection } from "./php-shared-hosting.js";
import { policyReferenceSection } from "./policy-reference.js";
import { policiesSection } from "./policies.js";
import { quickStartSection } from "./quick-start.js";
import { reactSsgSection } from "./react-ssg.js";
import { releaseNotesSection } from "./release-notes.js";
import { staticSiteSection } from "./static-site.js";
import { troubleshootingSection } from "./troubleshooting.js";

type DocSidebarGroup = {
  label: string;
  ids: string[];
};

const ALL_SECTIONS: DocSection[] = [
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
  emitterGuideSection,
  phpSharedHostingSection,
  extensionsSection,
  outputStructureSection,
  troubleshootingSection,
  releaseNotesSection,
  contributingSection,
];

const SECTION_BY_ID = new Map<string, DocSection>();
for (const section of ALL_SECTIONS) {
  SECTION_BY_ID.set(section.id, section);
}

const BASE_DOCS_SIDEBAR_GROUPS: DocSidebarGroup[] = [
  {
    label: "Overview",
    ids: [
      "quick-start",
      "install-cli",
      "cli-reference",
      "dsl-reference",
      "architecture",
      "policies",
    ],
  },
  {
    label: "Reference",
    ids: [
      "policy-reference",
      "backend",
      "frontend",
      "static-site",
      "react-ssg",
      "electron",
      "php-shared-hosting",
      "emitter-development",
      "extensions",
      "output-structure",
      "troubleshooting",
      "release-notes",
      "contributing",
    ],
  },
];

const groupedIds = new Set<string>(BASE_DOCS_SIDEBAR_GROUPS.flatMap((group) => group.ids));
const ungroupedSections = ALL_SECTIONS.filter((section) => !groupedIds.has(section.id));

export const DOCS_SIDEBAR_GROUPS: DocSidebarGroup[] = [
  ...BASE_DOCS_SIDEBAR_GROUPS,
  ...(ungroupedSections.length
    ? [{ label: "Other", ids: ungroupedSections.map((section) => section.id) }]
    : []),
];

const orderedSections = DOCS_SIDEBAR_GROUPS.flatMap((group) =>
  group.ids
    .map((id) => SECTION_BY_ID.get(id))
    .filter((section): section is DocSection => Boolean(section)),
);

export const DOCS_SECTIONS: DocSection[] = [...orderedSections, ...ungroupedSections];
