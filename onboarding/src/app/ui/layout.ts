import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NavDirection } from '../data/nav-direction';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { DsIcon } from './icon';

/**
 * Task bar: 64px, icon button left, centred title (title/medium).
 * Hubs show a close X; inside an opened section (`back`) it is an arrow-back.
 */
@Component({
  selector: 'ds-task-bar',
  imports: [RouterLink, DsIcon, MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (closeAction(); as action) {
      <button type="button" class="icon-btn" (click)="action()" [attr.aria-label]="back() ? 'Back' : 'Close'">
        <span class="container" matRipple [matRippleCentered]="true">
          <ds-icon [name]="back() ? 'arrow-back' : 'close'" [size]="24" />
        </span>
      </button>
    } @else {
      <a class="icon-btn" [routerLink]="closeTo()" (click)="back() && nav.back()" [attr.aria-label]="back() ? 'Back' : 'Close'">
        <span class="container" matRipple [matRippleCentered]="true">
          <ds-icon [name]="back() ? 'arrow-back' : 'close'" [size]="24" />
        </span>
      </a>
    }
    <h1 class="title t-title-medium">{{ title() }}</h1>
    <span class="spacer"></span>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      height: 64px;
      padding: var(--space-1);
      flex: none;
    }
    .icon-btn {
      width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-surface);
      border-radius: 50%;
      outline-offset: -4px;
      border: 0; background: none; padding: 0; cursor: pointer;
    }
    .container {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .icon-btn:hover .container { background: color-mix(in srgb, currentColor 8%, transparent); }
    .title {
      flex: 1; margin: 0; text-align: center;
      color: var(--md-sys-color-on-surface);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .spacer { width: 48px; height: 48px; flex: none; }
  `,
})
export class DsTaskBar {
  readonly title = input.required<string>();
  readonly closeTo = input<string | string[]>('/');
  readonly closeAction = input<(() => void) | null>(null);
  /** Inside an opened section: arrow-back instead of the close X. */
  readonly back = input(false);
  /** Leaving via the task bar always pops (slides out to the right). */
  protected readonly nav = inject(NavDirection);
}

/** Tag pill. Neutral = white; Primary = PrimaryContainer. */
@Component({
  selector: 'ds-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 't-label-small', '[class.primary]': "tone() === 'primary'" },
  template: `<ng-content />`,
  styles: `
    :host {
      display: inline-flex; align-items: center; justify-content: center;
      height: 24px; padding: var(--space-0-5) var(--space-1);
      border-radius: var(--md-sys-shape-corner-full);
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-surface);
      white-space: nowrap; flex: none;
    }
    :host(.primary) {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
  `,
})
export class DsTag {
  readonly tone = input<'neutral' | 'primary'>('neutral');
}

/** Centred header block: optional tag, headline/small title, optional body/large text. */
@Component({
  selector: 'ds-page-header',
  imports: [DsTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tag()) {
      <ds-tag>{{ tag() }}</ds-tag>
    }
    <h2 class="title t-headline-small">{{ title() }}</h2>
    @if (body()) {
      <p class="body t-body-large">{{ body() }}</p>
    }
  `,
  styles: `
    :host {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-1); text-align: center;
    }
    .title { margin: 0; width: 100%; color: var(--md-sys-color-on-surface); }
    .body { margin: 0; width: 100%; color: var(--md-sys-color-on-surface-variant); }
  `,
})
export class DsPageHeader {
  readonly tag = input<string | null>(null);
  readonly title = input.required<string>();
  readonly body = input<string | null>(null);
}

/** Alert: Warning (yellow + bell) or Default/info (outlined + info). */
@Component({
  selector: 'ds-alert',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'type()', role: 'note' },
  template: `
    <span class="icon-container">
      <ds-icon [name]="type() === 'warning' ? 'bell' : 'info'" [size]="16" />
    </span>
    <div class="contents">
      <p class="t-title-small">{{ heading() }}</p>
      <p class="t-body-medium"><ng-content /></p>
    </div>
  `,
  styles: `
    :host {
      display: flex; gap: var(--space-1-5);
      /* Figma strokes sit inside the 16px padding box */
      padding: calc(var(--space-2) - 1px);
      border-radius: var(--md-sys-shape-corner-medium);
      border: 1px solid;
    }
    :host(.warning) {
      background: var(--md-sys-color-warning-container);
      border-color: var(--md-sys-color-warning);
      color: var(--md-sys-color-on-warning-container);
    }
    :host(.info) {
      background: var(--md-sys-color-tertiary-container);
      border-color: var(--md-sys-color-on-tertiary-fixed-variant);
      color: var(--md-sys-color-on-secondary-container);
    }
    .icon-container { display: flex; padding: 2px 0; height: 20px; flex: none; }
    .contents { display: flex; flex-direction: column; gap: var(--space-0-5); min-width: 0; }
    p { margin: 0; }
  `,
})
export class DsAlert {
  readonly type = input<'warning' | 'info'>('info');
  readonly heading = input.required<string>();
}

/**
 * Bottom actions band: padding 16/16/24/16, 8px gap. Pinned to the bottom of
 * the viewport; content scrolls underneath it. The 16px top padding fades from
 * transparent to the page background so content visibly slides under.
 */
@Component({
  selector: 'ds-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: flex; flex-direction: column; gap: var(--space-1);
      padding: var(--space-2) var(--space-2) calc(var(--space-3) + env(safe-area-inset-bottom));
      flex: none;
      position: sticky; bottom: 0; z-index: 1;
      background: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--md-sys-color-surface) 0%, transparent) 0,
        var(--md-sys-color-surface) var(--space-2)
      );
    }
    :host ::ng-deep .mat-mdc-button-base { width: 100%; }
  `,
})
export class DsActions {}

/** Screen scaffold: content (24/16/16/16, gap 24) fills the space above the actions. */
@Component({
  selector: 'ds-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content select="ds-task-bar" />
    <main class="content"><ng-content /></main>
    <ng-content select="ds-actions" />
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100dvh; }
    .content {
      flex: 1;
      display: flex; flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-2) var(--space-2);
    }
  `,
})
export class DsScreen {}
