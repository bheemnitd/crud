import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ContactService } from '../../services/contact.service';
import { finalize } from 'rxjs/operators';

interface Contact {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  event_notification: 'all' | 'selected';
  is_active: boolean;
  eventTypesArray: string[];
  event_notification_groups?: Array<{id: string, group_name: string}>;
}

interface Group {
  id: string;
  name: string;
  isNew?: boolean;
}

interface Country {
  code: string;
  name: string;
  dial_code: string;
}

@Component({
  selector: 'app-item-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './item-create.html',
  styleUrls: ['./item-create.css']
})
export class ItemCreateComponent implements OnInit {
  // Event type mapping
  private readonly eventTypeMap: { [key: string]: number } = {
    'Sos': 1,
    '911': 2,
    'Timer': 3,
    'Safewalk': 4
  };

  // Group name to ID mapping
  private readonly groupNameToIdMap: { [key: string]: number } = {
    'admin': 1,
    'security': 2,
    'hr': 3,
    'it-support': 4,
    'management': 5,
    'incident-response': 6
  };

  newItem: Contact = {
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    event_notification: 'all',
    is_active: true,
    eventTypesArray: []
  };
  
  // Store the numeric event types for the payload
  private eventTypeIds: number[] = [];
  
  loading = false;
  formSaving = false;
  formError = '';
  successMessage = '';
  
  // For country code selection
  countries: Country[] = [
    { code: 'US', name: 'United States', dial_code: '+1' },
    { code: 'IN', name: 'India', dial_code: '+91' },
    // Add more countries as needed
  ];
  selectedCountryCode = '+1';
  mobileNumber = '';
  
  // For notification groups
  selectedGroups: Group[] = [];
  groupSearch = '';
  loadingGroups = false;
  filteredGroups: Group[] = [];
  allGroups: Group[] = [];
  hoveredGroup: Group | null = null;
  showDropdown = false;

  constructor(
    private contactService: ContactService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  // Load all available groups
  loadGroups(): void {
    this.loadingGroups = true;
    this.contactService.getGroups().pipe(
      finalize(() => this.loadingGroups = false)
    ).subscribe({
      next: (response) => {
        this.allGroups = response.data || [];
        this.filteredGroups = [...this.allGroups];
      },
      error: (error: Error) => {
        console.error('Error loading groups:', error);
        this.formError = 'Failed to load groups. Please try again.';
      }
    });
  }

  // Filter groups based on search input
  filterGroups(): void {
    if (!this.groupSearch) {
      this.filteredGroups = [...this.allGroups];
      return;
    }
    const searchTerm = this.groupSearch.toLowerCase();
    this.filteredGroups = this.allGroups.filter(
      group => group.name.toLowerCase().includes(searchTerm)
    );
  }

  // Handle group selection
  selectGroup(group: Group): void {
    if (this.selectedGroups.some(g => g.id === group.id)) {
      return; // Already selected
    }
    
    this.selectedGroups.push({ id: group.id, name: group.name });
    this.groupSearch = '';
    this.filteredGroups = [...this.allGroups];
  }

  // Remove a selected group
  removeGroup(groupId: string): void {
    this.selectedGroups = this.selectedGroups.filter(g => g.id !== groupId);
  }

  // Handle enter key in group search
  onEnterKey(): void {
    if (this.groupSearch.trim()) {
      this.createNewGroup(this.groupSearch.trim());
    }
  }

  // Create a new group
  private createNewGroup(name: string): void {
    const groupName = name.trim().toLowerCase().replace(/\s+/g, '-');
    const groupId = this.groupNameToIdMap[groupName] || groupName; // Use mapped ID if exists, otherwise use the name as ID
    
    const newGroup = {
      id: groupId.toString(),
      name: name.trim(),
      isNew: true
    };
    
    if (!this.allGroups.some(g => g.id === newGroup.id)) {
      this.allGroups.unshift(newGroup);
    }
    
    this.selectGroup(newGroup);
  }

  // Handle notification mode change
  onNotificationModeChange(mode: 'all' | 'selected'): void {
    this.newItem.event_notification = mode;
  }

  // Update mobile number with country code
  updateMobileNumber(): void {
    this.newItem.mobile = this.selectedCountryCode + this.mobileNumber;
  }

  // Update selected event types
  updateEventTypes(eventType: string, isChecked: boolean): void {
    if (!this.newItem.eventTypesArray) {
      this.newItem.eventTypesArray = [];
    }
    
    const eventTypeId = this.eventTypeMap[eventType];
    
    if (isChecked) {
      if (!this.newItem.eventTypesArray.includes(eventType)) {
        this.newItem.eventTypesArray.push(eventType);
        if (eventTypeId && !this.eventTypeIds.includes(eventTypeId)) {
          this.eventTypeIds.push(eventTypeId);
        }
      }
    } else {
      this.newItem.eventTypesArray = this.newItem.eventTypesArray.filter(
        type => type !== eventType
      );
      this.eventTypeIds = this.eventTypeIds.filter(id => id !== eventTypeId);
    }
  }

  // Validate form fields
  private validateForm(): boolean {
    this.formError = ''; // Clear previous errors
    
    if (!this.newItem.first_name?.trim()) {
      this.formError = 'First name is required';
      return false;
    }
    
    if (!this.newItem.last_name?.trim()) {
      this.formError = 'Last name is required';
      return false;
    }
    
    if (!this.newItem.email?.trim()) {
      this.formError = 'Email is required';
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.newItem.email)) {
      this.formError = 'Please enter a valid email address';
      return false;
    }
    
    
    
    this.formError = '';
    return true;
  }
    async saveNewContact(form: NgForm): Promise<void> {
    if (!this.validateForm()) {
      return;
    }
    if (!this.allGroups || this.allGroups.length === 0) {
      await this.loadGroups();
    }

    try {
      // include all available group IDs when 'all' is selected
      const shouldIncludeAllGroups = this.newItem.event_notification !== 'selected';
      
const contactData = {
  first_name: this.newItem.first_name,
  last_name: this.newItem.last_name,
  email: this.newItem.email,
  mobile: this.newItem.mobile,
  event_notification: this.newItem.event_notification,
  is_active: this.newItem.is_active,
  event_types_ids: [...this.eventTypeIds],
  event_notification_groups_ids: this.newItem.event_notification === 'all'
    ? Object.values(this.groupNameToIdMap) // Use all mapped group IDs
    : this.selectedGroups.map(g => typeof g.id === 'number' ? g.id : this.groupNameToIdMap[g.id] || g.id)
};
      
      console.log('Sending contact data:', JSON.stringify(contactData, null, 2));
      
      this.formSaving = true;
      this.formError = ''; // Clear previous errors
      
      const response = await this.contactService.createContact(contactData);
      if (response.success && response.data) {
        this.router.navigate(['/contacts']);
      } else {
        this.formError = response.error || 'Failed to create contact';
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      this.formError = 'An error occurred while creating the contact';
    } finally {
      this.formSaving = false;
    }
  }

  // Cancel and go back
  cancelNewContact(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/']);
    }
  }

  // Track by function for ngFor
  trackByGroupId(index: number, group: {id: string, name: string}): string {
    return group.id;
  }
}