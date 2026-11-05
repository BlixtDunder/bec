import { Injectable, computed, signal } from '@angular/core';
import {
  ALL_QUESTIONS,
  Answers,
  FlowModule,
  MODULES,
  ModuleId,
  QuestionId,
  demoAnswers,
  emptyAnswers,
  isComplete,
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
  /** Completed modules the user expanded on the hub (kept while the app is open, not persisted). */
  readonly expandedDone = signal<ReadonlySet<ModuleId>>(new Set());
  /** The customer pressed Send with answers missing; Review keeps showing what's missing (not persisted). */
  readonly sendAttempted = signal(false);
  completedAt: string | null = null;

  private lastSaved = '';
  /** Answers and checks as last saved, for throwing away an unfinished section. */
  private committedAnswers: Answers = demoAnswers();
  private committedAnswered: ReadonlySet<QuestionId> = new Set();

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

  /** The flow is forced: the module in progress is always the first incomplete one. */
  readonly currentModule = computed<FlowModule | null>(() => this.firstOpenModule());

  /** The one question that can be answered next (all earlier ones are complete), or null when all are done. */
  readonly nextQuestion = computed<QuestionId | null>(
    () => ALL_QUESTIONS.find((q) => !this.answered().has(q)) ?? null,
  );

  /** Answered questions can be revisited; later ones open only in order. */
  canOpen(q: QuestionId): boolean {
    return this.answered().has(q) || this.nextQuestion() === q;
  }

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

  toggleDone(id: ModuleId): void {
    this.expandedDone.update((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  /** Expand a module on the hub (only open modules can take focus). */
  setFocus(id: ModuleId): void {
    if (this.completed().has(id) || this.focus() === id) return;
    this.focus.set(id);
  }

  /** Where the hub's Continue button goes. */
  nextTarget(): string[] {
    const q = this.nextQuestion();
    return q ? ['/q', q] : ['/review'];
  }

  // ---- mutations -----------------------------------------------------------

  /**
   * Leaving a section before it's finished throws its answers away: only
   * completed sections are saved, so the section starts over next time.
   */
  discardOpenSection(): void {
    const m = this.currentModule();
    if (!m || !m.questions.some((q) => this.answered().has(q))) return;
    this.answers = structuredClone(this.committedAnswers);
    this.answered.set(new Set(this.committedAnswered));
  }

  /** Whether every required answer on a question is given. */
  isComplete(q: QuestionId): boolean {
    return isComplete(q, this.answers);
  }

  /** Mark a question answered (green check) when it's complete, otherwise clear it. */
  markAnswered(q: QuestionId): void {
    const filled = isComplete(q, this.answers);
    this.answered.update((s) => {
      const next = new Set(s);
      if (filled) next.add(q);
      else next.delete(q);
      return next;
    });
  }

  /** A completed module whose answers were emptied again is open once more. */
  uncompleteModule(id: ModuleId): void {
    if (!this.completed().has(id)) return;
    this.completed.update((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  /** Completing a module hands focus back to the first incomplete module in order. */
  completeModule(id: ModuleId): void {
    this.completed.update((s) => new Set(s).add(id));
    if (this.focus() === id) this.focus.set(null);
    this.commit();
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
    this.commit();
  }

  /** End the edit session, restoring the answers from when it started. */
  discardEdit(): void {
    if (this.editSnapshot) this.answers = this.editSnapshot;
    this.editSnapshot = null;
    this.commit();
  }

  /** Called when landing on the hub/review: any open session is stale. */
  clearEdit(): void {
    this.editSnapshot = null;
  }

  markSent(): void {
    this.completedAt = new Date().toISOString();
    this.commit();
  }

  /** Start over with no answers (hub close X). `?reset` restores the demo answers instead. */
  clearAll(): void {
    this.reset();
    this.answers = emptyAnswers();
    this.commit();
  }

  reset(): void {
    this.answers = demoAnswers();
    this.answered.set(new Set());
    this.completed.set(new Set());
    this.expandedDone.set(new Set());
    this.sendAttempted.set(false);
    this.focus.set(null);
    this.completedAt = null;
    this.commit();
  }

  /**
   * Write progress to storage. Answers are saved per section, not per question:
   * this runs when a section is completed (or an edit is saved, or everything is cleared).
   */
  commit(): void {
    this.committedAnswers = structuredClone(this.answers);
    this.committedAnswered = new Set(this.answered());
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
      if (!raw) return this.commit();
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
      this.committedAnswers = structuredClone(this.answers);
      this.committedAnswered = new Set(this.answered());
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
