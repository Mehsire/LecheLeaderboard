import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { Scoreboard } from './scoreboard';
import { TeamOverlay } from './team-overlay';

const routes: Routes = [
  { path: 'scoreboard', component: Scoreboard },
  { path: 'team/:teamId', component: TeamOverlay },
  { path: '', pathMatch: 'full', redirectTo: 'scoreboard' },
  { path: '**', redirectTo: 'scoreboard' },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
  ],
};
