import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import intlTelInput, { Iso2, Iti } from 'intl-tel-input';
import { DIAL_COUNTRIES, DsCountryCodeSheet } from './country-code-sheet';
import { DsIcon } from './icon';

let nextId = 0;

/**
 * DS "Text field" for a mobile number. A flag + chevron + dial code button leads
 * the value and opens the country code bottom sheet; intl-tel-input formats as
 * you type and flags invalid numbers on blur. Defaults to Denmark (+45).
 * Writes back to the same two values the old Country code + Mobile number fields used.
 */
@Component({
  selector: 'ds-phone-field',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrapper" [class.focused]="focused()" [class.invalid]="error()" (click)="focusInput($event)">
      <label class="label t-label-medium" [attr.for]="id">{{ label() }}</label>
      <div class="row">
        <button
          type="button"
          class="country"
          [attr.aria-label]="'Country code: ' + country().name + ' ' + country().dialCode"
          aria-haspopup="dialog"
          (click)="openSheet()"
        >
          <img [src]="country().flag" alt="" />
          <ds-icon name="chevron-down" [size]="12" class="chevron" />
          <span class="t-body-large">{{ country().dialCode }}</span>
        </button>
        <input
          #input
          class="value t-body-large"
          [id]="id"
          type="tel"
          autocomplete="tel-national"
          [attr.aria-invalid]="error()"
          [attr.aria-describedby]="error() ? id + '-error' : null"
          (input)="sync()"
          (focus)="focused.set(true)"
          (blur)="focused.set(false); touched.set(true)"
        />
      </div>
    </div>
    @if (error()) {
      <div class="supporting t-body-small" [id]="id + '-error'">Enter a valid mobile number</div>
    }
  `,
  styles: `
    :host { display: block; }
    .wrapper {
      background: var(--md-sys-color-secondary-container);
      border-radius: var(--md-sys-shape-corner-medium);
      padding: var(--space-1-5) var(--space-2);
      min-height: 72px;
      display: flex; flex-direction: column; justify-content: center;
      gap: var(--space-0-5);
      cursor: text;
      transition: box-shadow 120ms ease-out;
    }
    .wrapper.focused { box-shadow: inset 0 0 0 2px var(--md-sys-color-primary); }
    .wrapper.invalid { box-shadow: inset 0 0 0 2px var(--md-sys-color-error); }
    .label { color: var(--md-sys-color-on-secondary-fixed-variant); cursor: inherit; }
    .row { display: flex; align-items: center; gap: var(--space-1); }
    .country {
      display: flex; align-items: center; gap: var(--space-0-5); flex: none;
      height: 24px; padding: 0; border: 0; background: none; cursor: pointer;
      color: var(--md-sys-color-on-secondary-container);
      border-radius: var(--space-0-5); outline-offset: 2px;
    }
    .country img {
      width: 20px; height: 20px; border-radius: 50%; object-fit: cover;
      /* keeps white flags (Finland, Japan…) edged on the white field */
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
    }
    .chevron { color: var(--md-sys-color-on-secondary-fixed-variant); }
    .value {
      flex: 1; min-width: 0; height: 24px;
      border: 0; padding: 0; margin: 0; outline: none; background: transparent;
      color: var(--md-sys-color-on-secondary-container);
      font-family: var(--font);
    }
    .supporting {
      padding: var(--space-0-5) var(--space-2) 0;
      color: var(--md-sys-color-error);
    }
  `,
})
export class DsPhoneField implements AfterViewInit, OnDestroy {
  private readonly sheet = inject(MatBottomSheet);

  readonly label = input('Mobile number');
  /** Dial code, e.g. "+45". */
  readonly code = model<string>('');
  /** National number as displayed, e.g. "20 12 34 56". */
  readonly number = model<string>('');

  protected readonly id = `ds-phone-field-${nextId++}`;
  protected readonly focused = signal(false);
  protected readonly touched = signal(false);
  private readonly iso2 = signal('dk');
  private readonly valid = signal<boolean | null>(null);
  protected readonly country = computed(() => DIAL_COUNTRIES.find((c) => c.iso2 === this.iso2())!);
  protected readonly error = computed(() => this.touched() && !!this.number() && this.valid() === false);

  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private iti?: Iti;

  ngAfterViewInit(): void {
    const el = this.inputEl().nativeElement;
    const stored = DIAL_COUNTRIES.find((c) => c.dialCode === this.code());
    if (stored) this.iso2.set(stored.iso2);
    // The library only formats and validates; the country picker is the bottom sheet.
    this.iti = intlTelInput(el, {
      initialCountry: this.iso2() as Iso2,
      countrySelectorMode: 'OFF',
      showFlags: false,
      // The dial code sits in the country button, so the input shows the national number.
      separateDialCode: false,
      numberDisplayFormat: 'NATIONAL',
      strictMode: true,
      allowedNumberTypes: ['MOBILE'],
      containerClass: 'ds-iti',
      loadUtils: () => import('intl-tel-input/utils'),
    });
    // Formatting and validation need the utils script, which loads lazily: show the stored
    // number as-is until then, and only parse it (and write back) once utils are in.
    el.value = this.number();
    el.addEventListener('countrychange', () => this.sync());
    this.iti.promise.then(() => {
      if (this.number()) this.iti?.setNumber(`${this.code()}${this.number()}`);
      this.sync();
    });
  }

  ngOnDestroy(): void {
    this.iti?.destroy();
  }

  protected openSheet(): void {
    this.sheet
      .open<DsCountryCodeSheet, { selected: string }, string>(DsCountryCodeSheet, {
        data: { selected: this.iso2() },
        panelClass: 'ds-sheet',
        ariaLabel: 'Country code',
      })
      .afterDismissed()
      .subscribe((iso2) => {
        if (!iso2 || !this.iti) return;
        this.iti.setSelectedCountry(iso2 as Iso2);
        this.sync();
        this.inputEl().nativeElement.focus();
      });
  }

  protected sync(): void {
    if (!this.iti || !intlTelInput.utils) return;
    const country = this.iti.getSelectedCountry();
    if (country) this.iso2.set(country.iso2);
    const code = country ? `+${country.dialCode}` : '';
    const valid = this.iti.isValidNumber();
    // A valid number is stored in international format without the dial code ("70 123 45 67", not "070…").
    const intl = valid ? this.iti.getNumber('INTERNATIONAL') : '';
    this.code.set(code);
    this.number.set(intl.startsWith(code) ? intl.slice(code.length).trim() : this.inputEl().nativeElement.value);
    this.valid.set(valid);
  }

  protected focusInput(e: MouseEvent): void {
    if ((e.target as HTMLElement).closest('.country')) return;
    this.inputEl().nativeElement.focus();
  }
}
