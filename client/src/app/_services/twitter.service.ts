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

  getTimeline(query: string, paginationToken?: string) {
    const handleRegex = new RegExp('^@(\\w){1,15}$'); //Just check if it's a handle, otherwise go for tags
    var endpoint = handleRegex.test(query) ? "timeline/" + query : "tags/" + encodeURIComponent(query);
    return this.http.get<Timeline>(this.baseUrl + endpoint + (paginationToken ? '?token=' + paginationToken : ''));
  }
}
