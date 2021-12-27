import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TagResolver implements Resolve<string | null> {
  resolve(route: ActivatedRouteSnapshot): Observable<string | null> {
    const regex = new RegExp('^(-?((@|#|$)|((from|to|is|has):))?(\\w){1,15} ?){1,3}$'); //support up to 3 tags/topics
    var tags: string = route.paramMap.get('tags') || '';

    //Test if the query is valid and usable
    if (regex.test(tags)) return of(tags);
    return of(null); //Invalid/unsupported search query
  }
}
