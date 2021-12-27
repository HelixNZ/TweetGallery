import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TagResolver implements Resolve<string | null> {
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<string | null> {
    const regex = new RegExp('^(-?((@|#|$)|((from|to|is|has):))?(\\w){1,15} ?){1,3}$'); //support up to 3 tags/topics
    var tags: string = route.paramMap.get('tags') || '';

    console.log(tags);

    //Test the url to make sure no invalid injections are pushed
    if (!regex.test(tags)) {
      return of(null); //Pushing null will just cause "user not found" to display
    }
    else {
      return of(tags);
    }
  }
}
