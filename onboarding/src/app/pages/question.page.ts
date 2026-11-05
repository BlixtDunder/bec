import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs';
import {
  ADDRESS_DOC_TYPES,
  Answers,
  CONNECTION_TYPES,
  COUNTRIES,
  EMPLOYMENT_OPTIONS,
  FLAG_COUNTRIES,
  FREQUENCIES,
  ID_TYPES,
  QuestionId,
  REGULAR_TYPES,
  RegularDetail,
  TaxCountry,
  USAGE_OPTIONS,
  moduleOf,
  flagFor,
  isZero,
  taxCountryLine,
} from '../data/flow';
import { FlowState } from '../data/state.service';
import { NavDirection } from '../data/nav-direction';
import { DsActions, DsAlert, DsPageHeader, DsScreen, DsTaskBar } from '../ui/layout';
import { DsField } from '../ui/field';
import { DsPhoneField } from '../ui/phone-field';
import { ChoiceOption, DsCheckboxCard, DsRadioCard, DsRadioGroupCard } from '../ui/choice';
import { DsUploadCard } from '../ui/upload';
import { DsIcon } from '../ui/icon';
import { RemovedTaxCountry } from './tax-country.page';
import { DsLeaveDialog, LeaveDialogData } from '../ui/leave-dialog';

const opts = (list: string[]): ChoiceOption[] => list.map((v) => ({ value: v, label: v }));

interface QuestionCopy {
  title: string;
  body?: string;
}

const COPY: Record<QuestionId, QuestionCopy> = {
  q1: { title: 'Confirm your contact details', body: 'We use these to reach you about your accounts.' },
  q2: { title: 'Where were you born?' },
  q3: { title: 'Citizenship' },
  q4: { title: 'Where do you pay tax?' },
  q5: { title: 'How will you use the bank?', body: 'As a bank, we have to document why you’re a customer with us.' },
  q6: { title: 'Other banks', body: 'As a bank, we have to document your banking relationships.' },
  q7: { title: 'What do you do for a living?' },
  q9: { title: 'Regular payments in', body: 'Only count the fixed amounts you receive in your accounts with us.' },
  q8: { title: 'Connections abroad' },
  q10: { title: 'Other payments in', body: 'For example MobilePay or other payments that don’t come regularly.' },
  q11: { title: 'Cash deposits' },
  q12: { title: 'Cash withdrawals' },
  q13: { title: 'Transfers from abroad', body: 'Both regular payments and one-off transfers.' },
  q14: { title: 'Transfers abroad', body: 'Card payments abroad and on foreign web shops don’t count.' },
  q15: { title: 'Confirm your identity', body: 'By law, we need a photo ID that confirms who you are.' },
  q16: { title: 'Confirm your address', body: 'By law, we need a document that confirms where you live.' },
  q17: { title: 'Documents from your adviser' },
  q18: {
    title: 'Can we keep you updated?',
    body: 'We’d like to tell you about new options, products and services when they’re relevant to you. You can withdraw your consent at any time.',
  },
  q19: { title: 'Sharing within the group', body: 'Let us share information about you with the rest of the Nykredit Group.' },
};

