import { Injectable, computed, signal } from '@angular/core';
import {
  ALL_QUESTIONS,
  Answers,
  FlowModule,
  MODULES,
  ModuleId,
  QuestionId,
  demoAnswers,
} from './flow';

const STORAGE_KEY = 'bec-kyc-onboarding-v1';

interface Persisted {
  answers: Answers;
  answered: QuestionId[];
  completed: ModuleId[];
  completedAt: string | null;
  focus?: ModuleId | null;
}

export type ModuleState = 'done' | 'current' | 'upcoming';

@Injectable({ providedIn: 'root' })
export class FlowState {
  /** Mutable answer object, bound directly from the question templates. */
  answers: Answers = demoAnswers();
  readonly answered = signal<ReadonlySet<QuestionId>>(new Set());
  readonly completed = signal<ReadonlySet<ModuleId>>(new Set());
  /** Module the user chose to open on the hub (null = first incomplete). */
  readonly focus = signal<ModuleId | null>(null);
  completedAt: string | null = null;

  private lastSaved = '';

  constructor() {
    if (this.resetRequested()) {
      this.reset();
    } else {
      this.load();
    }
  }

  // ---- derived state -------------------------------------------------------

  readonly doneCount = computed(() => this.completed().size);

  /** First incomplete module in order. */
  readonly firstOpenModule = computed<FlowModule | null>(
    () => MODULES.find((m) => !this.completed().has(m.id)) ?? null,
  );

  /** The single expanded module on the hub: the user's focus if still open, else the first open one. */
  readonly currentModule = computed<FlowModule | null>(() => {
    const f = this.focus();
    const fm = f ? MODULES.find((m) => m.id === f) : undefined;
    if (fm && !this.completed().has(fm.id)) return fm;
    return this.firstOpenModule();
  });

  /** Remaining minutes; partly answered modules count proportionally (rounded up, min 1). */
  readonly minutesLeft = computed(() => {
    const answered = this.answered();
    return MODULES.filter((m) => !this.completed().has(m.id)).reduce((sum, m) => {
      const open = m.questions.filter((q) => !answered.has(q)).length;
      return sum + Math.max(1, Math.ceil((m.minutes * open) / m.questions.length));
    }, 0);
  });

  readonly started = computed(() => this.answered().size > 0 || this.completed().size > 0);

  moduleState(m: FlowModule): ModuleState {
    if (this.completed().has(m.id)) return 'done';
    return this.currentModule()?.id === m.id ? 'current' : 'upcoming';
  }

  isAnswered(q: QuestionId): boolean {
    return this.answered().has(q);
  }

  answeredCount(m: FlowModule): number {
    const a = this.answered();
    return m.questions.filter((q) => a.has(q)).length;
  }

  /** First unanswered question in a module, or null if all are answered. */
  firstOpenQuestion(m: FlowModule): QuestionId | null {
    return m.questions.find((q) => !this.answered().has(q)) ?? null;
  }

  /** Expand a module on the hub (only open modules can take focus). */
  setFocus(id: ModuleId): void {
    if (this.completed().has(id) || this.focus() === id) return;
    this.focus.set(id);
    this.save();
  }

  /** Where the hub's Continue button goes. */
  nextTarget(): string[] {
    const m = this.currentModule();
    if (!m) return ['/review'];
    return ['/q', this.firstOpenQuestion(m) ?? m.questions[0]];
  }

  // ---- mutations -----------------------------------------------------------

  markAnswered(q: QuestionId): void {
    this.answered.update((s) => new Set(s).add(q));
    this.save();
  }

  /** Completing a module hands focus back to the first incomplete module in order. */
  completeModule(id: ModuleId): void {
    this.completed.update((s) => new Set(s).add(id));
    if (this.focus() === id) this.focus.set(null);
    this.save();
  }

  // ---- edit sessions -------------------------------------------------------

  /** Answers as they were when the current edit session started (for Cancel). */
  private editSnapshot: Answers | null = null;

  /** Start an edit session unless one is already running. */
  beginEdit(): void {
    this.editSnapshot ??= structuredClone(this.answers);
  }

  /** End the edit session, keeping the edits. */
  commitEdit(): void {
    this.editSnapshot = null;
    this.save();
  }

  /** End the edit session, restoring the answers from when it started. */
  discardEdit(): void {
    if (this.editSnapshot) this.answers = this.editSnapshot;
    this.editSnapshot = null;
    this.save();
  }

  /** Called when landing on the hub/review: any open session is stale. */
  clearEdit(): void {
    this.editSnapshot = null;
  }

  markSent(): void {
    this.completedAt = new Date().toISOString();
    this.save();
  }

  reset(): void {
    this.answers = demoAnswers();
    this.answered.set(new Set());
    this.completed.set(new Set());
    this.focus.set(null);
    this.completedAt = null;
    this.save();
  }

  /** Persist if the answer object has changed since the last save. */
  persistIfChanged(): void {
    if (this.serialize() !== this.lastSaved) this.save();
  }

  save(): void {
    const json = this.serialize();
    this.lastSaved = json;
    try {
      localStorage.setItem(STORAGE_KEY, json);
    } catch {
      /* storage unavailable: keep in memory */
    }
  }

  private serialize(): string {
    const data: Persisted = {
      answers: this.answers,
      answered: [...this.answered()],
      completed: [...this.completed()],
      completedAt: this.completedAt,
      focus: this.focus(),
    };
    return JSON.stringify(data);
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.save();
      const data = JSON.parse(raw) as Persisted;
      this.answers = { ...demoAnswers(), ...data.answers };
      // Files still "uploading" when the page was closed are treated as uploaded.
      for (const k of ['idFiles', 'addressFiles', 'adviserFiles'] as const) {
        this.answers[k] = this.answers[k].map((f) => ({ ...f, status: 'uploaded' as const }));
      }
      this.answered.set(new Set(data.answered.filter((q) => ALL_QUESTIONS.includes(q))));
      this.completed.set(new Set(data.completed));
      this.focus.set(data.focus ?? null);
      this.completedAt = data.completedAt;
      this.lastSaved = this.serialize();
    } catch {
      this.reset();
    }
  }

  /** `?reset` in the URL (before or after the hash) restarts the demo. */
  private resetRequested(): boolean {
    const { search, hash } = window.location;
    const has = (s: string) => new URLSearchParams(s).has('reset');
    const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?')) : '';
    if (!has(search) && !has(hashQuery)) return false;
    // Strip the flag so a reload doesn't reset again.
    const url = new URL(window.location.href);
    url.searchParams.delete('reset');
    let h = url.hash;
    if (hashQuery) {
      const p = new URLSearchParams(hashQuery);
      p.delete('reset');
      const rest = p.toString();
      h = hash.slice(0, hash.indexOf('?')) + (rest ? `?${rest}` : '');
    }
    history.replaceState(null, '', url.pathname + url.search + h);
    return true;
  }
}
