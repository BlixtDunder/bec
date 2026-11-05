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
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { DsIcon } from './icon';

let nextId = 0;

/**
 * DS "Text field": white filled container (radius 12, padding 12/16, 72px),
 * label/medium label in OnSecondaryFixedVar above a body/large value.
 * Empty + unfocused shows the label at body/large size (label-text configuration).
 * Optional trailing chevron-down (dropdown via mat-select) or suffix ("kr.").
 * `searchable` dropdowns are typed into: the list filters as you type (mat-autocomplete),
 * starting empty with the chosen value as placeholder; leaving without picking keeps the chosen value.
 * `imageFor` adds a leading image (e.g. a country flag) to the options and to the chosen value.
 */
@Component({
  selector: 'ds-field',
  imports: [DsIcon, MatSelectModule, MatAutocompleteModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="wrapper"
      matAutocompleteOrigin
      #origin="matAutocompleteOrigin"
      [class.focused]="focused()"
      [class.invalid]="!!error()"
      [class.collapsed]="collapsed()"
      (click)="activate()"
    >
      <div class="content">
        @if (leadingImage(); as img) {
          <img class="leading-image" [src]="img" alt="" width="24" height="24" />
        }
        <div class="text">
          <label class="label" [attr.for]="id" [class.t-label-medium]="!collapsed()" [class.t-body-large]="collapsed()">{{ label() }}</label>
          @if (options() && searchable()) {
            <input
              #input
              class="value t-body-large"
              [id]="id"
              [value]="focused() ? query() : value()"
              [attr.aria-invalid]="!!error()"
              [attr.aria-describedby]="error() ? id + '-error' : null"
              [placeholder]="focused() ? value() : ''"
              autocomplete="off"
              role="combobox"
              [matAutocomplete]="auto"
              [matAutocompleteConnectedTo]="origin"
              (input)="query.set($any($event.target).value)"
              (focus)="startSearch()"
              (blur)="endSearch()"
              (keydown.enter)="pickTopMatch()"
            />
            <mat-autocomplete #auto="matAutocomplete" class="ds-select-panel" hideSingleSelectionIndicator autoActiveFirstOption (optionSelected)="pick($event.option.value)">
              @for (o of filtered(); track o) {
                <mat-option [value]="o">
                  @if (imageFor()?.(o); as img) {
                    <span class="ds-option"><img [src]="img" alt="" width="24" height="24" loading="lazy" decoding="async" />{{ o }}</span>
                  } @else {
                    {{ o }}
                  }
                </mat-option>
              } @empty {
                <mat-option disabled>No countries match “{{ query() }}”</mat-option>
              }
            </mat-autocomplete>
          } @else if (options(); as opts) {
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
                <mat-option [value]="o">
                  @if (imageFor()?.(o); as img) {
                    <span class="ds-option"><img [src]="img" alt="" width="24" height="24" loading="lazy" decoding="async" />{{ o }}</span>
                  } @else {
                    {{ o }}
                  }
                </mat-option>
              }
            </mat-select>
          } @else {
            <input
              #input
              class="value t-body-large"
              [id]="id"
              [value]="value()"
              [attr.aria-invalid]="!!error()"
              [attr.aria-describedby]="error() ? id + '-error' : null"
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
    @if (error()) {
      <div class="supporting error t-body-small" [id]="id + '-error'" role="alert">{{ error() }}</div>
    } @else if (supporting()) {
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
    .wrapper.invalid { box-shadow: inset 0 0 0 2px var(--md-sys-color-error); }
    .content { display: flex; align-items: center; gap: var(--space-1-5); min-height: 48px; }
    .leading-image {
      width: 24px; height: 24px; border-radius: 50%; flex: none; object-fit: cover;
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
    }
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
    input.value::placeholder { color: var(--md-sys-color-on-surface-variant); opacity: 1; }
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
    .supporting.error { color: var(--md-sys-color-error); }
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
  /** Leading image for an option value (country flags); also shown before the chosen value. */
  readonly imageFor = input<((option: string) => string | null) | null>(null);
  /** Dropdown you can type into to filter the options (long lists such as countries). */
  readonly searchable = input(false, { transform: (v: boolean | '') => v !== false });
  readonly suffix = input<string | null>(null);
  readonly supporting = input<string | null>(null);
  /** Validation message: red outline, replaces the supporting text. */
  readonly error = input<string | null>(null);
  readonly inputmode = input<string | null>(null);
  readonly type = input<string>('text');
  readonly autocomplete = input<string | null>(null);

  protected readonly id = `ds-field-${nextId++}`;
  protected readonly focused = signal(false);
  protected readonly collapsed = computed(() => !this.value() && !this.focused());

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly select = viewChild<MatSelect>('select');
  private readonly trigger = viewChild(MatAutocompleteTrigger);

  /** The chosen value's image, hidden while the user is typing a new search. */
  protected readonly leadingImage = computed(() => {
    const fn = this.imageFor();
    if (!fn || !this.value() || (this.searchable() && this.focused())) return null;
    return fn(this.value());
  });

  /** Text typed into a searchable dropdown. */
  protected readonly query = signal('');
  /** Options matching the query; names starting with it come first. */
  protected readonly filtered = computed(() => {
    const opts = this.options() ?? [];
    const q = this.query().trim().toLowerCase();
    if (!q) return opts;
    const starts = opts.filter((o) => o.toLowerCase().startsWith(q));
    const contains = opts.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains];
  });

  /** Focus starts a fresh search; the chosen country stays visible as the placeholder. */
  protected startSearch(): void {
    this.focused.set(true);
    this.query.set('');
  }

  protected endSearch(): void {
    this.focused.set(false);
    this.query.set(this.value());
  }

  /** Enter takes the top match when no option is highlighted (e.g. typed fast, before the list updated). */
  protected pickTopMatch(): void {
    if (this.trigger()?.activeOption) return;
    const top = this.filtered()[0];
    if (!this.query().trim() || !top) return;
    this.pick(top);
    this.trigger()?.closePanel();
  }

  /** Picking a country ends the search, so the list doesn't cover the next field. */
  protected pick(option: string): void {
    this.value.set(option);
    this.query.set(option);
    // After mat-autocomplete has finished its own selection handling (it refocuses the input).
    setTimeout(() => this.inputEl()?.nativeElement.blur());
  }

  protected activate(): void {
    const el = this.inputEl()?.nativeElement;
    if (el) {
      this.focused.set(true);
      queueMicrotask(() => el.focus());
    }
  }
}
