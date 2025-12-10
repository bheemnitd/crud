// import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, NgForm } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { ContactService } from '../../services/contact.service';
// import { finalize } from 'rxjs/operators';

// interface Contact {
//     first_name: string;
//     last_name: string;
//     email: string;
//     mobile: string;
//     event_notification: 'all' | 'selected';
//     is_active: boolean;
//     eventTypesArray: string[];
//     event_notification_groups?: Array<{ id: string, group_name: string }>;
// }

// interface Group {
//     id: string;
//     name: string;
//     isNew?: boolean;
// }

// interface Country {
//     code: string;
//     name: string;
//     dial_code: string;
// }

// @Component({
//     selector: 'app-item-create',
//     standalone: true,
//     imports: [
//         CommonModule,
//         FormsModule,
//         RouterModule
//     ],
//     templateUrl: './item-create.html',
//     styleUrls: ['./item-create.css']
// })
// export class ItemCreateComponent implements OnInit {
//     // Event type mapping
//     private readonly eventTypeMap: { [key: string]: number } = {
//         'Sos': 1,
//         '911': 2,
//         'Timer': 3,
//         'Safewalk': 4
//     };

//     // Group name to ID mapping
//     private readonly groupNameToIdMap: { [key: string]: number } = {
//         'admin': 1,
//         'security': 2,
//         'hr': 3,
//         'it-support': 4,
//         'management': 5,
//         'incident-response': 6
//     };

//     newItem: Contact = {
//         first_name: '',
//         last_name: '',
//         email: '',
//         mobile: '',
//         event_notification: 'all',
//         is_active: true,
//         eventTypesArray: []
//     };

//     // Store the numeric event types for the payload
//     private eventTypeIds: number[] = [];

//     loading = false;
//     formSaving = false;
//     formError = '';
//     successMessage = '';

//     // For country code selection
//     countries: Country[] = [
//         { code: 'US', name: 'United States', dial_code: '+1' },
//         { code: 'IN', name: 'India', dial_code: '+91' },
//         // Add more countries as needed
//     ];
//     selectedCountryCode = '+1';
//     mobileNumber = '';

//     // For notification groups
//     selectedGroups: Group[] = [];
//     groupSearch = '';
//     loadingGroups = false;
//     filteredGroups: Group[] = [];
//     allGroups: Group[] = [];
//     hoveredGroup: Group | null = null;
//     showDropdown = false;
//     isInputFocused = false;
//     @ViewChild('searchInput') searchInput!: ElementRef;

//     constructor(
//         private contactService: ContactService,
//         private router: Router
//     ) { }

//     ngOnInit(): void {
//         this.loadGroups();
//     }

//     // Load all available groups
//     loadGroups(): void {
//         this.loadingGroups = true;
//         this.contactService.getGroups().pipe(
//             finalize(() => this.loadingGroups = false)
//         ).subscribe({
//             next: (response) => {
//                 this.allGroups = response.data || [];
//                 this.filteredGroups = [...this.allGroups];
//             },
//             error: (error: Error) => {
//                 console.error('Error loading groups:', error);
//                 this.formError = 'Failed to load groups. Please try again.';
//             }
//         });
//     }

//     // Filter groups based on search input
//     filterGroups(): void {
//         if (!this.groupSearch) {
//             this.filteredGroups = [...this.allGroups];
//             return;
//         }
//         const searchTerm = this.groupSearch.toLowerCase();
//         this.filteredGroups = this.allGroups.filter(
//             group => group.name.toLowerCase().includes(searchTerm)
//         );
//     }

//     // Handle group selection
//     selectGroup(group: Group): void {
//         if (this.selectedGroups.some(g => g.id === group.id)) {
//             return; // Already selected
//         }

//         this.selectedGroups.push({ id: group.id, name: group.name });
//         this.groupSearch = '';
//         this.filteredGroups = [...this.allGroups];
//     }

//     // Remove a selected group
//     removeGroup(groupId: string): void {
//         this.selectedGroups = this.selectedGroups.filter(g => g.id !== groupId);
//     }

//     // Handle enter key in group search
//     onEnterKey(): void {
//         if (this.groupSearch.trim()) {
//             this.createNewGroup(this.groupSearch.trim());
//         }
//     }

//     // Create a new group
//     private createNewGroup(name: string): void {
//         const groupName = name.trim().toLowerCase().replace(/\s+/g, '-');
//         const groupId = this.groupNameToIdMap[groupName] || groupName; // Use mapped ID if exists, otherwise use the name as ID

//         const newGroup = {
//             id: groupId.toString(),
//             name: name.trim(),
//             isNew: true
//         };

//         if (!this.allGroups.some(g => g.id === newGroup.id)) {
//             this.allGroups.unshift(newGroup);
//         }

//         this.selectGroup(newGroup);
//     }

//     // Handle notification mode change
//     onNotificationModeChange(mode: 'all' | 'selected'): void {
//         this.newItem.event_notification = mode;
//     }

