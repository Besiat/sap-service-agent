import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

import { ServiceCallApiService } from '../../core/services/service-call-api.service';
import { ServiceCall, HttpMethod, CreateServiceCallRequest, UpdateServiceCallRequest, ServiceCallStatus } from '../../shared/models/service-call.models';

interface HeaderPair {
    key: string;
    value: string;
}

@Component({
    selector: 'app-service-call-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatRadioModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatTabsModule,
        MatSnackBarModule,
        MatDividerModule,
        MatExpansionModule
    ],
    templateUrl: './service-call-form.component.html',
    styleUrl: './service-call-form.component.scss'
})
export class ServiceCallFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly serviceCallApi = inject(ServiceCallApiService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly snackBar = inject(MatSnackBar);

    loading = signal(false);
    serviceCallId = signal<string | null>(null);
    isEditMode = computed(() => !!this.serviceCallId());
    serviceCall = signal<ServiceCall | null>(null);
    isScheduledInPast = signal(false);

    isServiceCallExecuted = computed(() => {
        const call = this.serviceCall();
        if (!call) return false;

        return call.executedAt !== null;
    });

    serviceCallForm!: FormGroup;
    httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
    activeTab: 'body' | 'headers' = 'body';

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        this.serviceCallId.set(id);

        this.initializeForm();

        if (this.serviceCallId()) {
            this.loadServiceCall();
        }
    }

    private initializeForm() {
        const now = new Date();
        const defaultScheduledTime = new Date(now.getTime() + 60 * 60 * 1000);
        const formattedTime = this.formatDateForInput(defaultScheduledTime);

        this.serviceCallForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            method: ['GET', Validators.required],
            url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
            headers: this.fb.array([]),
            body: [''],
            executionType: ['now', Validators.required],
            scheduledAt: [formattedTime]
        });

        this.serviceCallForm.valueChanges.subscribe(() => {
            this.updateDateValidation();
        });

        this.updateDateValidation();
        this.addHeader();
    }

    private updateDateValidation() {
        const executionType = this.serviceCallForm?.get('executionType')?.value;
        const scheduledAt = this.serviceCallForm?.get('scheduledAt')?.value;

        if (executionType !== 'schedule' || !scheduledAt) {
            this.isScheduledInPast.set(false);
            return;
        }

        const scheduledDate = new Date(scheduledAt);
        const now = new Date();
        this.isScheduledInPast.set(scheduledDate < now);
    }

    private loadServiceCall() {
        const id = this.serviceCallId();
        if (!id) return;

        this.loading.set(true);
        this.serviceCallApi.getServiceCallById(id).subscribe({
            next: (serviceCall) => {
                this.serviceCall.set(serviceCall);
                this.populateForm(serviceCall);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Failed to load service call:', error);
                this.snackBar.open('Failed to load service call', 'Close', { duration: 5000 });
                this.loading.set(false);
                this.router.navigate(['/']);
            }
        });
    }

    private populateForm(serviceCall: ServiceCall) {
        while (this.headersArray.length) {
            this.headersArray.removeAt(0);
        }

        this.serviceCallForm.patchValue({
            name: serviceCall.name,
            method: serviceCall.requestDetails.method,
            url: serviceCall.requestDetails.url,
            body: serviceCall.requestDetails.body ? JSON.stringify(serviceCall.requestDetails.body, null, 2) : '',
            executionType: 'schedule',
            scheduledAt: this.formatDateForInput(new Date(serviceCall.scheduledAt))
        });

        if (serviceCall.requestDetails.headers) {
            Object.entries(serviceCall.requestDetails.headers).forEach(([key, value]) => {
                this.addHeader(key, value);
            });
        } else {
            this.addHeader();
        }

        if (this.isServiceCallExecuted()) {
            this.serviceCallForm.disable();
        }

        this.updateDateValidation();
    }

    get headersArray(): FormArray {
        return this.serviceCallForm.get('headers') as FormArray;
    }

    addHeader(key: string = '', value: string = '') {
        const headerGroup = this.fb.group({
            key: [key],
            value: [value]
        });
        this.headersArray.push(headerGroup);
    }

    removeHeader(index: number) {
        this.headersArray.removeAt(index);
    }

    onSubmit() {
        if (this.serviceCallForm.invalid) {
            this.markFormGroupTouched(this.serviceCallForm);
            this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
            return;
        }

        if (this.isServiceCallExecuted()) {
            this.snackBar.open('Cannot modify an executed service call', 'Close', { duration: 3000 });
            return;
        }

        const formValue = this.serviceCallForm.value;

        const headers: Record<string, string> = {};
        if (formValue.headers && formValue.headers.length > 0) {
            formValue.headers
                .filter((h: HeaderPair) => h.key && h.value)
                .forEach((h: HeaderPair) => {
                    headers[h.key] = h.value;
                });
        }

        let body: any = null;
        if (formValue.body?.trim()) {
            try {
                body = JSON.parse(formValue.body);
            } catch (error) {
                this.snackBar.open('Invalid JSON in request body', 'Close', { duration: 3000 });
                return;
            }
        }

        const scheduledAt = formValue.executionType === 'now'
            ? new Date()
            : new Date(formValue.scheduledAt);

        const serviceCallData = {
            name: formValue.name,
            scheduledAt,
            requestDetails: {
                url: formValue.url,
                method: formValue.method,
                headers: Object.keys(headers).length > 0 ? headers : undefined,
                body
            }
        };

        this.loading.set(true);

        if (this.isEditMode()) {
            this.updateServiceCall(serviceCallData);
        } else {
            this.createServiceCall(serviceCallData);
        }
    }

    private createServiceCall(data: CreateServiceCallRequest) {
        this.serviceCallApi.createServiceCall(data).subscribe({
            next: (serviceCall) => {
                this.snackBar.open('Service call created successfully', 'Close', { duration: 3000 });
                this.loading.set(false);
                this.router.navigate(['/']);
            },
            error: (error) => {
                console.error('Failed to create service call:', error);
                this.snackBar.open('Failed to create service call', 'Close', { duration: 5000 });
                this.loading.set(false);
            }
        });
    }

    private updateServiceCall(data: UpdateServiceCallRequest) {
        const id = this.serviceCallId();
        if (!id) return;


        const updateData = {
            name: data.name,
            scheduledAt: data.scheduledAt,
            requestDetails: data.requestDetails
        };

        this.serviceCallApi.updateServiceCall(id, updateData).subscribe({
            next: (serviceCall) => {
                this.snackBar.open('Service call updated successfully', 'Close', { duration: 3000 });
                this.loading.set(false);
                this.router.navigate(['/']);
            },
            error: (error) => {
                console.error('Failed to update service call:', error);
                this.snackBar.open('Failed to update service call', 'Close', { duration: 5000 });
                this.loading.set(false);
            }
        });
    }

    onCancel() {
        this.router.navigate(['/']);
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            } else if (control instanceof FormArray) {
                control.controls.forEach(arrayControl => {
                    if (arrayControl instanceof FormGroup) {
                        this.markFormGroupTouched(arrayControl);
                    } else {
                        arrayControl.markAsTouched();
                    }
                });
            } else {
                control?.markAsTouched();
            }
        });
    }

    formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    getFieldError(fieldName: string): string {
        const control = this.serviceCallForm.get(fieldName);
        if (control?.errors && control.touched) {
            if (control.errors['required']) return `${fieldName} is required`;
            if (control.errors['minlength']) return `${fieldName} is too short`;
            if (control.errors['pattern']) return `Invalid ${fieldName} format`;
        }
        return '';
    }

    formatResponseBody(body: any): string {
        if (!body) return '';
        return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    }

    formatResponseHeaders(headers: Record<string, string> | undefined): string {
        if (!headers) return '';
        return Object.entries(headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
    }
}
