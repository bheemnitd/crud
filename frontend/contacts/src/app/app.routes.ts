import { Routes } from '@angular/router';
import { ItemResolver } from './item.resolver';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/items',
    pathMatch: 'full'
  },
  {
    path: 'items',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/get/items').then(m => m.ItemsComponent),
        title: 'Contacts List'
      },
      {
        path: 'create',
        loadComponent: () => import('./components/create/item-create').then(m => m.ItemCreateComponent),
        title: 'Create Contact'
      },
      {
        path: ':id',
        loadComponent: () => import('./components/retrieve/item-detail').then(m => m.ItemDetailComponent),
        title: 'View Contact'
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/update/item-form').then(m => m.ItemFormComponent),
        resolve: { item: ItemResolver },
        title: 'Edit Contact'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/items',
    pathMatch: 'full'
  }
];
