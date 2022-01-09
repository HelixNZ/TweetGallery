import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Timeline } from '../_models/timeline';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient, private settings: SettingsService) { }

  getTimeline(query: string, paginationToken?: string) {
    const handleRegex = new RegExp('^@(\\w){1,15}$'); //Just check if it's a handle, otherwise go for tags
    let isHandle = handleRegex.test(query);
    let endpoint = isHandle ? "timeline/" + query : "tags/" + encodeURIComponent(query);

    //Build params, scoring only works on tags so ignore scoring for handles
    let params = (paginationToken ? '?token=' + paginationToken : '');
    params += (!isHandle && this.settings.filters.scoring) ? ((params != '' ? "&" : "?") + "minscore=" + String(this.settings.filters.minScore)) : '';

    return this.http.get<Timeline>(this.baseUrl + endpoint + params);
  }
}
