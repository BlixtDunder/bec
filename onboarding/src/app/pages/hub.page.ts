import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FlowState } from '../data/state.service';
import { MODULES, TASK_NAMES } from '../data/flow';
import { DsActions, DsAlert, DsPageHeader, DsScreen, DsTaskBar } from '../ui/layout';
import { DsTimeline, TimelineMilestone } from '../ui/timeline';

@Component({
  selector: 'app-hub',
  imports: [RouterLink, MatButtonModule, DsScreen, DsTaskBar, DsPageHeader, DsAlert, DsActions, DsTimeline],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ds-screen>
      <ds-task-bar title="Your tasks" />
      <ds-page-header [tag]="tag()" title="Update your information" [body]="body()" />
      <ds-alert type="warning" heading="Complete by 15 December 2026">
        After this date, some services may be paused.
      </ds-alert>
      <ds-timeline [milestones]="milestones()" />
      <ds-actions>
        <a matButton="filled" [routerLink]="state.nextTarget()">Continue</a>
      </ds-actions>
    </ds-screen>
  `,
})
export class HubPage {
  protected readonly state = inject(FlowState);

  constructor() {
    this.state.clearEdit();
  }

  protected readonly tag = computed(() => {
    const n = this.state.doneCount();
    return n > 0 ? `${n} of ${MODULES.length} done` : null;
  });

  protected readonly body = computed(() => {
    const intro = 'We’re required by law to know our customers.';
    if (!this.state.started()) {
      const total = MODULES.reduce((s, m) => s + m.minutes, 0);
      return `${intro} About ${total} minutes in total.`;
    }
    const n = this.state.minutesLeft();
    return `${intro} About ${n} ${n === 1 ? 'minute' : 'minutes'} left.`;
  });

  protected readonly milestones = computed<TimelineMilestone[]>(() => {
    // Read the signals so the computed re-evaluates.
    this.state.answered();
    this.state.completed();
    this.state.focus();
    return MODULES.map((m, i) => {
      const st = this.state.moduleState(m);
      const count = m.questions.length;
      const answered = this.state.answeredCount(m);
      const base: TimelineMilestone = {
        number: i + 1,
        title: m.title,
        state: st,
        subtitle:
          st === 'done'
            ? 'Completed'
            : answered > 0
              ? `${answered} of ${count} answered`
              : `${count} ${count === 1 ? 'question' : 'questions'} · About ${m.minutes} min`,
      };
      if (st === 'done') {
        // Completed modules open in edit mode.
        base.link = ['/q', m.questions[0]];
        base.queryParams = { edit: '1' };
        base.chevron = 'right';
      } else {
        // Open modules expand in place; the expanded one shows its questions.
        base.action = () => this.state.setFocus(m.id);
        base.chevron = st === 'current' ? 'up' : 'down';
      }
      if (st === 'current') {
        const firstOpen = this.state.firstOpenQuestion(m);
        base.tag = `About ${m.minutes} min`;
        base.tasks = m.questions.map((q) => ({
          title: TASK_NAMES[q],
          subtitle: 'About 1 min',
          state: this.state.isAnswered(q) ? 'done' : q === firstOpen ? 'next' : 'later',
          link: ['/q', q],
          queryParams: this.state.isAnswered(q) ? { edit: '1' } : undefined,
        }));
      }
      return base;
    });
  });
}
