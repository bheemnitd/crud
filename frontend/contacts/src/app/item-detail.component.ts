import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Item } from './item.model';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './item-detail.html',
  styleUrls: ['./item-detail.css']
})
export class ItemDetailComponent {
  item: Item | null = null;
  loading = false;
  error: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    // Get the pre-fetched item from the route data
    this.route.data.subscribe(data => {
      this.item = data['item'] || null;
    });
  }

  goEdit(): void {
    if (!this.item) return;
    this.router.navigate([`/items/${this.item.id}/edit`]);
  }

  goBack(): void {
    this.router.navigate(['/items']);
  }
}