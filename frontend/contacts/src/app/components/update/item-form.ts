// import { Component, OnInit, HostListener } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { ItemsService } from '../../items.service';
// import { Item, EventNotificationGroup, EventType } from '../../item.model';

// interface EventTypeOption {
//   value: string;
//   label: string;
//   selected: boolean;
// }

// const DEFAULT_NOTIFICATION_GROUPS: Array<{ id: string; name: string }> = [
//   { id: 'admins', name: 'Admins' },
//   { id: 'security', name: 'Security' },
//   { id: 'hr', name: 'HR' },
//   { id: 'it-support', name: 'IT Support' },
//   { id: 'management', name: 'Management' },
//   { id: 'incident-response', name: 'Incident Response' }
// ];

// const DEFAULT_ITEM: Partial<Item> = {
//   first_name: '',
//   last_name: '',
//   email: '',
//   mobile: '',
//   event_types: [],
//   is_active: true
// };

// const EVENT_TYPE_OPTIONS: Omit<EventTypeOption, 'selected'>[] = [
//   { value: '911', label: '911' },
//   { value: 'Sos', label: 'Sos' },
//   { value: 'Timer', label: 'Timer' },
//   { value: 'Safewalk', label: 'Safewalk' }
// ];

// @Component({
//   selector: 'app-item-form',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './item-form.html',
//   styleUrls: ['./item-form.css']
// })

// export class ItemFormComponent implements OnInit {
//   item: Partial<Item> & { event_notification?: 'all' | 'selected' | 'none' } = {
//     ...DEFAULT_ITEM,
//     event_notification: 'all',
//     event_notification_groups: []
//   };
//   eventTypeOptions: EventTypeOption[] = [];
//   saving = false;
//   loading = false;
//   success = false;
//   error: string | null = null;
//   formDirty = false;

//   selectedGroups: Array<{ id: string; name: string }> = [];
//   groupSearch = '';
//   loadingGroups = false;
//   showDropdown = false;

//   filteredGroups: Array<{ id: string; name: string; isNew?: boolean }> = [];
//   allGroups: Array<{ id: string; name: string }> = [];


//   private formInitialized = false;
//   private readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

//   constructor(
//     private itemsService: ItemsService,
//     private route: ActivatedRoute,
//     private router: Router
//   ) {
//     this.initializeEventTypeOptions();
//     this.initializeFromRoute();
//   }
// onGroupInputFocus(): void {
//     this.showDropdown = true;
//     this.filterGroups();
//   }

//   @HostListener('document:click', ['$event'])
//   onDocumentClick(event: Event): void {
//     const target = event.target as HTMLElement;
//     if (!target.closest('.dropdown-container')) {
//       this.showDropdown = false;
//     }
//   }
//   filterGroups(): void {
//     if (!this.groupSearch.trim()) {
//       this.filteredGroups = [...this.allGroups];
//     } else {
//       const searchTerm = this.groupSearch.toLowerCase();
//       this.filteredGroups = this.allGroups.filter(
//         group => group.name.toLowerCase().includes(searchTerm)
//       );

//       if (this.filteredGroups.length === 0 && this.groupSearch.trim()) {
//         this.filteredGroups = [{
//           id: 'new',
//           name: this.groupSearch,
//           isNew: true
//         }];
//       }
//     }
//   }
//   async ngOnInit(): Promise<void> {
//     await this.loadItemIfNeeded();
//     await this.loadNotificationGroups();
//     this.formInitialized = true;
//   }

//   onEventTypeChange(eventType: string, isChecked: boolean): void {
//     this.updateSelectedEventTypes(eventType, isChecked);
//     this.ensureEventTypes();
//     this.markFormDirty();
//   }

//   async save(): Promise<void> {
//     if (this.saving || !this.item) return;

//     this.saving = true;
//     this.error = null;
//     this.success = false;

//     try {
//       // Ensure event_types is up to date before saving
//       this.ensureEventTypes();

//       await this.saveItem();
//       this.handleSaveSuccess();
//     } catch (error) {
//       this.handleSaveError(error);
//     } finally {
//       this.saving = false;
//     }
//   }

//   resetForm(): void {
//     if (confirm('Are you sure you want to reset all changes?')) {
//       this.item = { ...DEFAULT_ITEM };
//       this.resetEventTypeSelections();
//       this.formDirty = false;
//     }
//   }

//   markFormDirty(): void {
//     if (this.formInitialized) {
//       this.formDirty = true;
//     }
//   }