//     // Update mobile number with country code
//     updateMobileNumber(): void {
//         this.newItem.mobile = this.selectedCountryCode + this.mobileNumber;
//     }

//     // Update selected event types
//     updateEventTypes(eventType: string, isChecked: boolean): void {
//         if (!this.newItem.eventTypesArray) {
//             this.newItem.eventTypesArray = [];
//         }

//         const eventTypeId = this.eventTypeMap[eventType];

//         if (isChecked) {
//             if (!this.newItem.eventTypesArray.includes(eventType)) {
//                 this.newItem.eventTypesArray.push(eventType);
//                 if (eventTypeId && !this.eventTypeIds.includes(eventTypeId)) {
//                     this.eventTypeIds.push(eventTypeId);
//                 }
//             }
//         } else {
//             this.newItem.eventTypesArray = this.newItem.eventTypesArray.filter(
//                 type => type !== eventType
//             );
//             this.eventTypeIds = this.eventTypeIds.filter(id => id !== eventTypeId);
//         }
//     }

//     // Validate form fields
//     private validateForm(): boolean {
//         this.formError = ''; // Clear previous errors

//         if (!this.newItem.first_name?.trim()) {
//             this.formError = 'First name is required';
//             return false;
//         }

//         if (!this.newItem.last_name?.trim()) {
//             this.formError = 'Last name is required';
//             return false;
//         }

//         if (!this.newItem.email?.trim()) {
//             this.formError = 'Email is required';
//             return false;
//         } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.newItem.email)) {
//             this.formError = 'Please enter a valid email address';
//             return false;
//         }



//         this.formError = '';
//         return true;
//     }
// async saveNewContact(form: NgForm): Promise<void> {
//   if (!this.validateForm()) {
//     return;
//   }

//   try {
//     // include all available group IDs when 'all' is selected
//     const contactData = {
//       first_name: this.newItem.first_name,
//       last_name: this.newItem.last_name,
//       email: this.newItem.email,
//       mobile: this.newItem.mobile,
//       event_notification: this.newItem.event_notification,
//       is_active: this.newItem.is_active,
//       event_types_ids: [...this.eventTypeIds],
//       event_notification_groups_ids: this.newItem.event_notification === 'all'
//         ? Object.values(this.groupNameToIdMap) // Use all mapped group IDs
//         : this.selectedGroups.map(g => typeof g.id === 'number' ? g.id : this.groupNameToIdMap[g.id] || g.id)
//     };
    
//     console.log('Sending contact data:', JSON.stringify(contactData, null, 2));
    
//     this.formSaving = true;
//     this.formError = ''; // Clear previous errors
    
//     const response = await this.contactService.createContact(contactData);
    
//     if (response.success) {
//       this.successMessage = 'Contact created successfully!';
//       form.resetForm(); // Reset the form
//       this.newItem = {  // Reset the form model
//         first_name: '',
//         last_name: '',
//         email: '',
//         mobile: '',
//         event_notification: 'all',
//         is_active: true,
//         eventTypesArray: []
//       };
//       this.selectedGroups = []; // Clear selected groups
//       this.mobileNumber = ''; // Clear mobile number
//       this.selectedCountryCode = '+1'; // Reset country code
      
//       // Redirect to home page after a short delay to show success message
//       setTimeout(() => {
//         this.router.navigate(['/items']);
//       });
//     } else {
//       this.formError = response.error || 'Failed to create contact';
//     }
//   } catch (error) {
//     console.error('Error creating contact:', error);
//     this.formError = 'An error occurred while creating the contact';
//   } finally {
//     this.formSaving = false;
//   }
// }

//     // Cancel and go back
//     cancelNewContact(): void {
//         if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
//             this.router.navigate(['/']);
//         }
//     }

//     // Track by function for ngFor
//     trackByGroupId(index: number, group: { id: string, name: string }): string {
//         return group.id;
//     }

//     // Focus management for search input
//     focusInput(): void {
//         this.searchInput.nativeElement.focus();
//     }

//     // Handle search input focus
//     onSearchFocus(): void {
//         this.isInputFocused = true;
//         this.showDropdown = true;
//         this.filterGroups();
//     }

//     // Handle search input blur
//     onSearchBlur(): void {
//         this.isInputFocused = false;
//         // Small delay to allow click events to be processed before hiding dropdown
//         setTimeout(() => {
//             if (!this.isInputFocused) {
//                 this.showDropdown = false;
//             }
//         }, 200);
//     }

//     // Handle backspace key in search input
//     onBackspace(): void {
//         if (!this.groupSearch && this.selectedGroups.length > 0) {
//             // Remove the last selected group when backspace is pressed with no search text
//             this.removeGroup(this.selectedGroups[this.selectedGroups.length - 1].id);
//         }
//     }
// }

import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
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

