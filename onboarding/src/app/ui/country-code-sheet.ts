import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatRippleModule } from '@angular/material/core';
import intlTelInput from 'intl-tel-input';
import { COUNTRY_LIST } from '../data/countries';
import { DsIcon } from './icon';

export interface DialCountry {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
}

/** Same order and names as the country picker: Denmark, the Nordics, then A–Z. */
const ORDER = new Map(COUNTRY_LIST.map((c, i) => [c.code, i]));
const NAMES = new Map(COUNTRY_LIST.map((c) => [c.code, c.name]));

export const DIAL_COUNTRIES: DialCountry[] = intlTelInput
  .getAllCountries()
  .map((c) => ({
    iso2: c.iso2,
    name: NAMES.get(c.iso2) ?? c.name,
    dialCode: `+${c.dialCode}`,
    // Ascension has no flag of its own in the set: St Helena's
    flag: `flags/1x1/${c.iso2 === 'ac' ? 'sh' : c.iso2}.svg`,
  }))
  .sort((a, b) => (ORDER.get(a.iso2) ?? 999) - (ORDER.get(b.iso2) ?? 999) || a.name.localeCompare(b.name, 'en'));

/**
 * Bottom sheet for picking a phone country code: close X top left, centred
 * title, full-width search, then flag + country + dial code rows.
 * Dismisses with the chosen iso2 code.
 */
@Component({
  selector: 'ds-country-code-sheet',
  imports: [DsIcon, MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <button type="button" class="icon-btn" aria-label="Close" (click)="ref.dismiss()">
        <span class="container" matRipple [matRippleCentered]="true"><ds-icon name="close" [size]="24" /></span>
      </button>
      <h2 class="title t-title-medium">Country code</h2>
      <span class="spacer"></span>
    </header>
    <label class="search-bar">
      <span class="search-icon"><ds-icon name="search" [size]="24" /></span>
      <input
        class="t-body-large"
        type="search"
        placeholder="Search for country or code"
        aria-label="Search for country or code"
        cdkFocusInitial
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
    </label>
    <div class="list" role="listbox" aria-label="Countries">
      @for (c of results(); track c.iso2) {
        <button
          type="button"
          class="row"
          role="option"
          matRipple
          [attr.aria-selected]="c.iso2 === data.selected"
          (click)="ref.dismiss(c.iso2)"
        >
          <img [src]="c.flag" alt="" />
          <span class="name t-body-large">{{ c.name }}</span>
          <span class="code t-body-large">{{ c.dialCode }}</span>
          @if (c.iso2 === data.selected) {
            <ds-icon class="check" name="checkmark-round" [size]="16" />
          }
        </button>
      } @empty {
        <p class="empty t-body-medium">No countries match “{{ query() }}”</p>
      }
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; min-height: 0; }
    .bar { display: flex; align-items: center; height: 64px; padding: var(--space-1); flex: none; }
    .icon-btn {
      width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-surface);
      border: 0; background: none; padding: 0; cursor: pointer;
      border-radius: 50%; outline-offset: -4px;
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
    }
    .spacer { width: 48px; flex: none; }
    .search-bar {
      display: flex; align-items: center; gap: var(--space-0-5);
      height: 56px; flex: none;
      margin: 0 var(--space-2) var(--space-2);
      padding: var(--space-0-5);
      background: var(--md-sys-color-secondary-container);
      border-radius: var(--space-4);
      cursor: text;
    }
    .search-bar:focus-within { box-shadow: inset 0 0 0 2px var(--md-sys-color-primary); }
    .search-icon {
      width: 48px; height: 48px; flex: none;
      display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-surface-variant);
    }
    .search-bar input {
      flex: 1; min-width: 0;
      border: 0; outline: none; background: transparent; padding: 0;
      color: var(--md-sys-color-on-surface);
      font-family: var(--font);
    }
    .search-bar input::placeholder { color: var(--md-sys-color-on-surface-variant); }
    .list {
      flex: 1; min-height: 0; overflow-y: auto;
      margin: 0 var(--space-2);
      padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
    }
    .row {
      display: flex; align-items: center; gap: var(--space-2);
      width: 100%; min-height: 56px;
      padding: var(--space-1) var(--space-2);
      border: 0; margin: 0; cursor: pointer; text-align: left;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-surface);
      position: relative; overflow: hidden;
    }
    .row:first-child { border-radius: var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) 0 0; }
    .row:last-child { border-bottom-left-radius: var(--md-sys-shape-corner-large); border-bottom-right-radius: var(--md-sys-shape-corner-large); }
    .row:hover { background: color-mix(in srgb, var(--md-sys-color-on-surface) 4%, var(--md-sys-color-secondary-container)); }
    .row:focus-visible { outline: 2px solid var(--md-sys-color-primary); outline-offset: -2px; }
    .row img {
      width: 24px; height: 24px; border-radius: 50%; flex: none; object-fit: cover;
      /* keeps white flags (Finland, Japan…) edged on the white card */
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
    }
    .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .code { color: var(--md-sys-color-on-surface-variant); flex: none; }
    .check { color: var(--md-sys-color-primary); }
    .empty { margin: var(--space-3) 0; text-align: center; color: var(--md-sys-color-on-surface-variant); }
  `,
})
export class DsCountryCodeSheet {
  protected readonly ref = inject<MatBottomSheetRef<DsCountryCodeSheet, string>>(MatBottomSheetRef);
  protected readonly data = inject<{ selected: string }>(MAT_BOTTOM_SHEET_DATA);
  protected readonly query = signal('');

  protected readonly results = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return DIAL_COUNTRIES;
    const digits = q.replace(/\D/g, '');
    return DIAL_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || (digits && c.dialCode.slice(1).startsWith(digits)),
    );
  });
}