//   isValidEmail(email: string): boolean {
//     return email ? this.emailPattern.test(email) : false;
//   }

//   private initializeEventTypeOptions(): void {
//     this.eventTypeOptions = EVENT_TYPE_OPTIONS.map(option => ({
//       ...option,
//       selected: false
//     }));
//   }

//   private initializeFromRoute(): void {
//     const resolvedData = this.route.snapshot.data;
//     if (resolvedData?.['item']) {
//       this.initializeItem(resolvedData['item']);
//     }
//   }

//   private async loadItemIfNeeded(): Promise<void> {
//     const id = this.route.snapshot.paramMap.get('id');
//     if (id && !this.item.id) {
//       await this.loadItem(id);
//     }
//   }

//   private initializeItem(loadedItem: Partial<Item>): void {
//     if (!loadedItem) {
//       this.item = { ...DEFAULT_ITEM };
//       return;
//     }

//     this.item = {
//       ...loadedItem,
//       is_active: loadedItem.is_active ?? true,
//       event_types: Array.isArray(loadedItem.event_types) 
//         ? loadedItem.event_types 
//         : []
//     };

//     this.updateEventTypeSelections(this.item.event_types);
//   }

//   private updateEventTypeSelections(eventTypes: EventType[] = []): void {
//     const selectedValues = eventTypes.map(et => et.event_name);
//     this.eventTypeOptions = this.eventTypeOptions.map(option => ({
//       ...option,
//       selected: selectedValues.includes(option.value)
//     }));
//   }

//   private async loadItem(id: string): Promise<void> {
//     this.loading = true;
//     try {
//       const loadedItem = await this.itemsService.getContact(id);
//       if (loadedItem) {
//         this.initializeItem(loadedItem);
//         // If there are selected groups in the loaded item, ensure they have the correct structure
//         if (loadedItem.event_notification_groups  && Array.isArray(loadedItem.event_notification_groups )) {
//           this.selectedGroups = loadedItem.event_notification_groups 
//             .filter((group: any) => group && group.id && group.name)
//             .map((group: any) => ({
//               id: group.id,
//               name: group.name
//             }));
//         }
//       }
//     } catch (error) {
//       this.error = 'Failed to load contact';
//       console.error('Error loading item:', error);
//     } finally {
//       this.loading = false;
//     }
//   }

// async loadNotificationGroups(): Promise<void> {
//   this.loadingGroups = true;
//   try {
//     // First, load from DEFAULT_NOTIFICATION_GROUPS
//     this.allGroups = [...DEFAULT_NOTIFICATION_GROUPS];

//     // Then try to load from sessionStorage
//     try {
//       const storedGroups = typeof window !== 'undefined' ? 
//         window.sessionStorage.getItem('allNotificationGroups') : null;

//       if (storedGroups) {
//         const parsedGroups = JSON.parse(storedGroups);
//         // Merge with default groups, avoiding duplicates
//         parsedGroups.forEach((group: { id: string; name: string }) => {
//           if (!this.allGroups.some(g => g.id === group.id)) {
//             this.allGroups.push(group);
//           }
//         });
//       }
//     } catch (e) {
//       console.warn('Error loading groups from sessionStorage:', e);
//     }

//     // Initialize filtered groups
//     this.filterGroups();
//   } catch (error) {
//     console.error('Error loading notification groups:', error);
//   } finally {
//     this.loadingGroups = false;
//   }
// }
// // Update the onNotificationModeChange method to:
//   onNotificationModeChange(mode: 'all' | 'selected'): void {
//     this.item.event_notification = mode;
//     this.markFormDirty();
//     if (mode === 'selected') {
//       // When switching to 'selected' mode, show all available groups that aren't selected
//       this.filterGroups();
//     } else {
//       // Clear search when switching back to 'all' mode
//       this.groupSearch = '';
//     }
//   }

//   // filterGroups(): void {
//   //   const searchTerm = this.groupSearch.trim().toLowerCase();
//   //   const selectedGroupIds = this.selectedGroups.map(g => g.id);

//   //   if (!searchTerm) {
//   //     // If search is empty, show all groups that aren't already selected
//   //     this.filteredGroups = this.allGroups.filter(
//   //       group => !selectedGroupIds.includes(group.id)
//   //     );
//   //   } else {
//   //     // Filter groups by search term and exclude already selected ones
//   //     this.filteredGroups = this.allGroups.filter(group =>
//   //       group.name.toLowerCase().includes(searchTerm) &&
//   //       !selectedGroupIds.includes(group.id)
//   //     );

