/**
 * Small utilities for string transformations used across the project.
 */

export function pascal(s: string) {
  return s
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

export function camel(s: string) {
  const p = pascal(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

export function kebab(s: string) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/**
 * Basic pluralization helper.
 * - Supports a small irregular map and common english plural rules.
 * - Good enough for simple method naming like `listProducts` / `listCategories`.
 */
export function pluralize(s: string): string {
  const lower = s.toLowerCase();

  const irregular: Record<string, string> = {
    person: "people",
    child: "children",
    mouse: "mice",
    category: "categories",
  };

  if (irregular[lower]) {
    // preserve original casing: if input was PascalCase, return PascalCase plural
    const sample = irregular[lower];
    if (s[0] === s[0].toUpperCase()) {
      return sample.charAt(0).toUpperCase() + sample.slice(1);
    }
    return sample;
  }

  // basic rules
  if (/[sxz]$/.test(lower) || /[ch]$/.test(lower)) {
    return s + "es";
  }

  if (/[aeiou]y$/.test(lower)) {
    return s + "s";
  }

  if (/y$/.test(lower)) {
    return s.slice(0, -1) + "ies";
  }

  return s + "s";
}
