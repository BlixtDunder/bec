import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { map } from 'rxjs';
import { COUNTRIES, NO_TIN_REASONS, TaxCountry, flagFor, tinError, tinHint } from '../data/flow';
import { FlowState } from '../data/state.service';
import { NavDirection } from '../data/nav-direction';
import { DsActions, DsPageHeader, DsScreen, DsTaskBar } from '../ui/layout';
import { DsField } from '../ui/field';
import { ChoiceOption, DsCheckboxCard, DsRadioCard } from '../ui/choice';

/** Router state handed back to Q4 after a removal, so it can offer Undo. */
export interface RemovedTaxCountry {
  index: number;
  item: TaxCountry;
}

/**
 * Add or edit one of the customer's other tax countries (Q4 sub-screen).
 * `q/q4/country` adds, `q/q4/country/:index` edits. The module's edit-mode
 * query params are passed through, so Q4 keeps its Editing state.
 */
@Component({
  selector: 'app-tax-country',
  imports: [MatButtonModule, DsScreen, DsTaskBar, DsPageHeader, DsActions, DsField, DsCheckboxCard, DsRadioCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ds-screen>
      <ds-task-bar title="Tax" [back]="true" [closeAction]="cancelFn" />
      <ds-page-header [tag]="tag()" [title]="isEdit() ? 'Edit tax country' : 'Add a tax country'" />

      <ds-field label="Country" [options]="countryOptions()" searchable [imageFor]="flagFor" [value]="country()" (valueChange)="country.set($event)" [error]="show(countryError())" />

      @if (!noTin()) {
        <ds-field
          label="Tax identification number (TIN)"
          [value]="tin()"
          (valueChange)="tin.set($event)"
          [supporting]="country() ? hint() : null"
          [error]="show(tinErrorText())"
        />
      }

      <ds-checkbox-card [options]="noTinOption()" [value]="noTin() ? ['no-tin'] : []" (valueChange)="noTin.set($event.length > 0)" />

      @if (noTin()) {
        <div class="group" animate.enter="reveal" animate.leave="conceal">
          <ds-radio-card
            heading="Why don't you have a TIN?"
            [options]="reasonOptions()"
            [value]="reason()"
            (valueChange)="reason.set($any($event))"
          />
          @if (show(reasonError()); as msg) {
            <p class="error t-body-small" role="alert">{{ msg }}</p>
          }
          @if (reason() === 'not-received') {
            <ds-field label="Tell us why" [value]="why()" (valueChange)="why.set($event)" [error]="show(whyError())" />
          }
        </div>
      }

      @if (isEdit()) {
        <button matButton="text" type="button" class="remove" (click)="remove()">Remove country</button>
      }

      <ds-actions>
        <button matButton="filled" type="button" (click)="save()">
          {{ isEdit() ? 'Save changes' : 'Add country' }}
        </button>
        <button matButton="text" type="button" (click)="cancel()">Cancel</button>
      </ds-actions>
    </ds-screen>
  `,
  styles: `
    .group { display: flex; flex-direction: column; gap: var(--space-3); }
    .remove { width: 100%; }
    .error { margin: calc(-1 * var(--space-2)) 0 0; padding: 0 var(--space-2); color: var(--md-sys-color-error); }
  `,
})
export class TaxCountryPage {
  private readonly state = inject(FlowState);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly nav = inject(NavDirection);

  private readonly index = toSignal(
    this.route.paramMap.pipe(map((p) => (p.has('index') ? Number(p.get('index')) : null))),
    { requireSync: true },
  );
  protected readonly isEdit = computed(() => this.index() !== null);
  protected readonly tag = computed(() => (this.route.snapshot.queryParamMap.has('edit') ? 'Editing' : '3 of 3'));

  private readonly existing: TaxCountry | undefined =
    this.index() !== null ? this.state.answers.taxCountries[this.index()!] : undefined;

  // Draft: nothing is written to the answers until Add country / Save changes.
  protected readonly country = signal(this.existing?.country ?? '');
  protected readonly tin = signal(this.existing?.tin ?? '');
  protected readonly noTin = signal(this.existing?.noTin ?? false);
  protected readonly reason = signal<TaxCountry['noTinReason']>(this.existing?.noTinReason ?? '');
  protected readonly why = signal(this.existing?.noTinWhy ?? '');

  /** Denmark has its own question, and a country can only be listed once. */
  protected readonly countryOptions = computed(() => {
    const taken = new Set(
      this.state.answers.taxCountries.filter((_, i) => i !== this.index()).map((c) => c.country),
    );
    return COUNTRIES.filter((c) => c !== 'Denmark' && !taken.has(c));
  });

  protected readonly flagFor = flagFor;
  protected readonly hint = computed(() => tinHint(this.country()));
  protected readonly noTinOption = computed<ChoiceOption[]>(() => [
    { value: 'no-tin', label: `I don't have a TIN for ${this.country() || 'this country'}` },
  ]);
  protected readonly reasonOptions = computed<ChoiceOption[]>(() =>
    NO_TIN_REASONS.map((r) => ({ value: r.value, label: r.label(this.country() || 'The country') })),
  );

  // Validation: the button is always enabled; errors show after the first try and update as you type.
  private readonly submitted = signal(false);
  protected readonly countryError = computed(() => (this.country() ? null : 'Choose a country'));
  protected readonly tinErrorText = computed(() => (this.noTin() ? null : tinError(this.country(), this.tin())));
  protected readonly reasonError = computed(() => (this.noTin() && !this.reason() ? "Choose why you don't have a TIN" : null));
  protected readonly whyError = computed(() =>
    this.noTin() && this.reason() === 'not-received' && !this.why().trim() ? 'Tell us why you haven’t received one' : null,
  );
  private readonly valid = computed(
    () => !this.countryError() && !this.tinErrorText() && !this.reasonError() && !this.whyError(),
  );

  protected show(msg: string | null): string | null {
    return this.submitted() ? msg : null;
  }

  protected save(): void {
    this.submitted.set(true);
    if (!this.valid()) {
      // Bring the first problem into view once the errors have rendered.
      setTimeout(() => document.querySelector('[aria-invalid="true"], .error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return;
    }
    const item: TaxCountry = {
      country: this.country(),
      tin: this.noTin() ? '' : this.tin().trim(),
      noTin: this.noTin(),
      noTinReason: this.noTin() ? this.reason() : '',
      noTinWhy: this.noTin() && this.reason() === 'not-received' ? this.why().trim() : '',
    };
    const list = this.state.answers.taxCountries;
    const i = this.index();
    if (i === null) list.push(item);
    else list[i] = item;
    this.state.save();
    this.backToQ4();
  }

  protected remove(): void {
    const i = this.index()!;
    const [item] = this.state.answers.taxCountries.splice(i, 1);
    this.state.save();
    this.backToQ4({ index: i, item } satisfies RemovedTaxCountry);
  }

  protected cancel(): void {
    this.backToQ4();
  }

  protected readonly cancelFn = () => this.cancel();

  private backToQ4(removed?: RemovedTaxCountry): void {
    this.nav.back();
    this.router.navigate(['/q', 'q4'], {
      queryParamsHandling: 'preserve',
      state: removed ? { removedTaxCountry: removed } : undefined,
    });
  }
}