//   //     // If no groups match and the search term is not empty, show an option to create a new group
//   //     if (this.filteredGroups.length === 0 && searchTerm) {
//   //       this.filteredGroups = [{
//   //         id: searchTerm.toLowerCase().replace(/\s+/g, '-'),
//   //         name: searchTerm,
//   //         isNew: true
//   //       }];
//   //     }
//   //   }
//   // }

//   selectGroup(group: { id: string; name: string; isNew?: boolean }): void {
//     if (!this.selectedGroups.some(g => g.id === group.id)) {
//       this.selectedGroups = [...this.selectedGroups, { id: group.id, name: group.name }];

//       // If this is a new group, add it to allGroups
//       if (group.isNew) {
//         this.allGroups = [...this.allGroups, { id: group.id, name: group.name }];
//         try {
//           if (typeof window !== 'undefined') {
//             window.sessionStorage.setItem('allNotificationGroups', JSON.stringify(this.allGroups));
//           }
//         } catch (e) {
//           console.error('Error saving groups to sessionStorage:', e);
//         }
//       }

//       this.groupSearch = '';
//       this.filterGroups();
//     }
//   }

//   removeGroup(groupId: string): void {
//     this.selectedGroups = this.selectedGroups.filter(group => group.id !== groupId);
//   }

//   getGroupName(groupId: string): string {
//     const group = this.allGroups.find(g => g.id === groupId);
//     return group ? group.name : groupId;
//   }

//   onEnterKey(event?: Event): void {
//     if (this.groupSearch.trim() && this.filteredGroups.length > 0) {
//       this.selectGroup(this.filteredGroups[0]);
//     } else if (this.groupSearch.trim()) {
//       this.createNewGroup(this.groupSearch);
//     }
//   }

//   onInputBlur(): void {
//     // keep the list visible; no clearing on blur
//   }

//   private createNewGroup(name: string): void {
//     const newGroup = {
//       id: name.toLowerCase().replace(/\s+/g, '-'),
//       name
//     };
//     this.allGroups = [...this.allGroups, newGroup];
//     this.selectGroup(newGroup);
//     try {
//       if (typeof window !== 'undefined') {
//         window.sessionStorage.setItem('allNotificationGroups', JSON.stringify(this.allGroups));
//       }
//     } catch { }
//   }

//   private get selectedEventTypes(): string[] {
//     return this.eventTypeOptions
//       .filter(option => option.selected)
//       .map(option => option.value);
//   }

//   private ensureEventTypes(): void {
//     if (!this.item) return;

//     const selectedTypes = this.eventTypeOptions
//       .filter(opt => opt.selected)
//       .map(opt => ({
//         event_name: opt.value,
//         id: 0, // Will be set by the backend
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       } as EventType));

//     this.item.event_types = selectedTypes;
//   }

//   private updateSelectedEventTypes(eventType: string, isChecked: boolean): void {
//     if (isChecked) {
//       if (!this.selectedEventTypes.includes(eventType)) {
//         this.eventTypeOptions = this.eventTypeOptions.map(option =>
//           option.value === eventType ? { ...option, selected: true } : option
//         );
//       }
//     } else {
//       this.eventTypeOptions = this.eventTypeOptions.map(option =>
//         option.value === eventType ? { ...option, selected: false } : option
//       );
//     }
//   }

//   private async saveItem(): Promise<void> {
//     if (!this.item) return;

//     // Ensure event_types is up to date
//     this.ensureEventTypes();

//     // Include selected groups in the item data
//     this.item.selected_groups = [...this.selectedGroups];

//     if (this.item.id) {
//       await this.itemsService.updateContact(this.item.id, this.item);
//     } else {
//       await this.itemsService.createContact(this.item);
//     }
//   }

//   private handleSaveSuccess(): void {
//     this.success = true;
//     this.formDirty = false;
//     setTimeout(() => this.router.navigate(['/items']), 2000);
//   }

//   private handleSaveError(error: any): void {
//     this.error = 'Failed to save contact. Please try again.';
//     console.error('Error saving item:', error);
//   }

//   private resetEventTypeSelections(): void {
//     this.eventTypeOptions = this.eventTypeOptions.map(option => ({
//       ...option,
//       selected: false
//     }));
//   }

//   onCancel(): void {
//     this.router.navigate(['/items']);
//   }

