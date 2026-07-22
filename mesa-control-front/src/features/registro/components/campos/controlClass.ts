/** Clases base compartidas por input/select/textarea, con estados focus/error. */
export function controlClass(error?: string): string {
  return [
    'w-full rounded-control border bg-bg px-3 py-2 text-body text-text-primary',
    'placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-offset-0',
    error
      ? 'border-danger focus:border-danger focus:ring-danger'
      : 'border-border focus:border-brand focus:ring-brand',
  ].join(' ')
}
