import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ErrorHandlerService } from './services/error-handler.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: Error): void {
    const errorHandlerService = this.injector.get(ErrorHandlerService);
    errorHandlerService.handleError(error);
  }
}
