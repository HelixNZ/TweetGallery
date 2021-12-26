import { Component, HostListener, OnInit } from '@angular/core';
import { TwitterService } from '../_services/twitter.service';
import { Timeline } from '../_models/timeline';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ImageModalComponent } from '../modals/image-modal/image-modal.component';
import { Media } from '../_models/media';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  timeline?: Timeline;
  futureTimeline?: Timeline;
  model: any = [];
  modalRef?: NgbModalRef;

  //image swipe left/right
  swipeCoord?: [number, number];
  swipeTime?: number;

  constructor(
    private twitterService: TwitterService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.model.showPhotos = true;
    this.model.showVideos = true;

    this.route.data.subscribe(routeData => {
      var username = (routeData.username as string);
      if(username){
        this.model.handle = username; //temporary while we load the timeline
        this.model.loadingTimeline = true;

        this.twitterService.getUserTimeline(username).subscribe(timeline => {
          this.timeline = timeline;
          this.model.handle = this.timeline.username;
          this.model.loadingTimeline = false; //Don't show loading for future, load silently

          this.buildLinkPreview();

          //Peek & store future?
          if(timeline.nextPageToken){
            this.twitterService.getUserTimeline(username, timeline.nextPageToken).subscribe(futureTimeline => {
              this.futureTimeline = futureTimeline;
              if(futureTimeline.media) this.model.multiplePages = true; //Prevents the EOF message being displayed for single page results
            });
          }
        });
      }
    });
  }

  buildLinkPreview() {
    if(this.timeline) {
      var ogTitle = document.createElement('meta');
      ogTitle.setAttribute("property", "og:title");
      ogTitle.setAttribute("content", "Twitter gallery for @" + this.timeline.username);
      document.head.appendChild(ogTitle);

      var ogUrl = document.createElement('meta');
      ogUrl.setAttribute("property", "og:url");
      ogUrl.setAttribute("content", "https://twittergallery.herokuapp.com/" + this.timeline.username);
      document.head.appendChild(ogUrl);

      var ogDesc = document.createElement('meta');
      ogDesc.setAttribute("property", "og:description");
      ogDesc.setAttribute("content", "Click to view the gallery of @" + this.timeline.username);
      document.head.appendChild(ogDesc);

      var ogImage = document.createElement('meta');
      ogImage.setAttribute("property", "og:image");
      ogImage.setAttribute("content", this.timeline.profileImg);
      document.head.appendChild(ogImage);
    }
  }

  getNextPage() {
    if(this.timeline && this.futureTimeline?.media) {
      this.model.loadingNextPage = true;

      //Use preloaded timeline
      this.timeline.media = [...this.timeline.media, ...this.futureTimeline.media];

      //Grab next page if there is one
      if (this.futureTimeline?.nextPageToken) {
        this.twitterService.getUserTimeline(this.timeline.username, this.futureTimeline.nextPageToken).subscribe(timeline => {
          this.futureTimeline = timeline;
          this.model.loadingNextPage = false;
        });
      }
      else {
        this.futureTimeline = undefined;
        this.model.loadingNextPage = false;
      }
    }
  }

  openImageModal(media: Media) {
    this.modalRef = this.modalService.open(ImageModalComponent, { centered: true });
    this.modalRef.componentInstance.imageLoaded = false;
    this.modalRef.componentInstance.media = media;
  }

  searchUser() { //TODO: Validate the form
    this.model.loadingTimeline = true;
    this.router.navigateByUrl('/' + this.model.handle);
  }

  openLink(url?: string) {
    if (url) window.open(url, "_blank");
  }

  updateMediaModal(dir: number) {
    var componentInstance = this.modalRef?.componentInstance;

    if (dir !== 0 && componentInstance?.media &&  //Modal open and has an image already (used for getting next/prev from current)
      this.timeline?.media) { //Timeline has media, used for edge-case and strict
      //componentInstance.imageLoaded) { //Only proceed if image loaded already, otherwise ignore request

      componentInstance.imageLoaded = false;

      var media = this.timeline.media;
      var index = media.findIndex(x => x === componentInstance.media);

      //If user wants to cycle in a direction
      //  and if we are showing either media type.
      //This is an edge case but if the user somehow opens the modal
      //  with both filters off, they can lock up their browser....
      if (dir !== 0 && (this.model.showPhotos || this.model.showVideos)) {
        while (true) {
          index += dir;
          if (index < 0) index = media.length - 1;
          else if (media && index >= media.length) index = 0;

          if (media[index].type === 'photo' && this.model.showPhotos) break;
          if (media[index].type !== 'photo' && this.model.showVideos) break;
        }

        //Fix for infinite load
        if (componentInstance.media === media[index]) componentInstance.imageLoaded = true;
        else componentInstance.media = media[index];
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  public keyup(event: KeyboardEvent): any {
    var push = (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0);
    this.updateMediaModal(push);
  }

  @HostListener('window:touchstart', ['$event'])
  public swipe_start(event: TouchEvent): any {
    const coord: [number, number] = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
    const time = new Date().getTime();

    this.swipeCoord = coord;
    this.swipeTime = time;
  }

  @HostListener('window:touchend', ['$event'])
  public swipe_end(event: TouchEvent): any {
    if (this.swipeTime && this.swipeCoord) {
      const coord: [number, number] = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
      const time = new Date().getTime();

      const direction = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
      const duration = time - this.swipeTime;

      if (duration < 1000 //
        && Math.abs(direction[0]) > 30 // Long enough
        && Math.abs(direction[0]) > Math.abs(direction[1] * 3)) { // Horizontal enough
        const swipe = direction[0] < 0 ? 1 : -1;
        this.updateMediaModal(swipe);
      }
    }
  }
}
