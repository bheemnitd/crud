import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ItemsService } from '../../items.service';
import { Item, EventType } from '../../item.model';

interface EventTypeOption {
  id: string;
  label: string;
  selected: boolean;
}

interface Group {
  id: string;
  name: string;
  isNew?: boolean;
}

const DEFAULT_GROUPS: Group[] = [
  { id: '1', name: 'Admins' },
  { id: '2', name: 'Security' },
  { id: '3', name: 'HR' },
  { id: '4', name: 'IT Support' },
  { id: '5', name: 'Management' },
  { id: '6', name: 'Incident Response' }
];

const EVENT_TYPE_OPTIONS: Omit<EventTypeOption, 'selected'>[] = [
  { id: '1', label: 'Sos' },
  { id: '2', label: '911' },
  { id: '3', label: 'Timer' },
  { id: '4', label: 'Safewalk' }
];

@Component({
  selector: 'app-item-update',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './item-form.html',
  styleUrls: ['./item-form.css']
})
export class ItemUpdateComponent implements OnInit {
  @ViewChild('groupInput') groupInput!: ElementRef<HTMLInputElement>;
  hoveredGroup: string | null = null;  // <-- Add this line

  item: Partial<Item> & { event_notification: 'all' | 'selected' | 'none' } = {
    first_name: '', last_name: '', email: '', mobile: '',
    event_notification: 'all', is_active: true, event_types: []
  };

  eventTypeOptions: EventTypeOption[] = [];
  saving = false;
  loading = true;
  success = false;
  error: string | null = null;
  formDirty = false;
  private readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  markFormDirty(): void {
    this.formDirty = true;
  }

  isValidEmail(email: string): boolean {
    return this.emailPattern.test(email || '');
  }

  // Multi-select groups (tags inside input)
  selectedGroups: Group[] = [];
  groupSearch = '';
  filteredGroups: Group[] = [];
  allGroups: Group[] = [...DEFAULT_GROUPS];
  showDropdown = false;
  inputFocused = false;

  private itemId: string | null = null;

  constructor(
    private itemsService: ItemsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initializeEventTypeOptions();
  }

ngOnInit(): void {
  this.itemId = this.route.snapshot.paramMap.get('id');
  if (!this.itemId) {
    this.error = 'Invalid contact ID';
    this.loading = false;
    return;
  }

  this.loadPersistedGroups();
  this.loadContact();
}

  private loadPersistedGroups(): void {
    try {
      // Check if we're in a browser environment where sessionStorage is available
      const isBrowser = typeof window !== 'undefined' && window.sessionStorage;
      if (!isBrowser) {
        console.log('Skipping sessionStorage access in non-browser environment');
        return;
      }

      const stored = sessionStorage.getItem('allNotificationGroups');
      if (stored) {
        try {
          const parsed: Group[] = JSON.parse(stored);
          parsed.forEach(g => {
            if (!this.allGroups.some(x => x.id === g.id)) {
              this.allGroups.push(g);
            }
          });
        } catch (e) {
          console.error('Error parsing stored groups:', e);
        }
      }
    } catch (e) {
      console.warn('Failed to load stored groups', e);
    }
  }

private async loadContact(): Promise<void> {
  if (!this.itemId) {
    this.error = 'No contact ID provided';
    return;
  }

  this.loading = true;
  this.error = null;
  
  try {
    // Make API call to get contact data
    const response = await this.itemsService.getContact(this.itemId).toPromise();
    
    if (!response) {
      throw new Error('No data received from server');
    }

    console.log('API Response:', response); // For debugging

    // Map the API response to the form model
    this.item = { 
      id: response.id,
      first_name: response.first_name || '',
      last_name: response.last_name || '',
      email: response.email || '',
      mobile: response.mobile || '',
      event_notification: 'all', // Default value, update if needed
      is_active: response.is_active ?? true,
      event_types: response.event_types || []
    };

    // Initialize selected groups
    this.selectedGroups = [];
    if (response.event_notification_groups?.length) {
      this.selectedGroups = response.event_notification_groups
        .filter((g: any) => g && g.group_name)
        .map((g: any, index: number) => ({
          id: String(index + 1), // Generate a unique ID if not provided
          name: g.group_name
        }));
    }

    // Update event type checkboxes
    if (response.event_types?.length) {
      const selectedTypes = response.event_types
        .filter((et: any) => et && et.event_name)
        .map((et: any) => et.event_name);
        
      this.eventTypeOptions = EVENT_TYPE_OPTIONS.map(option => ({
        ...option,
        selected: selectedTypes.includes(option.label) // Match by label since that's what we're displaying
      }));
    }

    // Update the form's dirty state
    this.formDirty = false;
    
    // Refresh the groups filter
    this.filterGroups();
    
    // Log the final state for debugging
    console.log('Form data after loading:', {
      item: this.item,
      selectedGroups: this.selectedGroups,
      eventTypeOptions: this.eventTypeOptions
    });
    
  } catch (error) {
    console.error('Error loading contact:', error);
    this.error = 'Failed to load contact. Please try again.';
    if (error instanceof Error) {
      this.error += ` ${error.message}`;
    }
  } finally {
    this.loading = false;
  }
}

