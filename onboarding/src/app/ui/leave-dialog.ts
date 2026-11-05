import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface LeaveDialogData {
  section: string;
}

/**
 * Confirm leaving a section before it's completed: answers are only saved per
 * section, so leaving throws them away. Closes with true to leave.
 */
@Component({
  selector: 'ds-leave-dialog',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="title t-headline-small">Leave {{ data.section }}?</h2>
    <p class="body t-body-large">Your answers in this section are only saved when you complete it.</p>
    <div class="actions">
      <button matButton="filled" type="button" cdkFocusInitial (click)="ref.close(false)">Keep going</button>
      <button matButton="text" type="button" (click)="ref.close(true)">Leave without saving</button>
    </div>
  `,
  styles: `
    :host { display: block; padding: var(--space-3); }
    .title { margin: 0 0 var(--space-2); color: var(--md-sys-color-on-surface); }
    .body { margin: 0 0 var(--space-3); color: var(--md-sys-color-on-surface-variant); }
    .actions { display: flex; flex-direction: column; gap: var(--space-1); }
    .actions .mat-mdc-button-base { width: 100%; }
  `,
})
export class DsLeaveDialog {
  protected readonly data = inject<LeaveDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<DsLeaveDialog, boolean>);
}
