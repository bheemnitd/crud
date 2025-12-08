import { Component, signal, OnInit, ChangeDetectorRef, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ItemsService } from './items.service';
import { EventType } from './item.model';
import { Item } from './item.model';
import { filter } from 'rxjs/operators';

interface Country {
  code: string;
  name: string;
  dial_code: string;
}

const DEFAULT_NOTIFICATION_GROUPS: Array<{ id: string; name: string }> = [
  { id: 'admin', name: 'Admin' },
  { id: 'security', name: 'Security' },
  { id: 'hr', name: 'HR' },
  { id: 'it-support', name: 'IT Support' },
  { id: 'management', name: 'Management' },
  { id: 'incident-response', name: 'Incident Response' }
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit {

  
  protected readonly title = signal('contacts');
  items: Item[] = [];
  filteredItems: Item[] = [];
  loading = false;
  search = '';
  status = 'all';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  showCreateForm = false;
  newItem: Partial<Item> & { event_notification?: 'all' | 'selected' | 'none', eventTypesArray?: string[] } = { 
    is_active: true,
    event_notification: 'all',
    eventTypesArray: []
  };
  notificationGroup: string = '';
  uniqueFirstNames: string[] = [];
  formError: string | null = null;
  formSaving = false;
  successMessage: string | null = null;
  showRouteOutlet = true;
  selectedCountryCode = '+1';
  mobileNumber = '';
  
  // Notification groups properties
  selectedGroups: Array<{id: string; name: string}> = [];
  groupSearch = '';
  loadingGroups = false;
  filteredGroups: Array<{id: string, name: string, isNew?: boolean}> = [];
  allGroups: Array<{id: string, name: string}> = [];

  countries: Country[] = [
    { code: 'US', name: 'United States', dial_code: '+1' },
    { code: 'IN', name: 'India', dial_code: '+91' },
    { code: 'GB', name: 'United Kingdom', dial_code: '+44' },
    { code: 'CA', name: 'Canada', dial_code: '+1' },
    { code: 'AU', name: 'Australia', dial_code: '+61' },
    { code: 'DE', name: 'Germany', dial_code: '+49' },
    { code: 'FR', name: 'France', dial_code: '+33' },
    { code: 'JP', name: 'Japan', dial_code: '+81' },
    { code: 'CN', name: 'China', dial_code: '+86' },
    { code: 'BR', name: 'Brazil', dial_code: '+55' }
  ];

constructor(
  private itemsService: ItemsService,
  private router: Router,
  private cd: ChangeDetectorRef,
  private ngZone: NgZone,
  @Inject(PLATFORM_ID) private platformId: Object,
  private http: HttpClient
) { }
  // Load country codes from API or use defaults
  private async loadCountryCodes(): Promise<void> {
    try {
      const response = await fetch('https://gist.githubusercontent.com/anubhavshrimal/75f6183458db8c453306f93521e93d37/raw/CountryCodes.json');
      const countries = await response.json();
      this.countries = countries;
    } catch (error) {
      console.error('Error loading country codes:', error);
      // Keep the default countries if API call fails
    }
  }


  async loadNotificationGroups(): Promise<void> {
    this.loadingGroups = true;
    try {
      // Load persisted groups from sessionStorage
      if (isPlatformBrowser(this.platformId)) {
        const raw = sessionStorage.getItem('allNotificationGroups');
        if (raw) {
          try {
            this.allGroups = JSON.parse(raw) || [];
          } catch (e) {
            console.warn('Failed to parse stored groups:', e);
          }
        }
        if (!this.allGroups || this.allGroups.length === 0) {
          this.allGroups = [...DEFAULT_NOTIFICATION_GROUPS];
          try {
            sessionStorage.setItem('allNotificationGroups', JSON.stringify(this.allGroups));
          } catch {}
        }
      }
      this.filteredGroups = [...this.allGroups];
    } catch (error) {
      console.error('Error loading notification groups:', error);
    } finally {
      this.loadingGroups = false;
    }
  }

  filterGroups(): void {
    const searchTerm = this.groupSearch.trim().toLowerCase();
    const selectedGroupIds = this.selectedGroups.map(g => g.id);

    if (!searchTerm) {
      // If no search term, show all groups that aren't selected
      this.filteredGroups = this.allGroups.filter(
        group => !selectedGroupIds.includes(group.id)
      );
    } else {
      // Filter groups by search term and exclude already selected ones
      this.filteredGroups = this.allGroups.filter(group =>
        group.name.toLowerCase().includes(searchTerm) &&
        !selectedGroupIds.includes(group.id)
      );

      // If no groups match, show an option to create a new one
      if (this.filteredGroups.length === 0 && searchTerm) {
        this.filteredGroups = [{
          id: searchTerm.toLowerCase().replace(/\s+/g, '-'),
          name: searchTerm,
          isNew: true
        }];
      }
    }
  }

  selectGroup(group: {id: string, name: string, isNew?: boolean}): void {
    if (!this.selectedGroups.some(g => g.id === group.id)) {
      this.selectedGroups = [...this.selectedGroups, { id: group.id, name: group.name }];
      this.groupSearch = '';
      this.filterGroups();
    }
  }

  removeGroup(groupId: string): void {
    this.selectedGroups = this.selectedGroups.filter(group => group.id !== groupId);
  }

  getGroupName(groupId: string | { id: string; name: string }): string {
    if (typeof groupId === 'object') {
      return groupId.name;
    }
    const group = this.allGroups.find(g => g.id === groupId);
    return group ? group.name : groupId;
  }

  onEnterKey(): void {
    if (this.groupSearch.trim() && this.filteredGroups.length > 0) {
      this.selectGroup(this.filteredGroups[0]);
    } else if (this.groupSearch.trim()) {
      // Optional: Create a new group if no match found
      this.createNewGroup(this.groupSearch);
    }
  }

  onInputBlur(): void {
    // Keep list visible; do not clear on blur
  }

  onNotificationModeChange(mode: 'all' | 'selected'): void {
    if (mode === 'selected') {
      this.filteredGroups = [...this.allGroups];
    } else {
      this.filteredGroups = [];
      this.groupSearch = '';
    }
  }

  private createNewGroup(name: string): void {
    const newGroup = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name
    };
    
    // Add to all groups if it doesn't exist
    if (!this.allGroups.some(g => g.id === newGroup.id)) {
      this.allGroups = [...this.allGroups, newGroup];
      
      // Persist groups
      if (isPlatformBrowser(this.platformId)) {
        try {
          sessionStorage.setItem('allNotificationGroups', JSON.stringify(this.allGroups));
        } catch (e) {
          console.error('Error saving groups to sessionStorage:', e);
        }
      }
    }
    
    // Select the group
    this.selectGroup(newGroup);
  }

  // When loading an item, initialize eventTypesArray from event_types
  private initializeEventTypesArray() {
    if (this.newItem.event_types && this.newItem.event_types.length > 0) {
      this.newItem.eventTypesArray = this.newItem.event_types.map(et => et.event_name);
    } else {
      this.newItem.eventTypesArray = [];
    }
  }

  updateEventTypes(eventTypeName: string, isChecked: boolean): void {
    if (!this.newItem.eventTypesArray) {
      this.newItem.eventTypesArray = [];
    }

    if (isChecked) {
      if (!this.newItem.eventTypesArray.includes(eventTypeName)) {
        this.newItem.eventTypesArray = [...this.newItem.eventTypesArray, eventTypeName];
        
        if (!this.newItem.event_types) {
          this.newItem.event_types = [];
        }
        
        if (!this.newItem.event_types.some(et => et.event_name === eventTypeName)) {
          this.newItem.event_types = [
            ...this.newItem.event_types,
            { event_name: eventTypeName }
          ];
        }
      }
    } else {
      this.newItem.eventTypesArray = this.newItem.eventTypesArray.filter(t => t !== eventTypeName);
      
      if (this.newItem.event_types) {
        this.newItem.event_types = this.newItem.event_types.filter(
          et => et.event_name !== eventTypeName
        );
      }
    }
    
    // Trigger change detection
    this.cd.detectChanges();
  }

  async ngOnInit(): Promise<void> {
    // Check if current route is not the landing page
    if (!this.isLandingPage()) {
      await this.loadNotificationGroups();
    }

    // Check for flash message set by other components (ItemFormComponent)
    if (isPlatformBrowser(this.platformId)) {
      const flash = sessionStorage.getItem('flashMessage');
      if (flash) {
        this.successMessage = flash;
      }
    }

    // Subscribe to router events to update the outlet visibility
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateOutletVisibility(event.url);
      }
    });

    // Initial check for the current route
    this.updateOutletVisibility(this.router.url);

    // Load initial data
    this.reload();
  }

  private updateOutletVisibility(url: string) {
    // hide router-outlet when exactly at '/items' so we don't render the ItemsComponent below the App's inline list
    const clean = url?.split('?')[0] || '';
    this.showRouteOutlet = !(clean === '/items' || clean === '/items/' || clean === '/');
    this.cd.markForCheck();
  }

