import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ServiceCallFormComponent } from './components/service-call-form/service-call-form.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'service-calls/new', component: ServiceCallFormComponent, canActivate: [authGuard] },
  { path: 'service-calls/:id/edit', component: ServiceCallFormComponent, canActivate: [authGuard] },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
