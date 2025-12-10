import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ItemsService } from '../../items.service';
import { Item } from '../../item.model';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.html',
  styleUrls: ['./item-detail.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class ItemDetailComponent implements OnInit {
  item: Item | null = null;
  loading = false;
  error: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private itemsService = inject(ItemsService);

  ngOnInit(): void {
    // Subscribe to route parameter changes
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadItem(id);
      }
    });
  }

  private async loadItem(id: string): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const response = await this.itemsService.getContact(id);
      if (response) {
        this.item = response;
      } else {
        this.error = 'Contact not found';
      }
    } catch (error) {
      console.error('Error loading contact:', error);
      this.error = 'Failed to load contact details. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  goEdit(): void {
    if (!this.item) return;
    this.router.navigate([`/items/${this.item.id}/edit`]);
  }

  formatGroups(groups: any[] | undefined): string {
    return groups?.length ? groups.map(g => g.group_name).join(', ') : '—';
  }

  formatEventTypes(types: any[] | undefined): string {
    return types?.length ? types.map(t => t.event_name).join(', ') : '—';
  }

  goBack(): void {
    this.router.navigate(['/items']);
  }
}