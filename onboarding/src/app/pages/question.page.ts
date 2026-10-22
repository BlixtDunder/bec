import { ChangeDetectionStrategy, Component, DoCheck, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { map } from 'rxjs';
import {
  ADDRESS_DOC_TYPES,
  Answers,
  CONNECTION_TYPES,
  COUNTRIES,
  COUNTRY_CODES,
  EMPLOYMENT_OPTIONS,
  FLAG_COUNTRIES,
  FREQUENCIES,
  ID_TYPES,
  QuestionId,
  REGULAR_TYPES,
  RegularDetail,
  USAGE_OPTIONS,
  moduleOf,
} from '../data/flow';
import { FlowState } from '../data/state.service';
import { DsActions, DsAlert, DsPageHeader, DsScreen, DsTaskBar } from '../ui/layout';
import { DsField } from '../ui/field';
import { ChoiceOption, DsCheckboxCard, DsRadioCard, DsRadioGroupCard } from '../ui/choice';
import { DsUploadCard } from '../ui/upload';
import { DsIcon } from '../ui/icon';

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
    DsScreen,
    DsTaskBar,
    DsPageHeader,
    DsActions,
    DsAlert,
    DsField,
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

  protected readonly isLast = computed(() => this.index() === this.module().questions.length - 1);

  // Option lists
  protected readonly countries = COUNTRIES;
  protected readonly countryCodes = COUNTRY_CODES;
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
  }

  ngDoCheck(): void {
    // Answers are snapshotted when an edit session starts, before anything is changed.
    if (this.editing()) this.state.beginEdit();
    this.state.persistIfChanged();
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

  // ---- navigation ----------------------------------------------------------

  protected next(): void {
    if (this.editing()) {
      // Edit mode walks the module, keeping the edit flags.
      this.state.markAnswered(this.qid());
      this.router.navigate(['/q', this.module().questions[this.index() + 1]], {
        queryParams: this.route.snapshot.queryParams,
      });
      return;
    }
    const m = this.module();
    this.state.markAnswered(this.qid());
    // Next unanswered question after this one, then any earlier one still open.
    const i = this.index();
    const ordered = [...m.questions.slice(i + 1), ...m.questions.slice(0, i)];
    const open = ordered.find((x) => !this.state.isAnswered(x));
    if (open) {
      this.router.navigate(['/q', open]);
      return;
    }
    // Module done: hub focus falls back to the first incomplete module in order.
    this.state.completeModule(m.id);
    this.router.navigate(['/']);
  }

  protected back(): void {
    const i = this.index();
    if (i > 0) this.router.navigate(['/q', this.module().questions[i - 1]]);
    else this.router.navigate(['/']);
  }

  protected saveChanges(): void {
    const m = this.module();
    this.state.markAnswered(this.qid());
    if (m.questions.every((q) => this.state.isAnswered(q))) this.state.completeModule(m.id);
    this.state.commitEdit();
    this.router.navigateByUrl(this.origin());
  }

  protected cancel(): void {
    this.state.discardEdit();
    this.router.navigateByUrl(this.origin());
  }

  protected readonly cancelFn = () => this.cancel();
}
