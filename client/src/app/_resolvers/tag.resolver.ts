import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TagResolver implements Resolve<string | null> {
  resolve(route: ActivatedRouteSnapshot): Observable<string | null> {
    return of(route.paramMap.get('tags'));
  }
}
