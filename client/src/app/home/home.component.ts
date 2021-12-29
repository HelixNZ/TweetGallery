import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Timeline } from '../_models/timeline';
import { ActivatedRoute, Router } from '@angular/router';
import { Media } from '../_models/media';
import { GalleryOverlayComponent } from '../gallery-overlay/gallery-overlay.component';
import { ApiService } from '../_services/api.service';
import { BusyService } from '../_services/busy.service';
import { SettingsService } from '../_services/settings.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('galleryOverlay') galleryOverlay?: GalleryOverlayComponent;

  timeline?: Timeline; //Main timeline being displayed
  futureTimeline?: Timeline; //Peek ahead for UX
  multiplePages: boolean = false; //More than one page has been successfully loaded
  query = ""; //Query used and confirmed by the API
  errors: string[] = []; //API errors

  constructor(
    private apiService: ApiService,
    public busyService: BusyService,
    public settingsService: SettingsService,
    private route: ActivatedRoute,
    private router: Router) {
    //With or without this is fine. With feels nicer for UX, but without is also nice
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.route.data.subscribe(routeData => {
      var handle = (routeData.handle as string);
      var tags = (routeData.tags as string);

      var query = handle ? handle : tags ? tags : undefined;

      if (query) {
        this.query = query; //temporary while we load the timeline

        this.apiService.getTimeline(query).subscribe(timeline => {
          if (timeline) {
            this.timeline = timeline;
            this.query = this.timeline.query;

            //Peek & store future?
            if (timeline.nextPageToken && query) {
              this.apiService.getTimeline(query, timeline.nextPageToken).subscribe(futureTimeline => {
                this.futureTimeline = futureTimeline;
                if (futureTimeline?.media) this.multiplePages = true; //Prevents the EOF message being displayed for single page results
              });
            }
          } else {
            //No content
            if (tags) this.errors.push("No media found for \"" + this.query + "\" in the past 7 days");
            if (handle) this.errors.push(this.query + " hasn't posted any media recently");
          }
        }, error => {
          if (error.status === 500) { //500 will have an object
            this.errors.push(error.error.message);
            this.errors.push(error.error.details);
          } else {
            this.errors.push(error.error);
          }
        });
      }
    });
  }

  isScrolledDown() {
    return window.scrollY > 200;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  shouldDisplay(media: Media): boolean {
    var filtered = (media.type === 'photo' && this.settingsService.filters.photo) ||
      (media.type !== 'photo' && this.settingsService.filters.video);

    //Flagged Sensitive check
    filtered = filtered && ((media.possiblySensitive && this.settingsService.filters.flaggedSensitive) || !media.possiblySensitive);

    return filtered;
  }

  getNextPage() {
    if (this.timeline && this.futureTimeline?.media) {

      //Use preloaded timeline
      if (this.timeline.media && this.futureTimeline.media) this.timeline.media = [...this.timeline.media, ...this.futureTimeline.media];
      else if (this.futureTimeline.media) this.timeline.media = this.futureTimeline.media;

      //Grab next page if there is one
      if (this.futureTimeline?.nextPageToken) {
        this.apiService.getTimeline(this.timeline.query, this.futureTimeline.nextPageToken).subscribe(timeline => {
          this.futureTimeline = timeline;
        });
      }
      else {
        this.futureTimeline = undefined;
      }
    }
  }

  @HostListener('window:scroll', ['$event'])
  public scroll(event: any): any {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      if (!this.busyService.isBusy()) this.getNextPage(); //Consider putting a timer on this, however loadingNextPage should be enough
    }
  }
}
