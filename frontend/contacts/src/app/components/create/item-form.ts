import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ItemsService } from '../../items.service';
import { Item, EventNotificationGroup, EventType } from '../../item.model';

interface EventTypeOption {
  value: string;
  label: string;
  selected: boolean;
}

const DEFAULT_NOTIFICATION_GROUPS: Array<{ id: string; name: string }> = [
  { id: 'admins', name: 'Admins' },
  { id: 'security', name: 'Security' },
  { id: 'hr', name: 'HR' },
  { id: 'it-support', name: 'IT Support' },
  { id: 'management', name: 'Management' },
  { id: 'incident-response', name: 'Incident Response' }
];

const DEFAULT_ITEM: Partial<Item> = {
  first_name: '',
  last_name: '',
  email: '',
  mobile: '',
  event_types: [],
  is_active: true
};

const EVENT_TYPE_OPTIONS: Omit<EventTypeOption, 'selected'>[] = [
  { value: '911', label: '911' },
  { value: 'Sos', label: 'Sos' },
  { value: 'Timer', label: 'Timer' },
  { value: 'Safewalk', label: 'Safewalk' }
];

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './item-form.html',
  styleUrls: ['./item-form.css']
})

export class ItemFormComponent implements OnInit {
  item: Partial<Item> & { event_notification?: 'all' | 'selected' | 'none' } = {
    ...DEFAULT_ITEM,
    event_notification: 'all',
    event_notification_groups: []
  };
  eventTypeOptions: EventTypeOption[] = [];
  saving = false;
  loading = false;
  success = false;
  error: string | null = null;
  formDirty = false;

  selectedGroups: Array<{ id: string; name: string }> = [];
  groupSearch = '';
  loadingGroups = false;
  showDropdown = false;

  filteredGroups: Array<{ id: string; name: string; isNew?: boolean }> = [];
  allGroups: Array<{ id: string; name: string }> = [];

  
  private formInitialized = false;
  private readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  constructor(
    private itemsService: ItemsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initializeEventTypeOptions();
    this.initializeFromRoute();
  }
onGroupInputFocus(): void {
    this.showDropdown = true;
    this.filterGroups();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.showDropdown = false;
    }
  }

  filterGroups(): void {
    if (!this.groupSearch.trim()) {
      this.filteredGroups = [...this.allGroups];
    } else {
      const searchTerm = this.groupSearch.toLowerCase();
      this.filteredGroups = this.allGroups.filter(
        group => group.name.toLowerCase().includes(searchTerm)
      );
      
      if (this.filteredGroups.length === 0 && this.groupSearch.trim()) {
        this.filteredGroups = [{
          id: 'new',
          name: this.groupSearch,
          isNew: true
        }];
      }
    }
  }
  async ngOnInit(): Promise<void> {
    await this.loadItemIfNeeded();
    await this.loadNotificationGroups();
    this.formInitialized = true;
  }

  onEventTypeChange(eventType: string, isChecked: boolean): void {
    this.updateSelectedEventTypes(eventType, isChecked);
    this.ensureEventTypes();
    this.markFormDirty();
  }

  async save(): Promise<void> {
    if (this.saving || !this.item) return;

    this.saving = true;
    this.error = null;
    this.success = false;

    try {
      // Ensure event_types is up to date before saving
      this.ensureEventTypes();

      await this.saveItem();
      this.handleSaveSuccess();
    } catch (error) {
      this.handleSaveError(error);
    } finally {
      this.saving = false;
    }
  }

  resetForm(): void {
    if (confirm('Are you sure you want to reset all changes?')) {
      this.item = { ...DEFAULT_ITEM };
      this.resetEventTypeSelections();
      this.formDirty = false;
    }
  }

  markFormDirty(): void {
    if (this.formInitialized) {
      this.formDirty = true;
    }
  }

  isValidEmail(email: string): boolean {
    return email ? this.emailPattern.test(email) : false;
  }

  private initializeEventTypeOptions(): void {
    this.eventTypeOptions = EVENT_TYPE_OPTIONS.map(option => ({
      ...option,
      selected: false
    }));
  }

  private initializeFromRoute(): void {
    const resolvedData = this.route.snapshot.data;
    if (resolvedData?.['item']) {
      this.initializeItem(resolvedData['item']);
    }
  }

  private async loadItemIfNeeded(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !this.item.id) {
      await this.loadItem(id);
    }
  }

  private initializeItem(loadedItem: Partial<Item>): void {
    if (!loadedItem) {
      this.item = { ...DEFAULT_ITEM };
      return;
    }

    this.item = {
      ...loadedItem,
      is_active: loadedItem.is_active ?? true,
      event_types: Array.isArray(loadedItem.event_types) 
        ? loadedItem.event_types 
        : []
    };

    this.updateEventTypeSelections(this.item.event_types);
  }

  private updateEventTypeSelections(eventTypes: EventType[] = []): void {
    const selectedValues = eventTypes.map(et => et.event_name);
    this.eventTypeOptions = this.eventTypeOptions.map(option => ({
      ...option,
      selected: selectedValues.includes(option.value)
    }));
  }

  private async loadItem(id: string): Promise<void> {
    this.loading = true;
    try {
      const loadedItem = await this.itemsService.getContact(id);
      if (loadedItem) {
        this.initializeItem(loadedItem);
        // If there are selected groups in the loaded item, ensure they have the correct structure
        if (loadedItem.event_notification_groups  && Array.isArray(loadedItem.event_notification_groups )) {
          this.selectedGroups = loadedItem.event_notification_groups 
            .filter((group: any) => group && group.id && group.name)
            .map((group: any) => ({
              id: group.id,
              name: group.name
            }));
        }
      }
    } catch (error) {
      this.error = 'Failed to load contact';
      console.error('Error loading item:', error);
    } finally {
      this.loading = false;
    }
  }

