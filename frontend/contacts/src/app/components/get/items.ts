import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ItemsService } from '../../items.service';
import { Item, EventType } from '../../item.model';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './items.html',
  styleUrls: ['./items.css']
})
export class ItemsComponent implements OnInit {
  title = signal('Enterprise Emergency Contacts');
  items: Item[] = [];
  filteredItems: Item[] = [];
  loading = false;
  search = '';
  status = 'all';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  successMessage: string | null = null;
  error: string | null = null;

  constructor(
    private itemsService: ItemsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadItems();
  }

  private async loadItems() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.itemsService.getContacts(this.currentPage);
      this.items = result.items;
      this.filteredItems = [...this.items];
      this.totalItems = result.total;
      this.totalPages = Math.ceil(this.totalItems / 10);
      this.applyFilters();
      
      // Show success message only if items are loaded successfully
      if (this.items.length > 0) {
        this.showSuccessMessage(`${this.items.length} items loaded successfully`);
      } else {
        this.showSuccessMessage('No items found');
      }
    } catch (error) {
      console.error('Error loading items:', error);
      this.showErrorMessage('Failed to load items. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    this.filteredItems = this.items.filter(item => {
      const matchesSearch = !this.search || 
        (item.first_name && item.first_name.toLowerCase().includes(this.search.toLowerCase())) ||
        (item.last_name && item.last_name.toLowerCase().includes(this.search.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(this.search.toLowerCase())) ||
        (item.mobile && item.mobile.includes(this.search));
      
      const matchesStatus = this.status === 'all' || 
        (this.status === 'active' && item.is_active) ||
        (this.status === 'inactive' && !item.is_active);
      
      return matchesSearch && matchesStatus;
    });
  }

  onSearch() {
    this.applyFilters();
    if (this.search) {
      const count = this.filteredItems.length;
      this.showSuccessMessage(`Found ${count} ${count === 1 ? 'result' : 'results'} for "${this.search}"`);
    } else {
      this.showSuccessMessage('Showing all contacts');
    }
  }

  onStatusChange() {
    this.applyFilters();
    this.showSuccessMessage(`Filtered by status: ${this.status === 'all' ? 'All' : this.status}`);
  }

  onClear() {
    this.search = '';
    this.status = 'all';
    this.applyFilters();
    this.showSuccessMessage('Filters cleared');
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadItems();
  }

  async reload() {
    await this.loadItems();
  }

  private showSuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  private showErrorMessage(message: string) {
    this.error = message;
    setTimeout(() => {
      this.error = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  goCreate() {
    this.router.navigate(['/items/create']);
  }

  goEdit(id: number | undefined) {
    if (id == null) {
      this.showErrorMessage('Invalid contact ID');
      return;
    }
    this.router.navigate([`/items/${id}/edit`]);
  }

  goView(id: number | undefined): void {
    if (id == null) {
      this.showErrorMessage('Invalid contact ID');
      return;
    }
    this.router.navigate([`/items/${id}`]);
  }

  async remove(id: number | undefined) {
    if (id == null) return;
    
    if (confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      try {
        this.loading = true;
        this.error = null;
        await this.itemsService.deleteContact(id);
        await this.loadItems();
        this.showSuccessMessage('Contact deleted successfully');
      } catch (error) {
        console.error('Error deleting contact:', error);
        this.showErrorMessage('Failed to delete contact. Please try again.');
      } finally {
        this.loading = false;
      }
    }
  }
}
