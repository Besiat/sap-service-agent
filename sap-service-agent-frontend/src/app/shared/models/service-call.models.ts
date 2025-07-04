export enum ServiceCallStatus {
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface RequestDetails {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
}

export interface ResponseDetails {
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface ServiceCall {
  id: string;
  tenantId: string;
  name: string;
  status: ServiceCallStatus;
  scheduledAt: Date;
  executedAt: Date | null;
  requestDetails: RequestDetails;
  responseDetails?: ResponseDetails;
  createdAt: Date;
}

export interface CreateServiceCallRequest {
  name: string;
  scheduledAt: Date;
  requestDetails: RequestDetails;
}

export interface UpdateServiceCallRequest {
  name?: string;
  scheduledAt?: Date;
  requestDetails?: RequestDetails;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceCallListItem extends ServiceCall {
  isFavorite?: boolean;
}
