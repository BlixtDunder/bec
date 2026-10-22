import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { DsIcon } from './icon';
import { DsTag } from './layout';

export interface TimelineTask {
  title: string;
  subtitle: string;
  state: 'done' | 'next' | 'later';
  link: unknown[];
  queryParams?: Record<string, string>;
}

export interface TimelineMilestone {
  number: number;
  title: string;
  subtitle: string;
  state: 'done' | 'current' | 'upcoming';
  tag?: string;
  link?: unknown[];
  queryParams?: Record<string, string>;
  /** Instead of navigating, run this (used to expand a module on the hub). */
  action?: () => void;
  /** Chevron direction: right = navigate (done modules), down = expand, up = expanded. */
  chevron?: 'right' | 'down' | 'up';
  tasks?: TimelineTask[];
}

/**
 * Hub timeline card: vertical stepper with 40px markers on a 2px rail.
 * Milestone rows are 76px (marker 40 + 4 gap + 32 line), the last one 52px.
 * The current module expands into 88px task rows with small markers on the rail.
 */
@Component({
  selector: 'ds-timeline',
  imports: [RouterLink, MatRippleModule, DsIcon, DsTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="timeline">
      @for (m of milestones(); track m.number; let last = $last) {
        <li class="milestone-block" [class.last]="last">
          <a
            class="milestone"
            [class.current]="m.state === 'current'"
            [class.static]="!m.link && !m.action"
            [routerLink]="m.action ? null : (m.link ?? null)"
            [queryParams]="m.action ? null : (m.queryParams ?? null)"
            [attr.href]="m.action ? '' : null"
            (click)="onMilestone($event, m)"
            [attr.role]="m.action ? 'button' : null"
            [attr.aria-expanded]="m.action || m.state === 'current' ? m.state === 'current' : null"
            [attr.aria-label]="m.title + ', ' + (m.state === 'done' ? 'completed' : m.subtitle)"
          >
            <span class="rail">
              <span class="marker" [class]="m.state">
                @if (m.state === 'done') {
                  <ds-icon name="check" [size]="24" />
                } @else {
                  <span class="t-title-medium">{{ m.number }}</span>
                }
              </span>
              @if (!last && m.state !== 'current') {
                <span class="line"></span>
              }
            </span>
            <span class="body" matRipple [matRippleDisabled]="!m.link && !m.action">
              <span class="text">
                <span class="header">
                  <span class="title t-title-medium">{{ m.title }}</span>
                  @if (m.tag) {
                    <ds-tag tone="primary">{{ m.tag }}</ds-tag>
                  }
                </span>
                @if (m.state !== 'current') {
                  <span class="subtitle t-body-medium">{{ m.subtitle }}</span>
                }
              </span>
              @if (m.link || m.action) {
                <ds-icon
                  [name]="(m.chevron ?? 'right') === 'right' ? 'chevron-right' : 'chevron-down'"
                  [size]="16"
                  class="chevron"
                  [class.up]="m.chevron === 'up'"
                />
              }
            </span>
          </a>
          @if (m.state === 'current' && m.tasks?.length) {
            <ol class="tasks" [class.last]="last">
              <span class="tasks-line"></span>
              @for (t of m.tasks; track t.title) {
                <li>
                  <a class="task" [routerLink]="t.link" [queryParams]="t.queryParams ?? null" matRipple>
                    <span class="sub-marker">
                      @if (t.state === 'done') {
                        <span class="done-disc"><ds-icon name="checkmark-round" [size]="16" /></span>
                      } @else {
                        <span class="dot" [class.next]="t.state === 'next'"></span>
                      }
                    </span>
                    <span class="task-item">
                      <span class="text">
                        <span class="t-body-large-medium title">{{ t.title }}</span>
                        <span class="t-body-medium subtitle">{{ t.subtitle }}</span>
                      </span>
                      <ds-icon name="chevron-right" [size]="16" class="chevron" />
                    </span>
                  </a>
                </li>
              }
            </ol>
          }
        </li>
      }
    </ol>
  `,
  styles: `
    :host {
      display: block;
      background: var(--md-sys-color-secondary-container);
      border-radius: var(--md-sys-shape-corner-medium);
      padding: var(--space-2);
    }
    ol { list-style: none; margin: 0; padding: 0; }
    a { color: inherit; text-decoration: none; }
    .milestone { display: flex; gap: var(--space-2); min-height: 76px; border-radius: 8px; }
    .milestone.current, .last > .milestone { min-height: 0; }
    .milestone.static { cursor: default; }
    .rail {
      width: 40px; flex: none;
      display: flex; flex-direction: column; align-items: center; gap: var(--space-0-5);
    }
    .marker {
      width: 40px; height: 40px; border-radius: 50%; flex: none;
      display: flex; align-items: center; justify-content: center;
    }
    .marker.done { background: var(--md-sys-color-success-container); color: var(--md-sys-color-success); }
    .marker.current { background: var(--md-sys-color-primary); color: var(--md-sys-color-inverse-on-surface); }
    .marker.upcoming { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-surface); }
    .line { width: 2px; flex: 1; background: var(--md-sys-color-outline); }
    .body {
      flex: 1; min-width: 0; position: relative;
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-0-5) var(--space-2) var(--space-3) 0;
      align-self: stretch;
      border-radius: 8px;
    }
    .milestone.current .body { padding-bottom: var(--space-1-5); }
    .last > .milestone .body { padding-bottom: 0; }
    .last > .milestone.current .body { padding-bottom: var(--space-1-5); }
    .text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-0-5); align-self: flex-start; }
    .header { display: flex; align-items: center; gap: var(--space-1); min-height: 24px; }
    .title { color: var(--md-sys-color-on-surface); flex: 1; min-width: 0; }
    .subtitle { color: var(--md-sys-color-on-surface-variant); }
    .chevron { color: var(--md-sys-color-on-surface); transition: transform 200ms ease; }
    .chevron.up { transform: rotate(180deg); }
    .tasks { animation: expand 220ms cubic-bezier(0.2, 0, 0, 1); transform-origin: top; }
    @keyframes expand {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) { .tasks, .chevron { animation: none; transition: none; } }

    .tasks { position: relative; padding-bottom: var(--space-1); }
    .tasks-line {
      position: absolute; left: 19px; top: 0; bottom: 0; width: 2px;
      background: var(--md-sys-color-outline);
    }
    .tasks.last { padding-bottom: 0; }
    .tasks.last .tasks-line { bottom: 44px; }
    .task { display: flex; align-items: center; gap: var(--space-2); position: relative; border-radius: 8px; }
    .sub-marker {
      width: 40px; height: 16px; flex: none; position: relative; z-index: 1;
      display: flex; align-items: center; justify-content: center;
    }
    .dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--md-sys-color-secondary-container);
      box-shadow: inset 0 0 0 2px var(--md-sys-color-outline);
    }
    .dot.next { background: var(--md-sys-color-primary); box-shadow: none; }
    .done-disc {
      width: 16px; height: 16px; border-radius: 50%;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-success);
      display: flex;
    }
    .task-item {
      flex: 1; min-width: 0;
      display: flex; align-items: center; gap: var(--space-2);
      min-height: 88px;
      padding: var(--space-2) var(--space-2) var(--space-2) 0;
    }
    .task:hover .task-item, .milestone:not(.static):hover .body {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 4%, transparent);
    }
  `,
})
export class DsTimeline {
  readonly milestones = input.required<TimelineMilestone[]>();

  protected onMilestone(e: Event, m: TimelineMilestone): void {
    if (!m.action) return;
    e.preventDefault();
    m.action();
  }
}
