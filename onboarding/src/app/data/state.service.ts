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
}

export type ModuleState = 'done' | 'current' | 'upcoming';

@Injectable({ providedIn: 'root' })
export class FlowState {
  /** Mutable answer object, bound directly from the question templates. */
  answers: Answers = demoAnswers();
  readonly answered = signal<ReadonlySet<QuestionId>>(new Set());
  readonly completed = signal<ReadonlySet<ModuleId>>(new Set());
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

  readonly currentModule = computed<FlowModule | null>(
    () => MODULES.find((m) => !this.completed().has(m.id)) ?? null,
  );

  readonly minutesLeft = computed(() =>
    MODULES.filter((m) => !this.completed().has(m.id)).reduce((s, m) => s + m.minutes, 0),
  );

  readonly started = computed(() => this.answered().size > 0 || this.completed().size > 0);

  moduleState(m: FlowModule): ModuleState {
    if (this.completed().has(m.id)) return 'done';
    return this.currentModule()?.id === m.id ? 'current' : 'upcoming';
  }

  isAnswered(q: QuestionId): boolean {
    return this.answered().has(q);
  }

  /** Where the hub's Continue button goes. */
  nextTarget(): string[] {
    const m = this.currentModule();
    if (!m) return ['/review'];
    const q = m.questions.find((x) => !this.answered().has(x)) ?? m.questions[0];
    return ['/q', q];
  }

  // ---- mutations -----------------------------------------------------------

  markAnswered(q: QuestionId): void {
    this.answered.update((s) => new Set(s).add(q));
    this.save();
  }

  completeModule(id: ModuleId): void {
    this.completed.update((s) => new Set(s).add(id));
    this.save();
  }

  markSent(): void {
    this.completedAt = new Date().toISOString();
    this.save();
  }

  reset(): void {
    this.answers = demoAnswers();
    this.answered.set(new Set());
    this.completed.set(new Set());
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
