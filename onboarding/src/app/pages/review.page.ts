import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { FlowState } from '../data/state.service';
import { MODULES } from '../data/flow';
import { summarize } from '../data/summary';
import { DsActions, DsPageHeader, DsScreen, DsTaskBar } from '../ui/layout';
import { DsIcon } from '../ui/icon';

@Component({
  selector: 'app-review',
  imports: [RouterLink, MatButtonModule, MatRippleModule, DsScreen, DsTaskBar, DsPageHeader, DsActions, DsIcon],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <ds-screen>
      <ds-task-bar title="Review" />
      <ds-page-header
        title="Check your answers"
        body="Tap an area to change your answers. Nothing is sent until you confirm."
      />
      <section class="list" aria-labelledby="answers-title">
        <p id="answers-title" class="title-header t-body-medium-medium">Your answers</p>
        <ul>
          @for (m of modules; track m.id) {
            <li>
              <a class="row" matRipple [routerLink]="['/q', m.questions[0]]" [queryParams]="{ edit: 1, from: 'review' }">
                <span class="text">
                  <span class="t-body-large-medium headline">{{ m.title }}</span>
                  <span class="t-body-medium supporting">{{ summary(m.id) }}</span>
                </span>
                <ds-icon name="chevron-right" [size]="16" />
              </a>
            </li>
          }
        </ul>
      </section>
      <ds-actions>
        <button matButton="filled" type="button" (click)="send()">Send to the bank</button>
        <a matButton="text" routerLink="/">Back</a>
      </ds-actions>
    </ds-screen>
  `,
  styles: `
    .list {
      background: var(--md-sys-color-secondary-container);
      border-radius: var(--md-sys-shape-corner-medium);
      overflow: hidden;
    }
    .title-header { margin: 0; padding: var(--space-2) var(--space-2) var(--space-1); color: var(--md-sys-color-on-surface-variant); }
    ul { list-style: none; margin: 0; padding: 0; }
    .row {
      display: flex; align-items: center; gap: var(--space-2);
      min-height: 88px; padding: var(--space-2);
      color: inherit; text-decoration: none; position: relative;
      transition: background-color 120ms ease-out;
    }
    .row:hover { background: color-mix(in srgb, var(--md-sys-color-on-surface) 4%, transparent); }
    .text { align-self: flex-start; flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-0-5); max-width: 288px; }
    .headline { color: var(--md-sys-color-on-surface); }
    .supporting { color: var(--md-sys-color-on-surface-variant); }
    ds-icon { color: var(--md-sys-color-on-surface); margin-left: auto; }
  `,
})
export class ReviewPage {
  private readonly state = inject(FlowState);
  private readonly router = inject(Router);
  protected readonly modules = MODULES;

  protected summary(id: (typeof MODULES)[number]['id']): string {
    return summarize(id, this.state.answers);
  }

  protected send(): void {
    this.state.markSent();
    this.router.navigate(['/sent']);
  }
}
