import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Item, EventNotificationGroup, EventType } from './item.model';
import { environment } from '../environments/environment';

const API_BASE = environment.apiUrl;

export interface BackendValidationError {
  [key: string]: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  private readonly PAGE_SIZE = 10;

  constructor(private http: HttpClient) {}

  // Contacts - List
  async getContacts(page: number = 1): Promise<{ items: Item[]; total: number; pageCount: number }> {
    const offset = (page - 1) * this.PAGE_SIZE;
    const url = `${API_BASE}/contacts/?limit=${this.PAGE_SIZE}&offset=${offset}`;

    const data = await firstValueFrom(
      this.http.get<PaginatedResponse<Item>>(url)
    );

    const pageCount = Math.ceil(data.count / this.PAGE_SIZE);
    return {
      items: data.results.map(item => this.toFrontendFormat(item)),
      total: data.count,
      pageCount
    };
  }

  // Contact - Single
  async getContact(id: number | string): Promise<Item> {
    const response = await firstValueFrom(
      this.http.get<Item>(`${API_BASE}/contacts/${id}/`)
    );
    return this.toFrontendFormat(response);
  }

  private readonly NOTIFICATION_GROUP_MAP: { [key: string]: number } = {
    'admin': 1,
    'security': 2,
    'hr': 3,
    'it-support': 4,
    'management': 5,
    'incident-response': 6
  };
  private readonly EVENT_CODE_MAP: { [key: string]: number } = {
    '911': 1,
    'Safewalk': 2,
    'Sos': 3,
    'Timer': 4,
  };

  // Transform frontend payload to backend format
private toBackendFormat(frontendData: any): any {
  // Get all group IDs if 'all' is selected or no selection
  const shouldUseAllGroups = !frontendData.event_notification || frontendData.event_notification === 'all';
  const allGroupIds = Object.values(this.NOTIFICATION_GROUP_MAP).filter(id => id !== 0);
  
  return {
    first_name: frontendData.first_name || '',
    last_name: frontendData.last_name || '',
    email: frontendData.email || '',
    mobile: frontendData.mobile || '',
    event_notification_groups_ids: shouldUseAllGroups 
      ? allGroupIds 
      : frontendData.event_notification_groups?.map((type: string) => this.NOTIFICATION_GROUP_MAP[type] || 0).filter(Boolean) || [],
    event_types_ids: frontendData.eventTypesArray?.map((type: string) => this.EVENT_CODE_MAP[type] || 0).filter(Boolean) || [],
    is_active: frontendData.is_active ?? false
  };
}

  // Transform backend payload to frontend format
  private toFrontendFormat(backendData: any): any {
    return {
      ...backendData,
      eventTypesArray: backendData.event_types?.map((t: any) => t.event_name) || [],
      event_notification: backendData.event_notification_groups?.length ? 'selected' : 'none'
    };
  }

  private handleError(error: any): never {
    if (error.error && typeof error.error === 'object') {
      const errorMessages: string[] = [];
      Object.entries(error.error).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          errorMessages.push(`${field}: ${(messages as string[]).join(', ')}`);
        }
      });
      if (errorMessages.length > 0) {
        throw new Error(errorMessages.join('\n'));
      }
    }
    throw error;
  }

  // Create Contact
  async createContact(contact: any): Promise<Item> {
    try {
      const backendPayload = this.toBackendFormat(contact);
      const response = await firstValueFrom(
        this.http.post<Item>(`${API_BASE}/contacts/`, backendPayload)
      );
      return this.toFrontendFormat(response);
    } catch (error: any) {
      return Promise.reject(this.handleError(error));
    }
  }

  // Update Contact (PATCH)
  async updateContact(id: number | string, contact: any): Promise<Item> {
    try {
      const backendPayload = this.toBackendFormat(contact);
      const response = await firstValueFrom(
        this.http.patch<Item>(`${API_BASE}/contacts/${id}/`, backendPayload)
      );
      return this.toFrontendFormat(response);
    } catch (error: any) {
      return Promise.reject(this.handleError(error));
    }
  }

  // Delete Contact
  async deleteContact(id: number | string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${API_BASE}/contacts/${id}/`)
    );
  }

  // Event Notification Groups
  async getEventGroups(): Promise<EventNotificationGroup[]> {
    const data = await firstValueFrom(
      this.http.get<PaginatedResponse<EventNotificationGroup>>(`${API_BASE}/event-groups/`)
    );
    return data.results;
  }

  // Event Types
  async getEventTypes(): Promise<EventType[]> {
    const data = await firstValueFrom(
      this.http.get<PaginatedResponse<EventType>>(`${API_BASE}/event-types/`)
    );
    return data.results;
  }
}