async loadNotificationGroups(): Promise<void> {
  this.loadingGroups = true;
  try {
    // First, load from DEFAULT_NOTIFICATION_GROUPS
    this.allGroups = [...DEFAULT_NOTIFICATION_GROUPS];
    
    // Then try to load from sessionStorage
    try {
      const storedGroups = typeof window !== 'undefined' ? 
        window.sessionStorage.getItem('allNotificationGroups') : null;
      
      if (storedGroups) {
        const parsedGroups = JSON.parse(storedGroups);
        // Merge with default groups, avoiding duplicates
        parsedGroups.forEach((group: { id: string; name: string }) => {
          if (!this.allGroups.some(g => g.id === group.id)) {
            this.allGroups.push(group);
          }
        });
      }
    } catch (e) {
      console.warn('Error loading groups from sessionStorage:', e);
    }
    
    // Initialize filtered groups
    this.filterGroups();
  } catch (error) {
    console.error('Error loading notification groups:', error);
  } finally {
    this.loadingGroups = false;
  }
}
// Update the onNotificationModeChange method to:
  onNotificationModeChange(mode: 'all' | 'selected'): void {
    this.item.event_notification = mode;
    this.markFormDirty();
    if (mode === 'selected') {
      // When switching to 'selected' mode, show all available groups that aren't selected
      this.filterGroups();
    } else {
      // Clear search when switching back to 'all' mode
      this.groupSearch = '';
    }
  }

  // filterGroups(): void {
  //   const searchTerm = this.groupSearch.trim().toLowerCase();
  //   const selectedGroupIds = this.selectedGroups.map(g => g.id);

  //   if (!searchTerm) {
  //     // If search is empty, show all groups that aren't already selected
  //     this.filteredGroups = this.allGroups.filter(
  //       group => !selectedGroupIds.includes(group.id)
  //     );
  //   } else {
  //     // Filter groups by search term and exclude already selected ones
  //     this.filteredGroups = this.allGroups.filter(group =>
  //       group.name.toLowerCase().includes(searchTerm) &&
  //       !selectedGroupIds.includes(group.id)
  //     );

  //     // If no groups match and the search term is not empty, show an option to create a new group
  //     if (this.filteredGroups.length === 0 && searchTerm) {
  //       this.filteredGroups = [{
  //         id: searchTerm.toLowerCase().replace(/\s+/g, '-'),
  //         name: searchTerm,
  //         isNew: true
  //       }];
  //     }
  //   }
  // }

  selectGroup(group: { id: string; name: string; isNew?: boolean }): void {
    if (!this.selectedGroups.some(g => g.id === group.id)) {
      this.selectedGroups = [...this.selectedGroups, { id: group.id, name: group.name }];

      // If this is a new group, add it to allGroups
      if (group.isNew) {
        this.allGroups = [...this.allGroups, { id: group.id, name: group.name }];
        try {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('allNotificationGroups', JSON.stringify(this.allGroups));
          }
        } catch (e) {
          console.error('Error saving groups to sessionStorage:', e);
        }
      }

      this.groupSearch = '';
      this.filterGroups();
    }
  }

  removeGroup(groupId: string): void {
    this.selectedGroups = this.selectedGroups.filter(group => group.id !== groupId);
  }

  getGroupName(groupId: string): string {
    const group = this.allGroups.find(g => g.id === groupId);
    return group ? group.name : groupId;
  }

  onEnterKey(event?: Event): void {
    if (this.groupSearch.trim() && this.filteredGroups.length > 0) {
      this.selectGroup(this.filteredGroups[0]);
    } else if (this.groupSearch.trim()) {
      this.createNewGroup(this.groupSearch);
    }
  }

  onInputBlur(): void {
    // keep the list visible; no clearing on blur
  }

  private createNewGroup(name: string): void {
    const newGroup = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name
    };
    this.allGroups = [...this.allGroups, newGroup];
    this.selectGroup(newGroup);
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('allNotificationGroups', JSON.stringify(this.allGroups));
      }
    } catch { }
  }

  private get selectedEventTypes(): string[] {
    return this.eventTypeOptions
      .filter(option => option.selected)
      .map(option => option.value);
  }

  private ensureEventTypes(): void {
    if (!this.item) return;
    
    const selectedTypes = this.eventTypeOptions
      .filter(opt => opt.selected)
      .map(opt => ({
        event_name: opt.value,
        id: 0, // Will be set by the backend
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as EventType));
      
    this.item.event_types = selectedTypes;
  }

  private updateSelectedEventTypes(eventType: string, isChecked: boolean): void {
    if (isChecked) {
      if (!this.selectedEventTypes.includes(eventType)) {
        this.eventTypeOptions = this.eventTypeOptions.map(option =>
          option.value === eventType ? { ...option, selected: true } : option
        );
      }
    } else {
      this.eventTypeOptions = this.eventTypeOptions.map(option =>
        option.value === eventType ? { ...option, selected: false } : option
      );
    }
  }

  private async saveItem(): Promise<void> {
    if (!this.item) return;
    
    // Ensure event_types is up to date
    this.ensureEventTypes();
    
    // Include selected groups in the item data
    this.item.selected_groups = [...this.selectedGroups];

    if (this.item.id) {
      await this.itemsService.updateContact(this.item.id, this.item);
    } else {
      await this.itemsService.createContact(this.item);
    }
  }

  private handleSaveSuccess(): void {
    this.success = true;
    this.formDirty = false;
    setTimeout(() => this.router.navigate(['/items']), 2000);
  }

  private handleSaveError(error: any): void {
    this.error = 'Failed to save contact. Please try again.';
    console.error('Error saving item:', error);
  }

  private resetEventTypeSelections(): void {
    this.eventTypeOptions = this.eventTypeOptions.map(option => ({
      ...option,
      selected: false
    }));
  }

  onCancel(): void {
    this.router.navigate(['/items']);
  }

  trackByGroupId(index: number, group: { id: string; name: string }): string {
    return group.id;
  }
}
