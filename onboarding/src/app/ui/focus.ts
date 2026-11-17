/**
 * Validation failed: move keyboard and screen-reader focus to the first invalid
 * control, so its label and linked error (aria-describedby) are announced.
 * Groups (radio/checkbox cards) focus their first input.
 */
export function focusFirstError(): void {
  setTimeout(() => {
    const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!el) return;
    const target = el.matches('input, textarea, select, button')
      ? el
      : (el.querySelector<HTMLElement>('input:not([type="file"]):not([disabled]), button, [tabindex="0"]') ?? el);
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    target.focus({ preventScroll: true });
  });
}
