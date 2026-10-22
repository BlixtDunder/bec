import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { DsIcon } from './icon';

let nextId = 0;

/**
 * DS "Text field": white filled container (radius 12, padding 12/16, 72px),
 * label/medium label in OnSecondaryFixedVar above a body/large value.
 * Empty + unfocused shows the label at body/large size (label-text configuration).
 * Optional trailing chevron-down (dropdown via mat-select) or suffix ("kr.").
 */
@Component({
  selector: 'ds-field',
  imports: [DsIcon, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="wrapper"
      [class.focused]="focused()"
      [class.collapsed]="collapsed()"
      (click)="activate()"
    >
      <div class="content">
        <div class="text">
          <label class="label" [attr.for]="id" [class.t-label-medium]="!collapsed()" [class.t-body-large]="collapsed()">{{ label() }}</label>
          @if (options(); as opts) {
            <span class="value t-body-large">{{ value() }}</span>
            <mat-select
              #select
              class="overlay-select"
              [id]="id"
              [value]="value()"
              (valueChange)="value.set($event)"
              (openedChange)="focused.set($event)"
              panelClass="ds-select-panel"
              [aria-label]="label()"
              hideSingleSelectionIndicator
            >
              @for (o of opts; track o) {
                <mat-option [value]="o">{{ o }}</mat-option>
              }
            </mat-select>
          } @else {
            <input
              #input
              class="value t-body-large"
              [id]="id"
              [value]="value()"
              [attr.inputmode]="inputmode()"
              [attr.type]="type()"
              [attr.autocomplete]="autocomplete()"
              (input)="value.set($any($event.target).value)"
              (focus)="focused.set(true)"
              (blur)="focused.set(false)"
            />
          }
        </div>
        @if (options()) {
          <span class="trailing"><ds-icon name="chevron-down" [size]="16" class="chevron" /></span>
        } @else if (suffix()) {
          <span class="trailing"><span class="suffix t-body-small">{{ suffix() }}</span></span>
        }
      </div>
    </div>
    @if (supporting()) {
      <div class="supporting t-body-small">{{ supporting() }}</div>
    }
  `,
  styles: `
    :host { display: block; }
    .wrapper {
      position: relative;
      background: var(--md-sys-color-secondary-container);
      border-radius: var(--md-sys-shape-corner-medium);
      padding: var(--space-1-5) var(--space-2);
      min-height: 72px;
      cursor: text;
      transition: box-shadow 120ms ease-out;
    }
    .wrapper.focused { box-shadow: inset 0 0 0 2px var(--md-sys-color-primary); }
    .content { display: flex; align-items: center; min-height: 48px; }
    .text {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column; justify-content: center;
      gap: var(--space-0-5);
    }
    .label {
      color: var(--md-sys-color-on-secondary-fixed-variant);
      cursor: inherit;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .value {
      display: block; width: 100%;
      color: var(--md-sys-color-on-secondary-container);
      min-height: 24px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    input.value {
      border: 0; padding: 0; margin: 0; outline: none; background: transparent;
      font-family: var(--font);
    }
    .collapsed .value { position: absolute; opacity: 0; pointer-events: none; height: 0; min-height: 0; }
    .trailing {
      width: 32px; height: 48px; flex: none;
      display: flex; align-items: center; justify-content: flex-end;
      position: relative;
    }
    .chevron { color: var(--md-sys-color-on-secondary-fixed-variant); }
    .suffix {
      position: absolute; left: 0; width: 48px; text-align: center;
      color: var(--md-sys-color-on-surface-variant);
    }
    .supporting {
      padding: var(--space-0-5) var(--space-2) 0;
      color: var(--md-sys-color-on-surface-variant);
    }
    :host:has(.overlay-select) .wrapper { cursor: pointer; }
    .overlay-select {
      position: absolute; inset: 0; width: 100%; height: 100%;
      opacity: 0;
    }
    .overlay-select ::ng-deep .mat-mdc-select-trigger { height: 100%; }
    :host:has(.overlay-select:focus-visible) .wrapper {
      box-shadow: inset 0 0 0 2px var(--md-sys-color-primary);
    }
  `,
})
export class DsField {
  readonly label = input.required<string>();
  readonly value = model<string>('');
  readonly options = input<string[] | null>(null);
  readonly suffix = input<string | null>(null);
  readonly supporting = input<string | null>(null);
  readonly inputmode = input<string | null>(null);
  readonly type = input<string>('text');
  readonly autocomplete = input<string | null>(null);

  protected readonly id = `ds-field-${nextId++}`;
  protected readonly focused = signal(false);
  protected readonly collapsed = computed(() => !this.value() && !this.focused());

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly select = viewChild<MatSelect>('select');

  protected activate(): void {
    const el = this.inputEl()?.nativeElement;
    if (el) {
      this.focused.set(true);
      queueMicrotask(() => el.focus());
    }
  }
}
