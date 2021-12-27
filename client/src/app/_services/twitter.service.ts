import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Timeline } from '../_models/timeline';

@Injectable({
  providedIn: 'root'
})
export class TwitterService {
  baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUserTimeline(username: string, paginationToken?: string) {
    return this.http.get<Timeline>(this.baseUrl + "timeline/" + username + (paginationToken ? '?token=' + paginationToken : ''));
  }

  searchTags(tags: string, paginationToken?: string) {
    return this.http.get<Timeline>(this.baseUrl + "tags/" + encodeURIComponent(tags) + (paginationToken ? '?token=' + paginationToken : ''));
  }
}
