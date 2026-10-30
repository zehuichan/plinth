/** `PlDatePicker` -> `pl-date-picker`, `update:modelValue` -> `update:model-value`. */
export function hyphenate(name: string): string {
  return name.replace(/\B([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Agent skill names are lowercase letters, digits and hyphens, at most 64 characters, and must
 * match the skill's folder name: `@acme/ui` -> `acme-ui`, `acme-ui` -> `acme-ui`.
 */
export function skillName(packageName: string): string {
  const name = packageName
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '');
  if (!name) throw new Error(`cannot derive a skill name from package name "${packageName}"`);
  return name;
}