//   trackByGroupId(index: number, group: { id: string; name: string }): string {
//     return group.id;
//   }
// }










// import { Component, OnInit, HostListener } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { ItemsService } from '../../items.service';
// import { Item, EventType } from '../../item.model';

// interface EventTypeOption {
//   value: string;
//   label: string;
//   selected: boolean;
// }

// const DEFAULT_NOTIFICATION_GROUPS: Array<{ id: string; name: string }> = [
//   { id: 'admins', name: 'Admins' },
//   { id: 'security', name: 'Security' },
//   { id: 'hr', name: 'HR' },
//   { id: 'it-support', name: 'IT Support' },
//   { id: 'management', name: 'Management' },
//   { id: 'incident-response', name: 'Incident Response' }
// ];

// const EVENT_TYPE_OPTIONS: Omit<EventTypeOption, 'selected'>[] = [
//   { value: '911', label: '911' },
//   { value: 'Sos', label: 'Sos' },
//   { value: 'Timer', label: 'Timer' },
//   { value: 'Safewalk', label: 'Safewalk' }
// ];

// @Component({
//   selector: 'app-item-form',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './item-form.html',
//   styleUrls: ['./item-form.css']
// })
// export class ItemFormComponent implements OnInit {
//   item: Partial<Item> & { event_notification?: 'all' | 'selected' } = {
//     first_name: '',
//     last_name: '',
//     email: '',
//     mobile: '',
//     event_types: [],
//     is_active: true,
//     event_notification: 'all',
//     event_notification_groups: []
//   };

//   eventTypeOptions: EventTypeOption[] = [];
//   saving = false;
//   loading = false;
//   success = false;
//   loadingGroups = false;
//   error: string | null = null;
//   formDirty = false;

//   selectedGroups: Array<{ id: string; name: string }> = [];
//   groupSearch = '';
//   filteredGroups: Array<{ id: string; name: string; isNew?: boolean }> = [];
//   allGroups: Array<{ id: string; name: string }> = [];

//   private readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

//   constructor(
//     private itemsService: ItemsService,
//     private router: Router
//   ) {
//     this.initializeEventTypeOptions();
//   }

//   ngOnInit(): void {
//     this.loadNotificationGroups();
//   }

//   private initializeEventTypeOptions(): void {
//     this.eventTypeOptions = EVENT_TYPE_OPTIONS.map(opt => ({
//       ...opt,
//       selected: false
//     }));
//   }

//   onEventTypeChange(eventType: string, isChecked: boolean): void {
//     this.eventTypeOptions = this.eventTypeOptions.map(opt => ({
//       ...opt,
//       selected: opt.value === eventType ? isChecked : opt.selected
//     }));
//     this.markFormDirty();
//   }

//   onNotificationModeChange(mode: 'all' | 'selected'): void {
//     this.item.event_notification = mode;
//     this.markFormDirty();
//     if (mode === 'selected') {
//       this.filterGroups();
//     } else {
//       this.groupSearch = '';
//     }
//   }

//   filterGroups(): void {
//     const term = this.groupSearch.trim().toLowerCase();
//     if (!term) {
//       this.filteredGroups = this.allGroups.filter(g =>
//         !this.selectedGroups.some(sg => sg.id === g.id)
//       );
//     } else {
//       this.filteredGroups = this.allGroups.filter(g =>
//         g.name.toLowerCase().includes(term) &&
//         !this.selectedGroups.some(sg => sg.id === g.id)
//       );

//       if (this.filteredGroups.length === 0 && term) {
//         this.filteredGroups = [{
//           id: term.replace(/\s+/g, '-').toLowerCase(),
//           name: this.groupSearch,
//           isNew: true
//         }];
//       }
//     }
//   }

//   selectGroup(group: { id: string; name: string; isNew?: boolean }): void {
//     if (this.selectedGroups.some(g => g.id === group.id)) return;

//     this.selectedGroups = [...this.selectedGroups, { id: group.id, name: group.name }];

//     if (group.isNew) {
//       this.allGroups = [...this.allGroups, { id: group.id, name: group.name }];
//       try {
//         sessionStorage.setItem('allNotificationGroups', JSON.stringify(this.allGroups));
//       } catch { }
//     }

//     this.groupSearch = '';
//     this.filterGroups();
//   }

//   removeGroup(groupId: string): void {
//     this.selectedGroups = this.selectedGroups.filter(g => g.id !== groupId);
//   }

