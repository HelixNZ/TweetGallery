import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HandleResolver implements Resolve<string | null> {
  resolve(route: ActivatedRouteSnapshot): Observable<string | null> {
    var handle = route.paramMap.get('handle');
    if(handle && !handle.startsWith("@")) handle = "@" + handle;
    return of(handle);
  }
}
