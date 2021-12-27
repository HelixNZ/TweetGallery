import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HandleResolver implements Resolve<string | null> {
  resolve(route: ActivatedRouteSnapshot): Observable<string | null> {
    const regex = new RegExp('^@(\\w){1,15}$');
    var handle: string = route.paramMap.get('handle') || '';

    //Test if it's a valid handle
    if (regex.test(handle) || regex.test("@" + handle)) return of(handle);
    return of(null); //Invalid handle, empty out and don't register it
  }
}
