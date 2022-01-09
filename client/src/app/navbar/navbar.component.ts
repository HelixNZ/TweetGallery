import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Timeline } from '../_models/timeline';
import { BusyService } from '../_services/busy.service';
import { SettingsService } from '../_services/settings.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Input() timeline?: Timeline;
  @Input() query: string = "";

  constructor(public busyService: BusyService, 
              public settingsService: SettingsService,
              private router: Router) { }

  search() {
    const handleRegex = new RegExp('^@(\\w{1,15})$'); //If matched to this, search by handle, otherwise tag search
    let route = handleRegex.test(this.query) ? "/" + this.query : "tags/" + encodeURIComponent(this.query);
    this.router.navigateByUrl(route);
  }

  saveOptions() {
    this.settingsService.saveSettings(); //Flagged is stored locally
  }

  togglePhotoFilter() {
    this.settingsService.filters.photo = !this.settingsService.filters.photo;
    if (!this.settingsService.filters.photo) this.settingsService.filters.video = true; //Flip+enforce video filter
  }

  toggleVideoFilter() {
    this.settingsService.filters.video = !this.settingsService.filters.video;
    if (!this.settingsService.filters.video) this.settingsService.filters.photo = true; //Flip+enforce photo filter
  }
}
