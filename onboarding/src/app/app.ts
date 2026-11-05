import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
export class App {}
