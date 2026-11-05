import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * In-app history for the task bar's back arrow: it returns to the page you came
 * from. Opening a question straight from the hub (or by a link) goes back to the
 * hub; walking the flow goes back one step. The hub starts a fresh history, and
 * returning to the previous page (Save/Cancel on a sub-page, browser back) pops.
 */
@Injectable({ providedIn: 'root' })
export class FlowHistory {
  private readonly router = inject(Router);
  private stack: string[] = [];

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.record(e.urlAfterRedirects));
  }

  /** Where the back arrow goes from the current page. */
  previous(): string {
    return this.stack.length > 1 ? this.stack[this.stack.length - 2] : '/';
  }

  private record(url: string): void {
    const s = this.stack;
    if (url === '/' || url === '') this.stack = ['/'];
    else if (url === s[s.length - 2]) s.pop();
    else if (url !== s[s.length - 1]) s.push(url);
  }
}
