import { Injectable } from '@angular/core';
import {
  Resolve,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../_models/user';
import { TwitterService } from '../_services/twitter.service';

@Injectable({
  providedIn: 'root'
})
export class UserIdResolver implements Resolve<User> {

  constructor(private twitterService: TwitterService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<User> {
    return this.twitterService.getUserByUsername(route.paramMap.get('username') || '');
  }
}