//   async save(): Promise<void> {
//     if (this.saving) return;

//     this.saving = true;
//     this.error = null;

//     try {
//       // Build event_types from checkboxes
//       this.item.event_types = this.eventTypeOptions
//         .filter(opt => opt.selected)
//         .map(opt => ({ event_name: opt.value } as EventType));

//       // Map selected groups to backend format

//       this.item.event_notification_groups = this.selectedGroups.map(g => ({
//         id: parseInt(g.id, 10),  // Convert string ID to number
//         group_name: g.name
//       }));
//       await this.itemsService.createContact(this.item as Partial<Item>);
//       this.success = true;
//       setTimeout(() => this.router.navigate(['/items']), 1500);
//     } catch (err: any) {
//       this.error = err.message || 'Failed to create contact';
//       console.error('Save error:', err);
//     } finally {
//       this.saving = false;
//     }
//   }

//   markFormDirty(): void {
//     this.formDirty = true;
//   }

//   isValidEmail(email: string): boolean {
//     return email ? this.emailPattern.test(email) : false;
//   }

//   onCancel(): void {
//     this.router.navigate(['/items']);
//   }

//   private async loadNotificationGroups(): Promise<void> {
//     this.allGroups = [...DEFAULT_NOTIFICATION_GROUPS];

//     try {
//       const stored = sessionStorage.getItem('allNotificationGroups');
//       if (stored) {
//         const parsed = JSON.parse(stored);
//         parsed.forEach((g: any) => {
//           if (!this.allGroups.some(x => x.id === g.id)) {
//             this.allGroups.push(g);
//           }
//         });
//       }
//     } catch (e) {
//       console.warn('Failed to load stored groups', e);
//     }

//     this.filterGroups();
//   }

//   trackByGroupId(index: number, group: { id: string }): string {
//     return group.id;
//   }

//   onEnterKey(event: Event): void {
//     event.preventDefault();
//     if (this.groupSearch.trim()) {
//       this.createNewGroup(this.groupSearch.trim());
//     }
//   }

//   private createNewGroup(name: string): void {
//     const newGroup = {
//       id: name.toLowerCase().replace(/\s+/g, '-'),
//       name: name.trim()
//     };
//     this.selectGroup({ ...newGroup, isNew: true });
//   }
// }

import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ItemsService } from '../../items.service';
import { Item, EventType } from '../../item.model';

interface EventTypeOption {
  value: string;
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
  { value: '911', label: '911' },
  { value: 'Sos', label: 'Sos' },
  { value: 'Timer', label: 'Timer' },
  { value: 'Safewalk', label: 'Safewalk' }
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
      const stored = sessionStorage.getItem('allNotificationGroups');
      if (stored) {
        const parsed: Group[] = JSON.parse(stored);
        parsed.forEach(g => {
          if (!this.allGroups.some(x => x.id === g.id)) {
            this.allGroups.push(g);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load stored groups', e);
    }
  }

  private async loadContact(): Promise<void> {
    this.loading = true;
    try {
      // Convert Observable to Promise and await the actual data
      const data = await firstValueFrom(
        this.itemsService.getContact(this.itemId!)
      );

      // Now data is the actual Item, not an Observable
      this.item = { 
        ...data, 
        event_notification: data.event_notification || 'all' 
      };

      // Populate selected groups
      if (data.event_notification === 'selected' && data.event_notification_groups) {
        this.selectedGroups = data.event_notification_groups
          .filter((g: any) => g && g.id && g.group_name)
          .map((g: any) => ({
            id: String(g.id),
            name: g.group_name
          }));
      } else {
        this.selectedGroups = [];
      }

      // Update event type checkboxes
      if (data.event_types) {
        const selectedTypes = data.event_types.map((et: any) => et.event_name);
        this.eventTypeOptions = this.eventTypeOptions.map(option => ({
          ...option,
          selected: selectedTypes.includes(option.value)
        }));
      }

      this.filterGroups();
    } catch (error) {
      this.error = 'Failed to load contact';
      console.error(error);
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
      selected: opt.value === value ? isChecked : opt.selected
    }));
    this.markFormDirty();
  }

  async save(): Promise<void> {
    if (this.saving) return;

    this.saving = true;
    this.error = null;

    try {
      // Build event_types
      this.item.event_types = this.eventTypeOptions
        .filter(opt => opt.selected)
        .map(opt => ({ event_name: opt.value } as EventType));

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