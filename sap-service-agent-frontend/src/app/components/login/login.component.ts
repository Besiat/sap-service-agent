import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';
import { Tenant } from '../../shared/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  public isLoading = signal(false);
  public tenantsLoading = signal(false);
  public hidePassword = signal(true);
  public tenants = signal<Tenant[]>([]);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    tenantId: ['', [Validators.required]]
  });

  ngOnInit() {
    if (this.authService.checkAuthenticationState()) {
      this.router.navigate(['/']);
      return;
    }

    this.loadTenants();
  }

  private loadTenants() {
    this.tenantsLoading.set(true);
    this.authService.getAllTenants().subscribe({
      next: (response) => {
        this.tenants.set(response.tenants);
        this.tenantsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load tenants:', error);
        this.snackBar.open('Failed to load tenants', 'Close', { duration: 3000 });
        this.tenantsLoading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      
      const loginRequest = this.loginForm.value;
      
      this.authService.login(loginRequest).subscribe({
        next: () => {
          this.isLoading.set(false);
          
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigate([returnUrl]);
          
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Login failed:', error);
          
          let errorMessage = 'Login failed. Please try again.';
          if (error.status === 401) {
            errorMessage = 'Invalid credentials or you don\'t have access to this tenant.';
          } else if (error.status === 400) {
            errorMessage = 'Please check your input and try again.';
          }
          
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
      });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
