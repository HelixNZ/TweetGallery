import { Injectable } from '@angular/core';
import { Filters } from '../_models/filters';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  filters: Filters = { video: true,
                       photo: true,
                       flaggedSensitive: false,
                       showFlag: true,
                       scoring: true,
                       tagLimiting: true,
                       minScore: 15,
                       maxTags: 7 };

  constructor() {
    //Set defaults, taking into account null values (that's why some are == "true" and others are "false" to insert correct value)
    this.filters.flaggedSensitive = localStorage.getItem("showSensitiveTweets") == "true" ? true : false;
    this.filters.showFlag = localStorage.getItem("showFlagIcon") == "false" ? false : true;
    this.filters.scoring = localStorage.getItem("filterByScore") == "false" ? false : true;
    this.filters.tagLimiting = localStorage.getItem("filterByTags") == "false" ? false : true;
    this.filters.minScore = Number(localStorage.getItem("minScore") == null ? 15 : localStorage.getItem("minScore"));
    this.filters.maxTags = Number(localStorage.getItem("maxTags") == null ? 7 : localStorage.getItem("maxTags"));
  }

  saveSettings() {
    localStorage.setItem("showSensitiveTweets", this.filters.flaggedSensitive ? "true" : "false");
    localStorage.setItem("showFlagIcon", this.filters.showFlag ? "true" : "false");
    localStorage.setItem("filterByScore", this.filters.scoring ? "true" : "false");
    localStorage.setItem("filterByTags", this.filters.tagLimiting ? "true" : "false");
    localStorage.setItem("minScore", String(this.filters.minScore));
    localStorage.setItem("maxTags", String(this.filters.maxTags));
  }
}
