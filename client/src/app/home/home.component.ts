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
  isTagSearch: boolean = false;
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
    this.model.nsfw = localStorage.getItem("showSensitiveTweets") == "true" ? true : false;

    this.route.data.subscribe(routeData => {
      this.isTagSearch = false;
      var username = (routeData.username as string);
      var tags = (routeData.tags as string);

      if(username && username != undefined){
        this.model.handle = username; //temporary while we load the timeline
        this.model.loadingTimeline = true;

        this.twitterService.getUserTimeline(username).subscribe(timeline => {
          this.timeline = timeline;
          this.model.handle = this.timeline.username;
          this.model.loadingTimeline = false; //Don't show loading for future, load silently

          //Peek & store future?
          if(timeline.nextPageToken){
            this.twitterService.getUserTimeline(username, timeline.nextPageToken).subscribe(futureTimeline => {
              this.futureTimeline = futureTimeline;
              if(futureTimeline.media) this.model.multiplePages = true; //Prevents the EOF message being displayed for single page results
            });
          }
        });
      }

      if(tags && tags != undefined){
        this.isTagSearch = true;
        this.model.handle = decodeURIComponent(tags); //temporary while we load the timeline
        this.model.loadingTimeline = true;

        this.twitterService.searchTags(tags).subscribe(timeline => {
          this.timeline = timeline;
          this.model.handle = decodeURIComponent(this.timeline.username);
          this.model.loadingTimeline = false; //Don't show loading for future, load silently

          //Peek & store future?
          if(timeline.nextPageToken){
            this.twitterService.searchTags(tags, timeline.nextPageToken).subscribe(futureTimeline => {
              this.futureTimeline = futureTimeline;
              if(futureTimeline.media) this.model.multiplePages = true; //Prevents the EOF message being displayed for single page results
            });
          }
        });
      }
    });
  }

  enableExplicit() {
    //TODO: Display warning message (Are you over 18 years old? before allowing this to be set true)
    this.model.nsfw = !this.model.nsfw;
    localStorage.setItem("showSensitiveTweets", this.model.nsfw? "true": "false");
  }

  getNextPage() {
    if(this.timeline && this.futureTimeline?.media) {
      this.model.loadingNextPage = true;

      //Use preloaded timeline
      if(this.timeline.media && this.futureTimeline.media) this.timeline.media = [...this.timeline.media, ...this.futureTimeline.media];
      else if(this.futureTimeline.media) this.timeline.media = this.futureTimeline.media;

      //Grab next page if there is one
      if (this.futureTimeline?.nextPageToken) {
        if(this.isTagSearch) {
          this.twitterService.searchTags(this.timeline.username, this.futureTimeline.nextPageToken).subscribe(timeline => {
            console.log(timeline);
            this.futureTimeline = timeline;
            this.model.loadingNextPage = false;
          });
        }
        else{
          this.twitterService.getUserTimeline(this.timeline.username, this.futureTimeline.nextPageToken).subscribe(timeline => {
            this.futureTimeline = timeline;
            this.model.loadingNextPage = false;
          });
        }
      }
      else {
        this.futureTimeline = undefined;
        this.model.loadingNextPage = false;
      }
    }
  }

  imageModalDismissed() : boolean {
    document.body.style.overflowY = "scroll";
    return(true);
  }

  openImageModal(media: Media) {
    this.modalRef = this.modalService.open(ImageModalComponent, { centered: true, beforeDismiss: this.imageModalDismissed});
    this.modalRef.componentInstance.imageLoaded = false;
    this.modalRef.componentInstance.media = media;
    document.body.style.overflowY = "hidden";
  }

  searchUser() { //TODO: Validate the form
    this.model.loadingTimeline = true;
    const handleRegex = new RegExp('^@(\\w){1,15}$'); //support up to 3 tags/topics
    const tagRegex = new RegExp('^(-?((@|#|$)|((from|to|is|has):))?(\\w){1,15} ?){1,3}$'); //support up to 3 tags/topics
    var route = handleRegex.test(this.model.handle) ? "/" + this.model.handle : tagRegex.test(this.model.handle) ? "tags/" + encodeURIComponent(this.model.handle) : "/";
    this.router.navigateByUrl(route);
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
