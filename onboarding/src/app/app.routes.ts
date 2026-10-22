import { Routes } from '@angular/router';
import { HubPage } from './pages/hub.page';
import { QuestionPage } from './pages/question.page';
import { ReviewPage } from './pages/review.page';
import { SentPage } from './pages/sent.page';

export const routes: Routes = [
  { path: '', component: HubPage, title: 'Your tasks' },
  { path: 'q/:qid', component: QuestionPage },
  { path: 'review', component: ReviewPage, title: 'Review' },
  { path: 'sent', component: SentPage, title: 'Sent' },
  { path: '**', redirectTo: '' },
];
