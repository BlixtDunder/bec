import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface ChoiceOption {
  value: string;
  label: string;
  image?: string;
}

export const YES_NO: ChoiceOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

/** Shared card + List item (0 Density) row styling. */
const CARD_STYLES = `
  :host {
    display: block;
    background: var(--md-sys-color-secondary-container);
    border-radius: var(--md-sys-shape-corner-medium);
    overflow: hidden;
  }
  :host(.large) { border-radius: var(--md-sys-shape-corner-large); }
  .title-header {
    display: block;
    padding: var(--space-2) var(--space-2) var(--space-1);
    color: var(--md-sys-color-on-surface-variant);
    margin: 0;
  }
  .row { display: block; transition: background-color 120ms ease-out; }
  .row:hover { background: color-mix(in srgb, var(--md-sys-color-on-surface) 4%, transparent); }
  .row ::ng-deep .mdc-form-field {
    display: flex; width: 100%; align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    min-height: 72px;
    cursor: pointer;
  }
  .row ::ng-deep .mdc-form-field > .mdc-label {
    flex: 1; min-width: 0;
    padding: 0;
    cursor: pointer;
    color: var(--md-sys-color-on-surface);
    font-family: var(--font);
    font-size: 16px; line-height: 24px; font-weight: 500; letter-spacing: 0.15px;
  }
  .row ::ng-deep .mdc-radio, .row ::ng-deep .mdc-checkbox { flex: none; margin: 0; }
  .lead { display: flex; align-items: center; gap: var(--space-2); }
  .lead img { width: 32px; height: 32px; border-radius: 50%; display: block; flex: none; }
`;

/** Radio question card: title header (body/medium (medium)) + 72px rows, radio on the right. */
@Component({
  selector: 'ds-radio-card',
  imports: [MatRadioModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (heading()) {
      <p class="title-header t-body-medium-medium">{{ heading() }}</p>
    }
    <mat-radio-group [value]="value()" (change)="value.set($event.value)" [attr.aria-label]="heading()">
      @for (o of options(); track o.value) {
        <mat-radio-button class="row" labelPosition="before" [value]="o.value">
          {{ o.label }}
        </mat-radio-button>
      }
    </mat-radio-group>
  `,
  styles: CARD_STYLES,
})
export class DsRadioCard {
  readonly heading = input<string | null>(null);
  readonly options = input<ChoiceOption[]>(YES_NO);
  readonly value = model<string>('');
}

/** Checkbox card: title header + rows with the checkbox on the right; optional leading image. */
@Component({
  selector: 'ds-checkbox-card',
  imports: [MatCheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (heading()) {
      <p class="title-header t-body-medium-medium">{{ heading() }}</p>
    }
    <div role="group" [attr.aria-label]="heading()">
      @for (o of options(); track o.value) {
        <mat-checkbox
          class="row"
          labelPosition="before"
          [checked]="value().includes(o.value)"
          (change)="toggle(o.value, $event.checked)"
        >
          @if (o.image) {
            <span class="lead"><img [src]="o.image" alt="" />{{ o.label }}</span>
          } @else {
            {{ o.label }}
          }
        </mat-checkbox>
      } @empty {
        <p class="empty t-body-medium">No matches</p>
      }
    </div>
  `,
  styles:
    CARD_STYLES +
    `.empty { margin: 0; padding: var(--space-3) var(--space-2); color: var(--md-sys-color-on-surface-variant); text-align: center; }`,
})
export class DsCheckboxCard {
  readonly heading = input<string | null>(null);
  readonly options = input.required<ChoiceOption[]>();
  readonly value = model<string[]>([]);

  protected toggle(v: string, checked: boolean): void {
    const cur = this.value().filter((x) => x !== v);
    this.value.set(checked ? [...cur, v] : cur);
  }
}

/** DS Radiobutton-Cards: padding 16, body/large title, radios on the left with labels. */
@Component({
  selector: 'ds-radio-group-card',
  imports: [MatRadioModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="title t-body-large">{{ heading() }}</p>
    <mat-radio-group class="group" [value]="value()" (change)="value.set($event.value)" [attr.aria-label]="heading()">
      @for (o of options(); track o.value) {
        <mat-radio-button [value]="o.value">{{ o.label }}</mat-radio-button>
      }
    </mat-radio-group>
  `,
  styles: `
    :host {
      display: flex; flex-direction: column; gap: var(--space-1-5);
      padding: var(--space-2);
      background: var(--md-sys-color-secondary-container);
      border-radius: var(--md-sys-shape-corner-medium);
    }
    .title { margin: 0; color: var(--md-sys-color-on-secondary-container); }
    .group { display: flex; flex-direction: column; gap: 20px; }
    .group ::ng-deep .mdc-form-field { display: flex; align-items: center; gap: 2px; width: 100%; cursor: pointer; }
    .group ::ng-deep .mdc-form-field > .mdc-label { flex: 1; padding: 0; cursor: pointer; }
  `,
})
export class DsRadioGroupCard {
  readonly heading = input.required<string>();
  readonly options = input<ChoiceOption[]>(YES_NO);
  readonly value = model<string>('');
}
