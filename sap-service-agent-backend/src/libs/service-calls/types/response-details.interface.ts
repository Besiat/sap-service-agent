export interface ResponseDetails {
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  body?: any;
}
