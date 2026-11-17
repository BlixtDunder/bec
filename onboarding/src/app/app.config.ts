import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withHashLocation,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { Injectable } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Title } from '@angular/platform-browser';

/** Route titles read "<page> – Nykredit". */
@Injectable({ providedIn: 'root' })
class NykreditTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  override updateTitle(state: RouterStateSnapshot): void {
    const t = this.buildTitle(state);
    if (t) this.title.setTitle(`${t} – Nykredit`);
  }
}
import { NavDirection } from './data/nav-direction';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: TitleStrategy, useClass: NykreditTitleStrategy },
    provideRouter(
      routes,
      withHashLocation(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withViewTransitions({
        skipInitialTransition: true,
        // iOS-style push/pop: the direction is applied to <html> for the CSS in styles.scss.
        onViewTransitionCreated: ({ transition }) => {
          const root = document.documentElement;
          root.dataset['nav'] = inject(NavDirection).take();
          transition.finished.finally(() => delete root.dataset['nav']);
        },
      }),
    ),
  ],
};
