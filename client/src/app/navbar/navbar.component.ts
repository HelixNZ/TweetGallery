import { Component, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Filters } from '../_models/filters';
import { Timeline } from '../_models/timeline';
import { BusyService } from '../_services/busy.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @Input() timeline?: Timeline;
  @Input() filters: Filters = { video: true, photo: true, flaggedSensitive: false };
  @Input() query: string = "";

  constructor(public busyService: BusyService, private router: Router) { }

  ngOnInit(): void {
  }

  searchUser() {
    const handleRegex = new RegExp('^@(\\w{1,15})$'); //If matched to this, search by handle, otherwise tag search
    var route = handleRegex.test(this.query) ? "/" + this.query : "tags/" + encodeURIComponent(this.query);
    this.router.navigateByUrl(route);
  }

  toggleShowFlagged() {
    this.filters.flaggedSensitive = !this.filters.flaggedSensitive;
    localStorage.setItem("showSensitiveTweets", this.filters.flaggedSensitive ? "true" : "false");
  }

  togglePhotoFilter() {
    this.filters.photo = !this.filters.photo;
    if (!this.filters.photo) this.filters.video = true;
  }

  toggleVideoFilter() {
    this.filters.video = !this.filters.video;
    if (!this.filters.video) this.filters.photo = true;
  }

}
