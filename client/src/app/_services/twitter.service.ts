import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Timeline } from '../_models/timeline';
import { User } from '../_models/user';

@Injectable({
  providedIn: 'root'
})
export class TwitterService {
  baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUserByUsername(username: string) {
    return this.http.get<User>(this.baseUrl + username);
  }

  getUserTimeline(userId: string) {
    return this.http.get<Timeline>(this.baseUrl + 'timeline/' + userId);
  }
}
