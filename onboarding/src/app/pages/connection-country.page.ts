import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { map } from 'rxjs';
import { CONNECTION_TYPES, COUNTRIES, ConnectionCountry, flagFor, moduleOf } from '../data/flow';
import { FlowState } from '../data/state.service';
import { NavDirection } from '../data/nav-direction';
import { DsActions, DsPageHeader, DsScreen, DsTaskBar } from '../ui/layout';
import { DsField } from '../ui/field';
import { ChoiceOption, DsCheckboxCard } from '../ui/choice';
import { RemovedListItem } from './tax-country.page';

/**
 * Add or edit a country the customer has connections to (Q8 sub-screen), set up
 * like the tax countries: `q/q8/country` adds, `q/q8/country/:index` edits.
 */
@Component({
  selector: 'app-connection-country',
  imports: [MatButtonModule, DsScreen, DsTaskBar, DsPageHeader, DsActions, DsField, DsCheckboxCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ds-screen>
      <ds-task-bar [title]="sectionTitle" [closeAction]="cancelFn" />
      <ds-page-header [tag]="tag()" [title]="isEdit() ? 'Edit country' : 'Add a country'" />

      <ds-field
        label="Country"
        [options]="countryOptions()"
        searchable
        [imageFor]="flagFor"
        [value]="country()"
        (valueChange)="country.set($event)"
        [error]="show(country() ? null : 'Choose a country')"
      />
      <ds-checkbox-card
        heading="Type of connection"
        [options]="typeOptions"
        [value]="types()"
        (valueChange)="types.set($event)"
        [error]="show(types().length ? null : 'Choose at least one')"
      />
      <ds-field
        label="Tell us about the connection"
        [value]="text()"
        (valueChange)="text.set($event)"
        [error]="show(text().trim() ? null : 'Fill in this field')"
      />

      @if (isEdit()) {
        <button matButton="text" type="button" class="remove" (click)="remove()">Remove country</button>
      }

      <ds-actions>
        <button matButton="filled" type="button" (click)="save()">{{ isEdit() ? 'Save changes' : 'Add country' }}</button>
        <button matButton="text" type="button" (click)="cancel()">Cancel</button>
      </ds-actions>
    </ds-screen>
  `,
  styles: `.remove { width: 100%; }`,
})
export class ConnectionCountryPage {
  private readonly state = inject(FlowState);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly nav = inject(NavDirection);

  constructor() {
    // Forced flow: Connections abroad must be the step in progress (or already answered).
    if (!this.route.snapshot.queryParamMap.has('edit') && !this.state.canOpen('q8')) {
      this.router.navigate(this.state.nextTarget(), { replaceUrl: true });
    }
  }

  private readonly index = toSignal(
    this.route.paramMap.pipe(map((p) => (p.has('index') ? Number(p.get('index')) : null))),
    { requireSync: true },
  );
  protected readonly sectionTitle = moduleOf('q8').title;
  protected readonly isEdit = computed(() => this.index() !== null);
  protected readonly tag = computed(() => {
    if (this.route.snapshot.queryParamMap.has('edit')) return 'Editing';
    const m = moduleOf('q8');
    return `${m.questions.indexOf('q8') + 1} of ${m.questions.length}`;
  });

  private readonly existing: ConnectionCountry | undefined =
    this.index() !== null ? this.state.answers.connectionCountries[this.index()!] : undefined;

  // Draft: nothing is written to the answers until Add country / Save changes.
  protected readonly country = signal(this.existing?.country ?? '');
  protected readonly types = signal<string[]>(this.existing ? [...this.existing.types] : []);
  protected readonly text = signal(this.existing?.text ?? '');

  /** "Abroad" leaves Denmark out, and a country can only be listed once. */
  protected readonly countryOptions = computed(() => {
    const taken = new Set(
      this.state.answers.connectionCountries.filter((_, i) => i !== this.index()).map((c) => c.country),
    );
    return COUNTRIES.filter((c) => c !== 'Denmark' && !taken.has(c));
  });
  protected readonly flagFor = flagFor;
  protected readonly typeOptions: ChoiceOption[] = CONNECTION_TYPES.map((t) => ({ value: t, label: t }));

  // Validation: the button is always enabled; errors show after the first try and update as you type.
  private readonly submitted = signal(false);
  private readonly valid = computed(() => !!this.country() && this.types().length > 0 && !!this.text().trim());

  protected show(msg: string | null): string | null {
    return this.submitted() ? msg : null;
  }

  protected save(): void {
    this.submitted.set(true);
    if (!this.valid()) {
      setTimeout(() => document.querySelector('.invalid, [aria-invalid="true"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
      return;
    }
    const item: ConnectionCountry = { country: this.country(), types: CONNECTION_TYPES.filter((t) => this.types().includes(t)), text: this.text().trim() };
    const list = this.state.answers.connectionCountries;
    const i = this.index();
    if (i === null) list.push(item);
    else list[i] = item;
    this.backToQ8();
  }

  protected remove(): void {
    const i = this.index()!;
    const [item] = this.state.answers.connectionCountries.splice(i, 1);
    this.backToQ8({ list: 'connectionCountries', index: i, item });
  }

  protected cancel(): void {
    this.backToQ8();
  }

  protected readonly cancelFn = () => this.cancel();

  private backToQ8(removed?: RemovedListItem): void {
    this.nav.back();
    this.router.navigate(['/q', 'q8'], {
      queryParamsHandling: 'preserve',
      state: removed ? { removedListItem: removed } : undefined,
    });
  }
}
