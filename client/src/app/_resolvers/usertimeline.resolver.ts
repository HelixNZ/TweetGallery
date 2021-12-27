import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { TwitterService } from '../_services/twitter.service';

@Injectable({
  providedIn: 'root'
})
export class UserTimelineResolver implements Resolve<string | null> {

  constructor(private twitterService: TwitterService) { }

  resolve(route: ActivatedRouteSnapshot): Observable<string | null> {
    const regex = new RegExp('^@(\\w){1,15}$');
    var username: string = route.paramMap.get('username') || '';

    //Test the url to make sure no invalid injections are pushed
    if (!regex.test(username) && !regex.test("@" + username)) {
      return of(null); //Pushing null will just cause "user not found" to display
    }
    else {
      return of(username);
    }

  }
}
