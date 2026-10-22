import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withHashLocation,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { NavDirection } from './data/nav-direction';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
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
