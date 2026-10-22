import { Injectable } from '@angular/core';

export type NavDir = 'forward' | 'back';

/**
 * Direction of the next route change, used by the iOS-style page transition.
 * Navigations are "forward" (push: new page slides in from the right) unless a
 * back action marks them first (pop: current page slides out to the right).
 */
@Injectable({ providedIn: 'root' })
export class NavDirection {
  private nextDir: NavDir = 'forward';

  back(): void {
    this.nextDir = 'back';
  }

  /** Read and reset (called once per view transition). */
  take(): NavDir {
    const d = this.nextDir;
    this.nextDir = 'forward';
    return d;
  }
}
