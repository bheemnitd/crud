import { Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(
    private injector: Injector
  ) {}

  handleError(error: Error | HttpErrorResponse): void {
    const router = this.injector.get(Router);
    const toastr = this.injector.get(ToastrService);

    if (error instanceof HttpErrorResponse) {
      // Server-side error
      if (!navigator.onLine) {
        toastr.error('No Internet Connection');
      } else {
        // Handle HTTP errors
        switch (error.status) {
          case 400:
            this.handleBadRequest(error);
            break;
          case 401:
            toastr.error('Unauthorized access');
            router.navigate(['/login']);
            break;
          case 403:
            toastr.error('Access denied');
            break;
          case 404:
            toastr.error('The requested resource was not found');
            break;
          case 422: // Validation error
            this.handleValidationError(error);
            break;
          case 500:
            toastr.error('Internal server error occurred');
            break;
          default:
            toastr.error('An error occurred. Please try again later');
        }
      }
    } else {
      // Client-side error
      console.error('Client error:', error);
      toastr.error('An unexpected error occurred');
    }
  }

  private handleBadRequest(error: HttpErrorResponse): void {
    const toastr = this.injector.get(ToastrService);
    if (error.error?.email) {
      toastr.error(error.error.email[0]);
    } else {
      toastr.error('Invalid request. Please check your input');
    }
  }

  private handleValidationError(error: HttpErrorResponse): void {
    const toastr = this.injector.get(ToastrService);
    const messages = [];

    if (error.error?.errors) {
      for (const key in error.error.errors) {
        if (error.error.errors.hasOwnProperty(key)) {
          messages.push(...error.error.errors[key]);
        }
      }
      toastr.error(messages.join('<br>'), 'Validation Error', {
        enableHtml: true
      });
    } else {
      toastr.error('Please correct the validation errors');
    }
  }
}