  private initializeEventTypeOptions(): void {
    this.eventTypeOptions = EVENT_TYPE_OPTIONS.map(opt => ({
      ...opt,
      selected: false
    }));
  }

  // === Multi-Select Group Logic (Same as Create) ===
  focusInput(): void {
    this.groupInput.nativeElement.focus();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.multi-select-wrapper')) {
      this.showDropdown = false;
    }
  }

  onGroupInputFocus(): void {
    this.inputFocused = true;
    this.showDropdown = true;
    this.filterGroups();
  }

  onGroupInputBlur(): void {
    this.inputFocused = false;
    setTimeout(() => {
      if (!this.inputFocused) this.showDropdown = false;
    }, 200);
  }

  filterGroups(): void {
    const term = this.groupSearch.trim().toLowerCase();
    const selectedIds = this.selectedGroups.map(g => g.id);

    if (!term) {
      this.filteredGroups = this.allGroups.filter(g => !selectedIds.includes(g.id));
    } else {
      const matches = this.allGroups.filter(g =>
        g.name.toLowerCase().includes(term) && !selectedIds.includes(g.id)
      );

      this.filteredGroups = matches.length > 0 ? matches : [{
        id: term.replace(/\s+/g, '-'),
        name: this.groupSearch.trim(),
        isNew: true
      }];
    }
  }

  selectGroup(group: Group): void {
    if (this.selectedGroups.some(g => g.id === group.id)) return;

    this.selectedGroups = [...this.selectedGroups, { id: group.id, name: group.name }];

    if (group.isNew) {
      this.allGroups = [...this.allGroups, { id: group.id, name: group.name }];
      try {
        sessionStorage.setItem('allNotificationGroups', JSON.stringify(this.allGroups));
      } catch {}
    }

    this.groupSearch = '';
    this.filterGroups();
    this.groupInput.nativeElement.focus();
  }

  removeGroup(id: string): void {
    this.selectedGroups = this.selectedGroups.filter(g => g.id !== id);
    this.filterGroups();
  }

  onBackspace(): void {
    if (!this.groupSearch && this.selectedGroups.length > 0) {
      this.removeGroup(this.selectedGroups[this.selectedGroups.length - 1].id);
    }
  }

  onEnterKey(event: Event): void {
    event.preventDefault();
    if (this.filteredGroups.length > 0) {
      this.selectGroup(this.filteredGroups[0]);
    }
  }

  onNotificationModeChange(mode: 'all' | 'selected' | 'none'): void {
    this.item.event_notification = mode;
    if (mode !== 'selected') {
      this.selectedGroups = [];
    }
    this.markFormDirty();
  }

  onEventTypeChange(value: string, isChecked: boolean): void {
    this.eventTypeOptions = this.eventTypeOptions.map(opt => ({
      ...opt,
      selected: opt.id === value ? isChecked : opt.selected
    }));
    this.markFormDirty();
  }

  async save(): Promise<void> {
    if (this.saving) return;

    this.saving = true;
    this.error = null;

    try {
      // Get selected event type options
      const selectedEventTypes = this.eventTypeOptions.filter(opt => opt.selected);
      
      // Map selected event types to their corresponding IDs using EVENT_TYPE_OPTIONS
      const eventTypeIds = selectedEventTypes
        .map(opt => {
          const eventType = EVENT_TYPE_OPTIONS.find(et => et.label === opt.label);
          return eventType ? eventType.id : null;
        })
        .filter((id): id is string => id !== null);
      
      // Build event_types for display
      this.item.event_types = selectedEventTypes
        .map(opt => ({
          id: parseInt(opt.id, 10),
          event_name: opt.label,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as EventType));
      
      // Set eventTypesArray with the selected event type IDs for the backend
      this.item.eventTypesArray = eventTypeIds;

      // Build groups
      this.item.event_notification_groups = this.selectedGroups.map(g => ({
        id: parseInt(g.id, 10),
        group_name: g.name
      }));

      await this.itemsService.updateContact(this.itemId!, this.item);
      this.success = true;
      setTimeout(() => this.router.navigate(['/items']), 1500);
    } catch (err: any) {
      this.error = err.message || 'Failed to update contact';
      console.error(err);
    } finally {
      this.saving = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/items']);
  }

  trackByGroupId = (_: number, group: Group) => group.id;
}