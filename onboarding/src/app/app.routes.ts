import { Routes } from '@angular/router';
import { HubPage } from './pages/hub.page';
import { QuestionPage } from './pages/question.page';
import { ReviewPage } from './pages/review.page';
import { SentPage } from './pages/sent.page';
import { TaxCountryPage } from './pages/tax-country.page';
import { ConnectionCountryPage } from './pages/connection-country.page';

export const routes: Routes = [
  { path: '', component: HubPage, title: 'Your tasks' },
  { path: 'q/q4/country', component: TaxCountryPage, title: 'Add a tax country' },
  { path: 'q/q4/country/:index', component: TaxCountryPage, title: 'Edit tax country' },
  { path: 'q/q8/country', component: ConnectionCountryPage, title: 'Add a country' },
  { path: 'q/q8/country/:index', component: ConnectionCountryPage, title: 'Edit country' },
  { path: 'q/:qid', component: QuestionPage },
  { path: 'review', component: ReviewPage, title: 'Review' },
  { path: 'sent', component: SentPage, title: 'Sent' },
  { path: '**', redirectTo: '' },
];
