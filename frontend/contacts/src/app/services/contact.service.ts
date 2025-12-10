import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:8000/api'}`;

  constructor(private http: HttpClient) { }

  getGroups(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/event-groups/`);
  }

  async createContact(contact: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/contacts/`, contact)
      );
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      if (error.error && typeof error.error === 'object') {
        // Handle email already exists error
        if (error.error.email && Array.isArray(error.error.email)) {
          return {
            success: false,
            error: error.error.email[0]
          };
        }
        // Handle other validation errors
        const errorMessages = Object.entries(error.error)
          .map(([field, messages]) => 
            Array.isArray(messages) 
              ? `${field}: ${(messages as string[]).join(', ')}`
              : `${field}: ${messages}`
          )
          .join('\n');
        return {
          success: false,
          error: errorMessages
        };
      }
      // Handle other types of errors
      return {
        success: false,
        error: error.message || 'An unknown error occurred'
      };
    }
  }
}
