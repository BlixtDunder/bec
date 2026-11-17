import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

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
  constructor() {
    // After each in-app navigation (not the first load), move focus to the new page's heading.
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd), skip(1))
      .subscribe(() => setTimeout(() => document.querySelector<HTMLElement>('h1[tabindex="-1"]')?.focus(), 400));
  }
}