async reload() {
  this.loading = true;
  this.cd.markForCheck();

  console.log('%cApp.reload() started – Page ' + this.currentPage, 
    'color: #0066cc; font-weight: bold; font-size: 14px;');

  try {
    const result = await this.itemsService.getContacts(this.currentPage);

    this.ngZone.run(() => {
      this.items = result.items;
      this.totalItems = result.total;
      this.totalPages = result.pageCount;

      // Extract unique first names (cleaner way)
      this.uniqueFirstNames = Array.from(
        new Set(this.items.map(item => item.first_name).filter(Boolean))
      ).sort();
      
      console.groupEnd();

      // Now filter and display
      this.applyFilter();
      this.cd.markForCheck();
    });
  } catch (err: any) {
    console.error('%cError loading contacts:', 'color: red; font-weight: bold;', err);
    this.loading = false;
    this.cd.markForCheck();
  } finally {
    this.loading = false;
    this.cd.markForCheck();
  }
}

applyFilter() {
  this.filteredItems = this.items.filter(item => {
    // Filter by search term (search in first_name, last_name, email)
    const searchLower = this.search.toLowerCase();
    const matchesSearch = !searchLower ||
      (item.first_name && item.first_name.toLowerCase().includes(searchLower)) ||
      (item.last_name && item.last_name.toLowerCase().includes(searchLower)) ||
      (item.email && item.email.toLowerCase().includes(searchLower));

    // Filter by active status
    const matchesStatus = this.status === 'all' ||
      (this.status === 'active' && item.is_active) ||
      (this.status === 'inactive' && !item.is_active);

    return matchesSearch && matchesStatus;
  });

  // Better logging for debugging
// REPLACE your old broken code with this:
console.log('%cFiltered Items:', 'color: #0066cc; font-weight: bold; font-size: 14px;');
console.dir(this.filteredItems, { depth: null, colors: true });

  this.cd.markForCheck();
}

  onFilter() {
    console.log('Filter applied:', { search: this.search, status: this.status });
    this.applyFilter();
  }

  onClear() {
    this.search = '';
    this.status = 'all';
    console.log('Filter cleared');
    this.applyFilter();
  }

  goCreate() {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.newItem = { is_active: true };
      this.selectedCountryCode = '+1';
      this.mobileNumber = '';
      this.formError = null;
    }
    this.cd.markForCheck();
  }

  updateMobileNumber() {
    // Remove any non-digit characters from the mobile number
    const cleanedNumber = this.mobileNumber.replace(/\D/g, '');
    // Combine country code and mobile number
    this.newItem.mobile = this.selectedCountryCode + "-" + cleanedNumber;
  }

  async saveNewContact() {
    if (!this.newItem.first_name || !this.newItem.last_name || !this.newItem.email) {
      this.formError = 'First name, last name, and email are required';
      return;
    }

    this.updateMobileNumber();

    this.formSaving = true;
    this.formError = null;
    this.cd.markForCheck();

    try {
      await this.itemsService.createContact(this.newItem);
      this.showCreateForm = false;
      this.newItem = { is_active: true };
      this.currentPage = 1;
      // show success message
      this.successMessage = 'Contact created successfully';
      setTimeout(() => { this.successMessage = null; this.cd.markForCheck(); }, 4000);
      await this.reload();
    } catch (err: any) {
      this.formError = err.message || 'Failed to save contact';
      console.error('Error saving contact:', err);
    } finally {
      this.formSaving = false;
      this.cd.markForCheck();
    }
  }

  cancelNewContact() {
    this.showCreateForm = false;
    this.newItem = { is_active: true };
    this.formError = null;
    this.cd.markForCheck();
  }

  goEdit(id: number | undefined) {
    if (id == null) return;
    this.router.navigate([`/items/${id}/edit`]);
  }

  goView(id: number | undefined) {
    if (id == null) return;
    this.router.navigate([`/items/${id}`]);
  }

  async remove(id: number | undefined) {
    if (id == null) return;
    if (!confirm('Delete this item?')) return;
    try {
      await this.itemsService.deleteContact(id);
      this.successMessage = 'Contact deleted successfully';
      setTimeout(() => { this.successMessage = null; this.cd.markForCheck(); }, 4000);
      await this.reload();
    } catch (err: any) {
      console.error('Error deleting item:', err);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.reload();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.reload();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.reload();
    }
  }

  formatGroups(groups: any[] | undefined): string {
    return groups?.length ? groups.map(g => g.group_name).join(', ') : '—';
  }

  formatEventTypes(types: any[] | undefined): string {
    return types?.length ? types.map(t => t.event_name).join(' ') : '—';
  }

  private isLandingPage(): boolean {
    return this.router.url === '/' || this.router.url === '';
  }

}
