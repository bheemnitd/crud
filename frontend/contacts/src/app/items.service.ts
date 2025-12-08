import { Injectable } from '@angular/core';
import { Item, EventNotificationGroup, EventType } from './item.model';

const API_BASE = 'http://localhost:8000/api';

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
  private PAGE_SIZE = 10;

  // Contacts
  async getContacts(page: number = 1): Promise<{ items: Item[]; total: number; pageCount: number }> {
    const offset = (page - 1) * this.PAGE_SIZE;
    const url = `${API_BASE}/contacts/?limit=${this.PAGE_SIZE}&offset=${offset}`;
    
    const res = await fetch(url, { 
      headers: { 'Accept': 'application/json' } 
    });
    
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
    const data = await res.json() as PaginatedResponse<Item>;
    
    const pageCount = Math.ceil(data.count / this.PAGE_SIZE);
    return { 
      items: data.results, 
      total: data.count, 
      pageCount 
    };
  }

  async getContact(id: number | string): Promise<Item> {
    const res = await fetch(`${API_BASE}/contacts/${id}/`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`Error fetching item ${id}:`, res.status, error);
      throw new Error(`Failed to fetch item: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Item data received:', data);
    return data;
  }

  async createContact(contact: Partial<Item>): Promise<Item> {
    const res = await fetch(`${API_BASE}/contacts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(contact)
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Create contact error:', error);
      throw new Error(`Failed to create contact: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }

  async updateContact(id: number | string, contact: Partial<Item>): Promise<Item> {
    const res = await fetch(`${API_BASE}/contacts/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(contact)
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Update contact error:', error);
      throw new Error(`Failed to update contact: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }

  async deleteContact(id: number | string): Promise<void> {
    const res = await fetch(`${API_BASE}/contacts/${id}/`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.error('Delete contact error:', error);
      throw new Error(`Failed to delete contact: ${res.status} ${res.statusText}`);
    }
  }

  // Event Notification Groups
  async getEventGroups(): Promise<EventNotificationGroup[]> {
    const res = await fetch(`${API_BASE}/event-groups/`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) throw new Error(`Failed to fetch event groups: ${res.status}`);
    const data = await res.json() as PaginatedResponse<EventNotificationGroup>;
    return data.results;
  }

  // Event Types
  async getEventTypes(): Promise<EventType[]> {
    const res = await fetch(`${API_BASE}/event-types/`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) throw new Error(`Failed to fetch event types: ${res.status}`);
    const data = await res.json() as PaginatedResponse<EventType>;
    return data.results;
  }
}