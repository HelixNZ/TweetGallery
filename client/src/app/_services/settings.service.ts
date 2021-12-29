import { Injectable } from '@angular/core';
import { Filters } from '../_models/filters';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  filters: Filters = { video: true, photo: true, flaggedSensitive: false };

  constructor() {
    this.filters.flaggedSensitive = localStorage.getItem("showSensitiveTweets") == "true" ? true : false;
  }

  saveSettings() {
    localStorage.setItem("showSensitiveTweets", this.filters.flaggedSensitive ? "true" : "false");
  }
}
