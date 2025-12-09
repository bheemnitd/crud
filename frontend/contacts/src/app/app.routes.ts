import { Routes } from '@angular/router';
import { ItemResolver } from './item.resolver';


export const routes: Routes = [
	{ path: '', redirectTo: '/items', pathMatch: 'full' },
	{ path: 'items', loadComponent: () => import('./items.component').then(m => m.ItemsComponent) },
	{ path: 'items/create', loadComponent: () => import('./components/create/item-form').then(m => m.ItemFormComponent) },
	{
		path: 'items/:id',
		loadComponent: () => import('./components/retrieve/item-detail').then(m => m.ItemDetailComponent)

	},
	{
		path: 'items/:id/edit',
		loadComponent: () => import('./components/create/item-form').then(m => m.ItemFormComponent),
		resolve: { item: ItemResolver }
	},
];
