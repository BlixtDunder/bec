import { ChangeDetectionStrategy, Component, ElementRef, input, model, signal, viewChild } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { UploadedFile } from '../data/flow';
import { DsIcon } from './icon';

let fileSeq = 0;

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * DS File upload / Upload card: header (label/X-large + body/medium hint),
 * Dropzone (TertiaryContainer, radius 12, padding 32/16) and File item rows.
 */
@Component({
  selector: 'ds-upload-card',
  imports: [DsIcon, MatProgressSpinnerModule, MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="header">
      <p class="t-label-xlarge heading">{{ heading() }}</p>
      <p class="t-body-medium hint">{{ hint() }}</p>
    </div>
    <div class="upload-area">
      <label
        class="dropzone"
        matRipple
        [class.dragging]="dragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="dragging.set(false)"
        (drop)="onDrop($event)"
      >
        <input
          #fileInput
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          (change)="onPick($event)"
        />
        <ds-icon name="upload" [size]="32" class="upload-icon" />
        <span class="text">
          <span class="label"><span class="link">Click to upload</span> or drag and drop</span>
          <span class="formats t-body-small">JPG, PNG, PDF, Word, Excel or TXT</span>
        </span>
      </label>
    </div>
    @if (files().length) {
      <ul class="files">
        @for (f of files(); track f.id) {
          <li class="file reveal">
            <span class="leading">
              @if (f.status === 'uploading') {
                <mat-progress-spinner mode="indeterminate" [diameter]="20" [strokeWidth]="2" />
              } @else {
                <ds-icon name="documents" [size]="24" />
              }
            </span>
            <span class="file-text">
              <span class="name t-body-large-medium">{{ f.name }}</span>
              <span class="status t-body-medium">
                {{ f.status === 'uploading' ? 'Uploading…' : 'Uploaded · ' + size(f.size) }}
              </span>
            </span>
            <button class="icon-btn" type="button" (click)="remove(f.id)" [attr.aria-label]="'Delete ' + f.name">
              <span class="container" matRipple [matRippleCentered]="true"><ds-icon name="bin" [size]="16" /></span>
            </button>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
      background: var(--md-sys-color-secondary-container);
      border-radius: var(--md-sys-shape-corner-medium);
      overflow: hidden;
    }
    p { margin: 0; }
    .header {
      display: flex; flex-direction: column; gap: var(--space-0-5);
      padding: var(--space-2);
    }
    .heading { color: var(--md-sys-color-on-surface); }
    .hint { color: var(--md-sys-color-on-surface-variant); }
    .upload-area { padding: 0 var(--space-2) var(--space-2); }
    .dropzone {
      position: relative; overflow: hidden;
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-1);
      padding: var(--space-4) var(--space-2);
      background: var(--md-sys-color-tertiary-container);
      border-radius: var(--md-sys-shape-corner-medium);
      cursor: pointer;
      text-align: center;
      outline: 2px dashed transparent; outline-offset: -2px;
      transition: outline-color 120ms ease-out, background-color 120ms ease-out;
    }
    .dropzone.dragging {
      outline-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-primary-container);
    }
    .dropzone:has(input:focus-visible) { outline: 2px solid var(--md-sys-color-primary); }
    input[type='file'] { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
    .upload-icon { color: var(--md-sys-color-primary); }
    .text { display: flex; flex-direction: column; gap: var(--space-1); }
    .label {
      font-size: 16px; line-height: 24px; font-weight: 400; letter-spacing: 0.15px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .link { font-weight: 500; color: var(--md-sys-color-primary); text-decoration: underline; text-underline-offset: 2px; }
    .formats { color: var(--md-sys-color-on-surface-variant); }
    .files { list-style: none; margin: 0; padding: 0; }
    .file {
      display: flex; align-items: center; gap: var(--space-2);
      min-height: 80px;
      padding: var(--space-2) var(--space-1) var(--space-2) var(--space-2);
    }
    .leading { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex: none; color: var(--md-sys-color-on-surface); }
    .file-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-0-5); }
    .name { color: var(--md-sys-color-on-surface); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .status { color: var(--md-sys-color-on-surface-variant); }
    .icon-btn {
      width: 48px; height: 48px; flex: none; border: 0; background: none; padding: 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center; color: var(--md-sys-color-on-surface);
    }
    .container {
      width: 40px; height: 40px; border-radius: 50%; position: relative; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }
    .icon-btn:hover .container { background: color-mix(in srgb, currentColor 8%, transparent); }
  `,
})
export class DsUploadCard {
  readonly heading = input.required<string>();
  readonly hint = input.required<string>();
  readonly files = model<UploadedFile[]>([]);

  protected readonly dragging = signal(false);
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  protected readonly size = formatSize;

  protected onPick(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.add(input.files);
    input.value = '';
  }

  protected onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    this.add(e.dataTransfer?.files ?? null);
  }

  protected remove(id: string): void {
    this.files.update((list) => list.filter((f) => f.id !== id));
  }

  private add(list: FileList | null): void {
    if (!list?.length) return;
    const added: UploadedFile[] = [...list].map((f) => ({
      id: `u${Date.now()}-${fileSeq++}`,
      name: f.name,
      size: f.size,
      status: 'uploading',
    }));
    this.files.update((cur) => [...cur, ...added]);
    for (const f of added) {
      const delay = 900 + Math.random() * 900;
      setTimeout(() => {
        this.files.update((cur) => cur.map((x) => (x.id === f.id ? { ...x, status: 'uploaded' } : x)));
      }, delay);
    }
  }
}
