import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { TwitterService } from '../_services/twitter.service';
import { Timeline } from '../_models/timeline';
import { ActivatedRoute, Router } from '@angular/router';
import { Media } from '../_models/media';
import { Filters } from '../_models/filters';
import { GalleryOverlayComponent } from '../gallery-overlay/gallery-overlay.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('galleryOverlay') galleryOverlay?: GalleryOverlayComponent;
  timeline?: Timeline;
  futureTimeline?: Timeline;
  states = { multiplePages: false, loading: false, loadingNextPage: false };
  filters: Filters = { video: true, photo: true, flaggedSensitive: false };
  query = "";
  errors: string[] = [];


  constructor(
    private twitterService: TwitterService,
    private route: ActivatedRoute,
    private router: Router) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.filters.photo = true;
    this.filters.video = true;
    this.filters.flaggedSensitive = localStorage.getItem("showSensitiveTweets") == "true" ? true : false;

    this.route.data.subscribe(routeData => {
      var handle = (routeData.handle as string);
      var tags = (routeData.tags as string);

      var query = handle ? handle : tags ? tags : undefined;

      if (query) {
        this.query = query; //temporary while we load the timeline
        this.states.loading = true;

        this.twitterService.getTimeline(query).subscribe(timeline => {
          if (timeline) {
            this.timeline = timeline;
            this.query = this.timeline.query;

            //Peek & store future?
            if (timeline.nextPageToken && query) {
              this.twitterService.getTimeline(query, timeline.nextPageToken).subscribe(futureTimeline => {
                this.futureTimeline = futureTimeline;
                if (futureTimeline?.media) this.states.multiplePages = true; //Prevents the EOF message being displayed for single page results
              });
            }
          } else {
            //No content
            if (tags) this.errors.push("No media found for \"" + this.query + "\" in the past 7 days");
            if (handle) this.errors.push(this.query + " hasn't posted any media recently");
          }

          this.states.loading = false;
        }, error => {
          if (error.status === 500) {
            this.errors.push(error.error.message);
            this.errors.push(error.error.details);
          } else {
            this.errors.push(error.error);
          }

          this.states.loading = false;
        });
      }
    });
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

  shouldDisplay(media: Media): boolean {
    var filtered = (media.type === 'photo' && this.filters.photo) ||
      (media.type !== 'photo' && this.filters.video);

    //Flagged Sensitive check
    filtered = filtered && ((media.possiblySensitive && this.filters.flaggedSensitive) || !media.possiblySensitive);

    return filtered;
  }

  getNextPage() {
    if (this.timeline && this.futureTimeline?.media) {
      this.states.loadingNextPage = true;

      //Use preloaded timeline
      if (this.timeline.media && this.futureTimeline.media) this.timeline.media = [...this.timeline.media, ...this.futureTimeline.media];
      else if (this.futureTimeline.media) this.timeline.media = this.futureTimeline.media;

      //Grab next page if there is one
      if (this.futureTimeline?.nextPageToken) {
        this.twitterService.getTimeline(this.timeline.query, this.futureTimeline.nextPageToken).subscribe(timeline => {
          this.futureTimeline = timeline;
          this.states.loadingNextPage = false;
        });
      }
      else {
        this.futureTimeline = undefined;
        this.states.loadingNextPage = false;
      }
    }
  }

  openImageModal(media: Media) {
    this.galleryOverlay?.show(media);
  }

  searchUser() {
    this.states.loading = true;
    const handleRegex = new RegExp('^@(\\w{1,15})$'); //If matched to this, search by handle, otherwise tag search
    var route = handleRegex.test(this.query) ? "/" + this.query : "tags/" + encodeURIComponent(this.query);
    this.router.navigateByUrl(route);
  }

  @HostListener('window:scroll', ['$event'])
  public scroll(event: any): any {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      if(!this.states.loadingNextPage) this.getNextPage(); //Consider putting a timer on this, however loadingNextPage should be enough
    }
  }
}
