import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ItemsComponent } from './components/get/items';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, RouterLink, ItemsComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  successMessage: string | null = null;
  private subscription: any;

  constructor(private router: Router) {}

  ngOnInit() {
    // Listen for route changes to check for success messages
    this.subscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state?.['success']) {
        this.successMessage = navigation.extras.state['success'];
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}