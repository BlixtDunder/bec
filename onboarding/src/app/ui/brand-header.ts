import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';

/**
 * Front-page header (Figma "Top", type=main page, Brand=Nykredit): 80px bar,
 * padding 16/12, Nykredit wordmark left, customer initials and the Accent
 * log-out button right (48px each, 24px apart).
 * The wordmark is a button: it starts the questionnaire over.
 */
@Component({
  selector: 'ds-brand-header',
  imports: [MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="logo" (click)="logoClick.emit()" aria-label="Nykredit – start over">
      <img src="brand/nykredit-logo.svg" alt="" width="116" height="19" />
    </button>
    <span class="end">
      <span class="initials t-body-large-medium" aria-label="Thomas Christensen">TC</span>
      <span class="logout" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <path
            d="M29.9998 15.5152C29.9898 12.1049 27.3098 9.34367 23.9998 9.33337C20.6898 9.34367 18.0098 12.1049 17.9998 15.5152V20.6667M23.9998 30.6667V33.3334M23.9998 30.6667C25.4726 30.6667 26.6665 29.4728 26.6665 28C26.6665 26.5273 25.4726 25.3334 23.9998 25.3334C22.5271 25.3334 21.3332 26.5273 21.3332 28C21.3332 29.4728 22.5271 30.6667 23.9998 30.6667ZM31.9998 20.6667H15.9998C14.1589 20.6667 12.6665 22.1591 12.6665 24V34.6667C12.6665 36.5076 14.1589 38 15.9998 38H31.9998C33.8408 38 35.3332 36.5076 35.3332 34.6667V24C35.3332 22.1591 33.8408 20.6667 31.9998 20.6667Z"
            stroke-width="1.25"
            stroke-miterlimit="10"
            stroke-linecap="square"
            stroke="currentColor"
          />
        </svg>
      </span>
    </span>
  `,
  styles: `
    :host {
      display: flex; align-items: center; justify-content: space-between;
      height: 80px; padding: var(--space-2) var(--space-1-5); flex: none;
    }
    .logo {
      display: flex; padding: var(--space-0-5) 10px;
      border: 0; background: none; cursor: pointer;
      border-radius: var(--space-1); outline-offset: 2px;
    }
    .logo img { display: block; width: 116px; height: auto; }
    .end { display: flex; align-items: center; gap: var(--space-3); }
    .initials {
      width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-tertiary-container);
    }
    .logout {
      width: 48px; height: 48px; border-radius: 50%; display: flex;
      background: var(--md-sys-color-accent);
      color: var(--md-sys-color-on-accent);
    }
  `,
})
export class DsBrandHeader {
  readonly logoClick = output<void>();
}
