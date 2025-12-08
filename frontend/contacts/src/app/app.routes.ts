import { Routes } from '@angular/router';
import { ItemResolver } from './item.resolver';


export const routes: Routes = [
	{ path: '', redirectTo: '/items', pathMatch: 'full' },
	{ path: 'items', loadComponent: () => import('./items.component').then(m => m.ItemsComponent) },
	{ path: 'items/create', loadComponent: () => import('./item-form.component').then(m => m.ItemFormComponent) },
	{
		path: 'items/:id',
		loadComponent: () => import('./item-detail.component').then(m => m.ItemDetailComponent),
		resolve: { item: ItemResolver }
	},
	{
		path: 'items/:id/edit',
		loadComponent: () => import('./item-form.component').then(m => m.ItemFormComponent),
		resolve: { item: ItemResolver }
	},
];
