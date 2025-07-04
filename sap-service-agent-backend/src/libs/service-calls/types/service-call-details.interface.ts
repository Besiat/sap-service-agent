import { HttpMethod } from './http-method.type';

export interface RequestDetails {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
}
