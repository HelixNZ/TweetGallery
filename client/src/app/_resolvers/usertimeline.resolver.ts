import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Timeline } from '../_models/timeline';
import { TwitterService } from '../_services/twitter.service';

@Injectable({
  providedIn: 'root'
})
export class UserTimelineResolver implements Resolve<Timeline | null> {

  constructor(private twitterService: TwitterService) { }

  resolve(route: ActivatedRouteSnapshot): Observable<Timeline | null> {
    const regex = new RegExp('^@?(\\w){1,15}$');
    var username: string = route.paramMap.get('username') || '';

    //Test the url to make sure no invalid injections are pushed
    if (!regex.test(username)) {
      return of(null); //Pushing null will just cause "user not found" to display
    }
    else {
      if (username[0] === '@') username = username.slice(1); //strip @ if we got an @handle for some reason
      return this.twitterService.getUserTimeline(username);
    }

  }
}
