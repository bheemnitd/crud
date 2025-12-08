import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { ItemsService } from './items.service';
import { Item } from './item.model';

@Injectable({
  providedIn: 'root'
})
export class ItemResolver implements Resolve<Item> {
  constructor(private itemsService: ItemsService) {}

  resolve(route: ActivatedRouteSnapshot) {
    const id = route.paramMap.get('id');
    if (!id) throw new Error('Item ID is required');
    return this.itemsService.getContact(id);
  }
}