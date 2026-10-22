import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FlowState } from '../data/state.service';
import { MODULES } from '../data/flow';
import { DsActions, DsPageHeader, DsScreen, DsTaskBar } from '../ui/layout';
import { DsTimeline, TimelineMilestone } from '../ui/timeline';

@Component({
  selector: 'app-sent',
  imports: [MatButtonModule, DsScreen, DsTaskBar, DsPageHeader, DsActions, DsTimeline],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ds-screen>
      <ds-task-bar title="Your tasks" [closeAction]="backToOverview" />
      <ds-page-header
        [tag]="modules.length + ' of ' + modules.length + ' done'"
        title="Thanks, we’ve got your information"
        body="We’ll let you know if we need anything else. Next update: October 2028."
      />
      <ds-timeline [milestones]="milestones" />
      <ds-actions>
        <button matButton="filled" type="button" (click)="backToOverview()">Back to overview</button>
      </ds-actions>
    </ds-screen>
  `,
})
export class SentPage {
  private readonly state = inject(FlowState);
  private readonly router = inject(Router);
  protected readonly modules = MODULES;

  private readonly date = new Date(this.state.completedAt ?? Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  protected readonly milestones: TimelineMilestone[] = MODULES.map((m, i) => ({
    number: i + 1,
    title: m.title,
    subtitle: `Completed ${this.date}`,
    state: 'done',
  }));

  protected readonly backToOverview = () => {
    this.state.reset();
    this.router.navigate(['/']);
  };
}
