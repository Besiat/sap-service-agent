/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ResponseDetails } from '@sap-service-agent/service-calls/types/response-details.interface';
import { RequestDetails } from '@sap-service-agent/service-calls/types/service-call-details.interface';
import { ServiceCallService } from 'src/libs';
import { AuthService } from '@sap-service-agent/auth';
import axios, { AxiosResponse, AxiosError } from 'axios';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly serviceCallService: ServiceCallService,
    private readonly authService: AuthService,
  ) {}

  @Interval(
    'processScheduledServiceCalls',
    parseInt(process.env.WORKER_INTERVAL_SECONDS || '30', 10) * 1000,
  )
  private async processScheduledServiceCalls(): Promise<void> {
    try {
      const tenants = await this.authService.getAllTenants();
      const tenantIds = tenants.map((tenant) => tenant.id);

      if (tenantIds.length === 0) {
        return;
      }

      let totalExecutedCalls = 0;

      for (const tenantId of tenantIds) {
        totalExecutedCalls += await this.processTenantScheduledCalls(tenantId);
      }

      if (totalExecutedCalls > 0) {
        this.logger.log(
          `Processed ${totalExecutedCalls} service calls across ${tenantIds.length} tenants`,
        );
      }
    } catch (error) {
      this.logger.error('Error in processScheduledServiceCalls:', error);
    }
  }

  private async processTenantScheduledCalls(tenantId: string): Promise<number> {
    const callsToExecute =
      await this.serviceCallService.getScheduledServiceCalls(tenantId);
    if (callsToExecute.length === 0) {
      return 0;
    }
    this.logger.log(
      `Found ${callsToExecute.length} service calls to execute for tenant ${tenantId}`,
    );
    for (const serviceCall of callsToExecute) {
      await this.executeServiceCall(serviceCall.id, tenantId);
    }
    return callsToExecute.length;
  }

  private async executeServiceCall(
    serviceCallId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      const { requestDetails } =
        await this.serviceCallService.getServiceCallById(
          serviceCallId,
          tenantId,
        );
      await this.serviceCallService.markServiceCallAsRunning(
        serviceCallId,
        tenantId,
      );
      const responseDetails = await this.executeHttpRequest(requestDetails);
      await this.serviceCallService.markServiceCallAsCompleted(
        serviceCallId,
        tenantId,
        responseDetails,
      );
    } catch (error) {
      this.logger.error(
        `Error executing service call ${serviceCallId} for tenant ${tenantId}:`,
        error,
      );
      try {
        await this.serviceCallService.markServiceCallAsFailed(
          serviceCallId,
          tenantId,
        );
      } catch (updateError) {
        this.logger.error(
          `Failed to update service call ${serviceCallId} status to failed:`,
          updateError,
        );
      }
    }
  }

  private isJsonPlaceholderUrl(url: string): boolean {
    return url.includes('jsonplaceholder.typicode.com');
  }

  private async executeHttpRequest(
    requestDetails: RequestDetails,
  ): Promise<ResponseDetails> {
    const { url } = requestDetails;
    if (this.isJsonPlaceholderUrl(url)) {
      return this.makeRealHttpRequest(requestDetails);
    }
    return this.mockHttpRequest();
  }

  private async makeRealHttpRequest(
    requestDetails: RequestDetails,
  ): Promise<ResponseDetails> {
    const { url, method, headers, body } = requestDetails;

    try {
      const axiosResponse: AxiosResponse = await axios({
        method: method.toLowerCase(),
        url,
        headers,
        data: body,
        timeout: 30000,
      });

      return {
        status: axiosResponse.status,
        statusText: axiosResponse.statusText,
        headers: axiosResponse.headers as Record<string, string>,
        body: axiosResponse.data as unknown,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response) {
          return {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers as Record<string, string>,
            body: error.response.data as unknown,
          };
        }
        throw new Error(`HTTP request failed: ${error.message}`);
      }
      throw error;
    }
  }

  private async mockHttpRequest(): Promise<ResponseDetails> {
    // Simulate a some request delay for testing purposes
    await new Promise((resolve) => setTimeout(resolve, 10000));
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: { message: 'Mock response', timestamp: new Date().toISOString() },
    };
  }
}
