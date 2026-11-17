import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { DsIcon } from './icon';

let nextId = 0;

/**
 * Disclosure card (e.g. a consent statement): heading > button[aria-expanded]
 * controls the projected text. Open by default so the full text is read before
 * the customer chooses; it can be collapsed.
 */
@Component({
  selector: 'ds-disclosure',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'region', '[attr.aria-labelledby]': 'id + "-toggle"' },
  template: `
    <h2 class="heading">
      <button
        type="button"
        class="toggle t-body-large-medium"
        [id]="id + '-toggle'"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="id + '-text'"
        (click)="open.set(!open())"
      >
        {{ heading() }}
        <ds-icon name="chevron-down" [size]="16" class="chevron" [class.up]="open()" />
      </button>
    </h2>
    <div class="text t-body-large" [id]="id + '-text'" [hidden]="!open()"><ng-content /></div>
  `,
  styles: `
    :host {
      display: block;
      background: var(--md-sys-color-secondary-container);
      border-radius: var(--md-sys-shape-corner-medium);
      overflow: hidden;
    }
    .heading { margin: 0; font: inherit; }
    .toggle {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-2);
      width: 100%; min-height: 56px; padding: var(--space-2);
      border: 0; background: none; text-align: left; cursor: pointer;
      color: var(--md-sys-color-on-surface);
    }
    .chevron { flex: none; transition: transform 200ms ease; }
    .chevron.up { transform: rotate(180deg); }
    .text { padding: 0 var(--space-2) var(--space-1); color: var(--md-sys-color-on-surface); }
    .text ::ng-deep p { margin: 0 0 var(--space-2); }
    .text ::ng-deep ul { margin: 0 0 var(--space-2); padding-left: var(--space-3); }
    .text ::ng-deep a {
      display: inline-flex; align-items: center; gap: var(--space-1); min-height: 48px;
      color: var(--md-sys-color-primary); text-decoration: underline; text-underline-offset: 3px;
    }
    @media (prefers-reduced-motion: reduce) { .chevron { transition: none; } }
  `,
})
export class DsDisclosure {
  readonly heading = input.required<string>();
  protected readonly id = `ds-disclosure-${nextId++}`;
  protected readonly open = signal(true);
}