const DEFAULT_GROUPS: Group[] = [
  { id: '1', name: 'Admins' },
  { id: '2', name: 'Security' },
  { id: '3', name: 'HR' },
  { id: '4', name: 'IT Support' },
  { id: '5', name: 'Management' },
  { id: '6', name: 'Incident Response' }
];

@Component({
  selector: 'app-item-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './item-create.html',
  styleUrls: ['./item-create.css']
})
export class ItemCreateComponent implements OnInit {
  @ViewChild('groupInput') groupInput!: ElementRef<HTMLInputElement>;

  private readonly eventTypeMap: { [key: string]: number } = {
    'Sos': 1, '911': 2, 'Timer': 3, 'Safewalk': 4
  };

  newItem: Contact = {
    first_name: '', last_name: '', email: '', mobile: '',
    event_notification: 'all', is_active: true, eventTypesArray: []
  };

  private eventTypeIds: number[] = [];

  formSaving = false;
  formError = '';
  successMessage = '';

  countries: Country[] = [
    { code: 'US', name: 'United States', dial_code: '+1' },
    { code: 'IN', name: 'India', dial_code: '+91' }
  ];
  selectedCountryCode = '+1';
  mobileNumber = '';

  // Multi-select groups (tag input style)
  selectedGroups: Group[] = [];
  groupSearch = '';
  filteredGroups: Group[] = [];
  allGroups: Group[] = [...DEFAULT_GROUPS];
  showDropdown = false;
  inputFocused = false;

  constructor(
    private contactService: ContactService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPersistedGroups();
    this.filterGroups();
  }

  // Load groups from sessionStorage (like your update component)
  private loadPersistedGroups(): void {
    try {
      const stored = sessionStorage.getItem('allNotificationGroups');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach((g: Group) => {
          if (!this.allGroups.some(x => x.id === g.id)) {
            this.allGroups.push(g);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load groups from storage', e);
    }
  }

  // Focus input when clicking wrapper
  focusInput(): void {
    this.groupInput.nativeElement.focus();
  }

  // Global click to close dropdown
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
    // Delay hide so click on dropdown works
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

  onNotificationModeChange(mode: 'all' | 'selected'): void {
    this.newItem.event_notification = mode;
    if (mode === 'all') {
      this.selectedGroups = [];
    }
  }

  updateMobileNumber(): void {
    this.newItem.mobile = this.selectedCountryCode + this.mobileNumber.replace(/\D/g, '');
  }

  updateEventTypes(eventType: string, checked: boolean): void {
    if (checked && !this.newItem.eventTypesArray.includes(eventType)) {
      this.newItem.eventTypesArray.push(eventType);
      const id = this.eventTypeMap[eventType];
      if (id) this.eventTypeIds.push(id);
    } else if (!checked) {
      this.newItem.eventTypesArray = this.newItem.eventTypesArray.filter(t => t !== eventType);
      this.eventTypeIds = this.eventTypeIds.filter(id => id !== this.eventTypeMap[eventType]);
    }
  }

  saveNewContact(form: NgForm): void {
    this.updateMobileNumber();

    if (!this.newItem.first_name?.trim()) return this.setError('First name is required');
    if (!this.newItem.last_name?.trim()) return this.setError('Last name is required');
    if (!this.newItem.email?.trim()) return this.setError('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.newItem.email)) return this.setError('Invalid email');

    const payload: any = {
      first_name: this.newItem.first_name.trim(),
      last_name: this.newItem.last_name.trim(),
      email: this.newItem.email.trim(),
      mobile: this.newItem.mobile,
      event_notification: this.newItem.event_notification,
      is_active: this.newItem.is_active,
      event_types_ids: this.eventTypeIds,
      event_notification_groups_ids: this.newItem.event_notification === 'all'
        ? [1, 2, 3, 4, 5, 6]  // All predefined
        : this.selectedGroups.map(g => parseInt(g.id, 10) || g.id)
    };

    this.formSaving = true;
    this.formError = '';

this.contactService.createContact(payload)
  .then((res) => {
    if (res.success) {
      this.successMessage = 'Contact created successfully!';
      this.resetForm(form);
      setTimeout(() => this.router.navigate(['/items']), 1500);
    } else {
      this.setError(res.error || 'Failed to create contact');
    }
  })
  .catch(() => this.setError('Server error'))
  .finally(() => this.formSaving = false);
  }

  private setError(msg: string): void {
    this.formError = msg;
    this.formSaving = false;
  }

  private resetForm(form: NgForm): void {
    form.resetForm();
    this.newItem = {
      first_name: '', last_name: '', email: '', mobile: '',
      event_notification: 'all', is_active: true, eventTypesArray: []
    };
    this.selectedGroups = [];
    this.eventTypeIds = [];
    this.mobileNumber = '';
    this.groupSearch = '';
  }

  cancelNewContact(): void {
    if (confirm('Discard changes?')) this.router.navigate(['/items']);
  }

  trackByGroupId = (_: number, group: Group) => group.id;
}