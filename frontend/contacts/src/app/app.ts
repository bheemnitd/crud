import { Component, signal, OnInit, ChangeDetectorRef, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemsService } from './items.service';
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
  newItem: Partial<Item> = { is_active: true };
  notificationGroup: string = '';
  uniqueFirstNames: string[] = [];
  formError: string | null = null;
  formSaving = false;
  successMessage: string | null = null;
  showRouteOutlet = true;
  selectedCountryCode = '+1';
  mobileNumber = '';
  
  // Notification groups properties
  selectedGroups: string[] = [];
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

  private svc = new ItemsService();

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

  constructor(
    private router: Router,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

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
    if (!this.groupSearch.trim()) {
      this.filteredGroups = [...this.allGroups];
      return;
    }
    const searchTerm = this.groupSearch.toLowerCase();
    this.filteredGroups = this.allGroups.filter(
      group => group.name.toLowerCase().includes(searchTerm)
    );
  }

  selectGroup(group: {id: string, name: string}): void {
    if (!this.selectedGroups.includes(group.id)) {
      this.selectedGroups = [...this.selectedGroups, group.id];
      this.groupSearch = '';
      this.filterGroups();
    }
  }

  removeGroup(groupId: string): void {
    this.selectedGroups = this.selectedGroups.filter(id => id !== groupId);
  }

  getGroupName(groupId: string): string {
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
      id: `new-${Date.now()}`,
      name: name,
      isNew: true
    };
    this.allGroups = [...this.allGroups, newGroup];
    this.selectGroup(newGroup);
    // Persist groups
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.setItem('allNotificationGroups', JSON.stringify(this.allGroups));
      } catch {}
    }
  }

  updateEventTypes(eventType: string, isChecked: boolean): void {
    if (!this.newItem.eventTypesArray) {
      this.newItem.eventTypesArray = [];
    }
    
    if (isChecked) {
      this.newItem.eventTypesArray = [...(this.newItem.eventTypesArray || []), eventType];
    } else {
      this.newItem.eventTypesArray = (this.newItem.eventTypesArray || []).filter(et => et !== eventType);
    }
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
    console.log('App.reload() started for page', this.currentPage);
    try {
      const result = await this.svc.getAll(this.currentPage);
      this.ngZone.run(() => {
        this.items = result.items;
        this.totalItems = result.total;
        this.totalPages = result.pageCount;

        // Get unique first names
        const firstNames = new Set<string>();
        this.items.forEach((item: Item) => {
          if (item.first_name) {
            firstNames.add(item.first_name);
          }
        });
        this.uniqueFirstNames = Array.from(firstNames).sort();

        console.log('Loaded items:', this.items, 'Total:', this.totalItems, 'Pages:', this.totalPages);
        this.applyFilter();
        this.cd.markForCheck();
      });
    } catch (err: any) {
      console.error('Error loading items:', err);
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
    console.log('Filtered items:', this.filteredItems);
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
      await this.svc.create(this.newItem);
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
      await this.svc.delete(id);
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

  private isLandingPage(): boolean {
    return this.router.url === '/' || this.router.url === '';
  }

}