@Component({
  selector: 'app-question',
  imports: [
    MatButtonModule,
    MatRippleModule,
    RouterLink,
    DsScreen,
    DsTaskBar,
    DsPageHeader,
    DsActions,
    DsAlert,
    DsField,
    DsPhoneField,
    DsRadioCard,
    DsCheckboxCard,
    DsRadioGroupCard,
    DsUploadCard,
    DsIcon,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './question.page.html',
  styleUrl: './question.page.scss',
})
export class QuestionPage implements DoCheck {
  protected readonly state = inject(FlowState);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly nav = inject(NavDirection);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly qid = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('qid') as QuestionId)),
    { requireSync: true },
  );
  private readonly query = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly editing = computed(() => this.query().has('edit'));
  private readonly origin = computed(() => (this.query().get('from') === 'review' ? '/review' : '/'));

  protected readonly module = computed(() => moduleOf(this.qid()));
  protected readonly index = computed(() => this.module().questions.indexOf(this.qid()));
  protected readonly copy = computed(() => COPY[this.qid()]);
  protected readonly tag = computed(() => {
    if (this.editing()) return 'Editing';
    const n = this.module().questions.length;
    return n > 1 ? `${this.index() + 1} of ${n}` : null;
  });

  /** Editing a single answer from the hub: Save changes right away instead of walking the module. */
  private readonly single = computed(() => this.query().has('only'));
  protected readonly isLast = computed(
    () => this.single() || this.index() === this.module().questions.length - 1,
  );

  // Option lists
  protected readonly countries = COUNTRIES;
  protected readonly frequencies = FREQUENCIES;
  protected readonly idTypes = ID_TYPES;
  protected readonly addressDocTypes = ADDRESS_DOC_TYPES;
  protected readonly usageOptions = opts(USAGE_OPTIONS);
  protected readonly employmentOptions = opts(EMPLOYMENT_OPTIONS);
  protected readonly regularOptions = opts(REGULAR_TYPES);
  protected readonly connectionOptions = opts(CONNECTION_TYPES);
  protected readonly marketingOptions: ChoiceOption[] = [
    { value: 'yes', label: 'Yes, keep me updated' },
    { value: 'no', label: 'No thanks' },
  ];
  protected readonly groupOptions: ChoiceOption[] = [
    { value: 'yes', label: 'Yes, I accept the consent statement and the exchange of information' },
    { value: 'no', label: 'No, I don’t want information to be shared' },
  ];

  // Q3 citizenship: max 3; countries chosen before opening the screen are pinned on top.
  protected readonly maxCitizenships = 3;
  protected readonly countryQuery = signal('');
  /** Snapshot taken when Q3 opens, so rows don't jump while the user ticks and unticks. */
  private readonly pinned = signal<string[]>([]);
  protected readonly filteredFlags = computed<ChoiceOption[]>(() => {
    const q = this.countryQuery().trim().toLowerCase();
    return FLAG_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({
      value: c.name,
      label: c.name,
      image: c.flag,
    }));
  });
  protected readonly pinnedCountries = computed<ChoiceOption[]>(() => {
    const byName = new Map(this.filteredFlags().map((o) => [o.value, o]));
    return this.pinned().map((n) => byName.get(n)).filter((o): o is ChoiceOption => !!o);
  });
  protected readonly otherCountries = computed<ChoiceOption[]>(() => {
    const pinned = new Set(this.pinned());
    return this.filteredFlags().filter((o) => !pinned.has(o.value));
  });

  protected get a(): Answers {
    return this.state.answers;
  }

  constructor() {
    // Opening a question in an unfinished module makes it the hub's expanded module.
    effect(() => {
      if (this.qid() === 'q3') {
        untracked(() => {
          this.pinned.set([...this.a.citizenships]);
          this.countryQuery.set('');
        });
      }
    });
    effect(() => {
      const m = this.module();
      if (!this.editing()) untracked(() => this.state.setFocus(m.id));
    });

    // Forced flow: a later question can't be opened before the earlier ones are done.
    effect(() => {
      const q = this.qid();
      untracked(() => {
        this.submitted.set(false);
        if (!this.editing() && !this.state.canOpen(q)) {
          this.router.navigate(this.state.nextTarget(), { replaceUrl: true });
        }
      });
    });
        // Coming back from removing a tax country: confirm it and offer Undo.
    const removed = this.router.currentNavigation()?.extras.state?.['removedTaxCountry'] as RemovedTaxCountry | undefined;
    if (removed) this.offerUndo(removed);
  }

  ngDoCheck(): void {
    // Answers are snapshotted when an edit session starts, before anything is changed.
    if (this.editing()) this.state.beginEdit();
  }

  protected regularSelected(): string[] {
    return REGULAR_TYPES.filter((t) => this.a.regularTypes.includes(t));
  }

  protected detail(type: string): RegularDetail {
    return (this.a.regularDetails[type] ??= { amount: '', frequency: 'Every month' });
  }

  protected uploadHeading(): string {
    return this.a.idType === 'Passport' ? 'Photo of your passport' : 'Photo of your driving licence';
  }

  protected uploadHint(): string {
    return this.a.idType === 'Passport'
      ? 'Must be valid. Add the page with your photo.'
      : 'Must be valid. For a digital licence, add the front and “Other information”.';
  }

  protected addressHeading(): string {
    return `Photo of your ${this.a.addressDocType.charAt(0).toLowerCase()}${this.a.addressDocType.slice(1)}`;
  }

  protected addressHint(): string {
    return this.a.addressDocType === 'Health insurance card'
      ? 'Must show your name, address and full CPR number.'
      : 'Must show your name and address and be less than 3 months old.';
  }

  // ---- Q4 tax countries ----------------------------------------------------

  protected readonly taxCountryLine = taxCountryLine;

  protected readonly flagFor = flagFor;

  protected editTaxCountry(index: number): void {
    this.router.navigate(['/q', 'q4', 'country', index], { queryParamsHandling: 'preserve' });
  }

  private offerUndo({ index, item }: RemovedTaxCountry): void {
    this.snackBar
      .open(`${item.country} removed`, 'Undo', { duration: 6000, panelClass: 'ds-snackbar' })
      .onAction()
      .subscribe(() => {
        this.a.taxCountries.splice(index, 0, item satisfies TaxCountry);
        this.cdr.markForCheck();
      });
  }

  // ---- navigation ----------------------------------------------------------

  // ---- validation ----------------------------------------------------------

  /** Set by Continue / Save changes; errors show from then on and update as the customer fixes them. */
  protected readonly submitted = signal(false);
  protected readonly isZero = isZero;

  protected err(missing: boolean, message = 'Fill in this field'): string | null {
    return this.submitted() && missing ? message : null;
  }

  /** Validate this page; on failure show the errors and bring the first one into view. */
  private validate(): boolean {
    this.submitted.set(true);
    if (this.state.isComplete(this.qid())) return true;
    setTimeout(() =>
      document.querySelector('.invalid, [aria-invalid="true"], .error')?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
    );
    return false;
  }

  protected next(): void {
    if (!this.validate()) return;
    this.state.markAnswered(this.qid());
    const next = this.module().questions[this.index() + 1];
    if (this.editing()) {
      // Edit mode walks the module, keeping the edit flags.
      this.router.navigate(['/q', next], { queryParams: this.route.snapshot.queryParams });
      return;
    }
    if (next) {
      this.router.navigate(['/q', next]);
      return;
    }
    // Last step of the module: it's complete, back to the hub.
    this.state.completeModule(this.module().id);
    this.nav.back(); // end of the section: page slides out to the right
    this.router.navigate(['/']);
  }

  protected back(): void {
    const i = this.index();
    if (i > 0) {
      this.nav.back();
      this.router.navigate(['/q', this.module().questions[i - 1]]);
    } else {
      this.leave();
    }
  }

  /** Back to the hub; asks first if this unfinished section has answers that would be lost. */
  private leave(): void {
    const go = () => {
      this.nav.back();
      this.router.navigate(['/']);
    };
    if (!this.state.hasUnsaved()) return go();
    this.dialog
      .open<DsLeaveDialog, LeaveDialogData, boolean>(DsLeaveDialog, {
        data: { section: this.module().title },
        panelClass: 'ds-dialog',
        width: 'calc(min(100vw, 420px) - 48px)',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .subscribe((leave) => leave && go());
  }

  protected readonly leaveFn = () => this.leave();

  protected saveChanges(): void {
    if (!this.validate()) return;
    const m = this.module();
    this.state.markAnswered(this.qid());
    if (m.questions.every((q) => this.state.isAnswered(q))) this.state.completeModule(m.id);
    else this.state.uncompleteModule(m.id);
    this.state.commitEdit();
    this.nav.back();
    this.router.navigateByUrl(this.origin());
  }

  protected cancel(): void {
    this.state.discardEdit();
    this.nav.back();
    this.router.navigateByUrl(this.origin());
  }

  protected readonly cancelFn = () => this.cancel();
}
