import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ItemsService } from './items.service';
import { Item } from './item.model';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './items.html',
  styleUrls: ['./items.css']
})
export class ItemsComponent implements OnInit {
  items: Item[] = [];
  loading = false;
  error: string | null = null;

  private svc = new ItemsService();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.reload();
  }

  async reload() {
    this.loading = true;
    this.error = null;
    console.log('ItemsComponent.reload() started');
    try {
      const result = await this.svc.getContacts();
      this.items = result.items;
      console.log('Loaded items:', this.items);
    } catch (err: any) {
      console.error('Error loading items:', err);
      this.error = err.message || String(err);
    } finally {
      this.loading = false;
    }
  }

  goCreate() {
    this.router.navigate(['/items/create']);
  }

  goEdit(id: number | undefined) {
    if (id == null) return;
    this.router.navigate([`/items/${id}/edit`]);
  }

// In ItemsComponent
goView(id: number | undefined): void {
  if (id == null) return;
  this.router.navigate([`/items/${id}`]);
}

  async remove(id: number | undefined) {
    if (id == null) return;
    if (!confirm('Delete this item?')) return;
    try {
      await this.svc.deleteContact(id);
      await this.reload();
    } catch (err: any) {
      this.error = err.message || String(err);
    }
  }
}
