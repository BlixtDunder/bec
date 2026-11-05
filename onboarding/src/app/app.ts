import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FlowHistory } from './data/flow-history';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<div class="app-column"><router-outlet /></div>`,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .app-column {
      width: 100%;
      max-width: 420px;
      min-height: 100dvh;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }
  `,
})
export class App {
  // Start recording from the first navigation, so the back arrow knows where you came from.
  private readonly history = inject(FlowHistory);
}
