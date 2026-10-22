import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * DS icons exported as SVG from the Figma instances (Icons/* library).
 * Colours are replaced with currentColor so they follow the token in CSS.
 */
const ICONS: Record<string, string> = {
  // close | Size=lg-24, Style=outline
  close: `<svg viewBox="0 0 24 24" fill="none"><path d="M19.5 4.5L4.5 19.5M19.5 19.5L4.5 4.5" stroke-miterlimit="10" stroke-linecap="square" stroke="currentColor"/></svg>`,
  // chevron-right | Size=md-16
  'chevron-right': `<svg viewBox="0 0 16 16" fill="none"><path d="M5.66602 2L11.666 8L5.66602 14" stroke-width="0.9" stroke-miterlimit="10" stroke-linecap="square" stroke="currentColor"/></svg>`,
  // chevron-down | Size=md-16
  'chevron-down': `<svg viewBox="0 0 16 16" fill="none"><path d="M2 5.66602L8 11.666L14 5.66602" stroke-width="0.9" stroke-miterlimit="10" stroke-linecap="square" stroke="currentColor"/></svg>`,
  // search | Size=lg-24
  search: `<svg viewBox="0 0 24 24" fill="none"><path d="M22 22L17.5 17.5M5 10C5 8.67392 5.52678 7.40215 6.46447 6.46447C7.40215 5.52678 8.67392 5 10 5M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke-miterlimit="10" stroke-linecap="round" stroke="currentColor"/></svg>`,
  // upload | Size=x-lg-32
  upload: `<svg viewBox="0 0 32 32" fill="none"><path d="M9.00065 25.3327H7.20065C3.9603 25.3327 1.33398 22.8095 1.33398 19.6963C1.33398 17.2407 2.97176 15.1571 5.25292 14.385C5.33407 9.00508 9.89245 4.66602 15.5118 4.66602C21.1819 4.66602 25.7785 9.08208 25.7785 14.5297C25.7785 14.6959 25.7618 14.8575 25.753 15.0219C28.5055 15.2483 30.6673 17.4624 30.6673 20.166C30.6673 23.0199 28.2601 25.3327 25.2895 25.3327H23.0007M16.0007 28.666V14.666M16.0007 14.666V14.8409M22.0007 20.666L16.0007 14.666L10.0007 20.666" stroke-width="1.25" stroke-miterlimit="10" stroke-linecap="square" stroke="currentColor"/></svg>`,
  // documents | Size=lg-24
  documents: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 8H18M6 12H18M6 16H12M20 3.5H4C2.61929 3.5 1.5 4.61929 1.5 6V18C1.5 19.3807 2.61929 20.5 4 20.5H20C21.3807 20.5 22.5 19.3807 22.5 18V6C22.5 4.61929 21.3807 3.5 20 3.5Z" stroke-miterlimit="10" stroke-linecap="square" stroke="currentColor"/></svg>`,
  // bin | Size=md-16
  bin: `<svg viewBox="0 0 16 16" fill="none"><path d="M2.99935 5.5L3.55725 13.45C3.61852 14.3231 4.34462 15 5.21982 15H10.7789C11.6541 15 12.3802 14.3231 12.4414 13.45L12.9993 5.5M5.99935 3V1.83333C5.99935 1.3731 6.37245 1 6.83268 1H9.16602C9.62625 1 9.99935 1.3731 9.99935 1.83333V3M7.99935 7.33333V13M5.49935 7.33333L5.83268 13M10.4993 7.33333L10.166 13M12.9993 3H2.99935C2.26297 3 1.66602 3.59697 1.66602 4.33333V5.33333H14.3327V4.33333C14.3327 3.59697 13.7357 3 12.9993 3Z" stroke-width="0.9" stroke-miterlimit="10" stroke-linecap="square" stroke="currentColor"/></svg>`,
  // info | Size=md-16
  info: `<svg viewBox="0 0 16 16" fill="none"><path d="M8 5C8.1841 5 8.33333 4.85077 8.33333 4.66667C8.33333 4.48257 8.1841 4.33333 8 4.33333C7.8159 4.33333 7.66667 4.48257 7.66667 4.66667C7.66667 4.85077 7.8159 5 8 5Z" fill="currentColor"/><path d="M8 11.6667V7.5C8 7.03977 7.6269 6.66667 7.16667 6.66667H6.33333M8 15C11.866 15 15 11.866 15 8C15 4.134 11.866 1 8 1C4.134 1 1 4.134 1 8C1 11.866 4.134 15 8 15ZM8 5C8.1841 5 8.33333 4.85077 8.33333 4.66667C8.33333 4.48257 8.1841 4.33333 8 4.33333C7.8159 4.33333 7.66667 4.48257 7.66667 4.66667C7.66667 4.85077 7.8159 5 8 5Z" stroke-width="0.9" stroke-miterlimit="10" stroke-linecap="square" stroke="currentColor"/></svg>`,
  // bell | Size=md-16
  bell: `<svg viewBox="0 0 16 16" fill="none"><path d="M6.37777 12.9682L6.382 12.95C6.35267 13.0737 6.33333 13.2007 6.33333 13.3333C6.33333 14.2537 7.07967 15 8 15C8.92033 15 9.66667 14.2537 9.66667 13.3333C9.66667 13.201 9.64733 13.0737 9.618 12.95L9.6248 12.9796M14 12.3333V11.3333C14 11.3333 12.3333 10 12.3333 6.66667V5.33333C12.3333 2.94 10.3933 1 8 1C5.60667 1 3.66667 2.94 3.66667 5.33333V6.66667C3.66667 10 2 11.3333 2 11.3333V12.3333C6 13.2223 10 13.2223 14 12.3333Z" stroke-width="0.9" stroke-miterlimit="10" stroke-linecap="square" stroke="currentColor"/></svg>`,
  // Icons/check_24px (inside User Images Style=check)
  check: `<svg viewBox="0 0 25 25" fill="none"><path d="M9.07801 16.3106L4.87179 12.1044L3.43945 13.5266L9.07801 19.1652L21.1823 7.06092L19.76 5.63867L9.07801 16.3106Z" fill="currentColor"/></svg>`,
  // checkmark-round | Size=md-16, Style=solid
  'checkmark-round': `<svg viewBox="0 0 16 16" fill="none"><path d="M8.00033 0.666504C3.95023 0.666504 0.666992 3.94974 0.666992 7.99984C0.666992 12.0499 3.95023 15.3332 8.00033 15.3332C12.0504 15.3332 15.3337 12.0499 15.3337 7.99984C15.3337 3.94974 12.0504 0.666504 8.00033 0.666504ZM6.70293 11.4095L12.0376 4.93174L11.2656 4.296L6.63119 9.92354L4.66706 7.9594L3.95996 8.6665L6.70293 11.4095Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/></svg>`,
  // launch | Size=md-16
  launch: `<svg viewBox="0 0 16 16" fill="none"><path d="M8.00065 8.00065L14.6673 1.33398M14.6673 6.00065V1.33398H10.0007M6.00065 1.33398H2.66732C2.3137 1.33398 1.97456 1.47446 1.72451 1.72451C1.47446 1.97456 1.33398 2.3137 1.33398 2.66732V13.334C1.33398 13.6876 1.47446 14.0267 1.72451 14.2768C1.97456 14.5268 2.3137 14.6673 2.66732 14.6673H13.334C13.6876 14.6673 14.0267 14.5268 14.2768 14.2768C14.5268 14.0267 14.6673 13.6876 14.6673 13.334V10.0007" stroke-width="0.9" stroke-miterlimit="10" stroke-linecap="round" stroke="currentColor"/></svg>`,
};

@Component({
  selector: 'ds-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[innerHTML]': 'svg()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    'aria-hidden': 'true',
  },
  template: '',
  styles: `
    :host { display: inline-flex; flex: none; line-height: 0; }
    :host ::ng-deep svg { width: 100%; height: 100%; display: block; overflow: visible; }
  `,
})
export class DsIcon {
  private readonly sanitizer = inject(DomSanitizer);
  readonly name = input.required<string>();
  readonly size = input(24);
  protected readonly svg = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()] ?? ''),
  );
}
