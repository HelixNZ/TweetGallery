import { Component, HostListener, OnInit } from '@angular/core';
import { TwitterService } from '../_services/twitter.service';
import { User } from '../_models/user';
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
  user?: User;
  timeline?: Timeline;
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
      this.user = (routeData.username as User);
      if (this.user?.id) {
        this.model.handle = this.user.username;
        this.getUserTimeline(this.user.id);
      }
    });
  }

  getUserTimeline(userId: string, paginationToken?: string) {
    this.model.loadingTimeline = true;
    this.twitterService.getUserTimeline(userId, paginationToken).subscribe(timeline => {
      this.timeline = timeline;
      this.model.loadingTimeline = false;
    });
  }

  getNextPage() {
    if (this.timeline?.meta.next_token && this.user) {
      this.model.loadingNextPage = true;
      this.twitterService.getUserTimeline(this.user.id, this.timeline.meta.next_token).subscribe(timeline => {
        if (this.timeline) { //required for strict
          //Copy tweet data 
          this.timeline.data = [...this.timeline.data, ...timeline.data];
          if (this.timeline.includes?.media && timeline.includes?.media) {
            //We have media, and so does the new timeline, append
            this.timeline.includes.media = [...this.timeline.includes.media, ...timeline.includes?.media]; //Copy media data
          }
          else if (timeline.includes?.media) {
            //We don't have media, so just import from this timeline if it has any
            this.timeline.includes = timeline.includes;
          }

          this.timeline.meta.next_token = timeline.meta.next_token; //Store next token
          this.model.loadingNextPage = false;
        }
      });
    }
  }

  openImageModal(media: Media) {
    this.modalRef = this.modalService.open(ImageModalComponent, { centered: true });
    this.modalRef.componentInstance.imageLoaded = false;
    this.modalRef.componentInstance.media = media;
  }

  searchUser() {

    //TODO: add in visual validation here on the form so that the user can see
    //  For now the userid resolver will handle this fine
    //  but this will be something I need to add in the near future to outright
    //  prevent people from navigating
    this.model.loadingUser = true;
    this.router.navigateByUrl('/' + this.model.handle);

    //const regex = new RegExp('^@?(\\w){1,15}$');

    //regex test of the handle before sending it off
    //if (regex.test(this.model.handle)) {
    //this.router.navigateByUrl('/' + this.model.handle);
    //}
    //else {
    //Display validation error
    // }
  }

  openLink(url?: string) {
    if (url) window.open(url, "_blank");
  }

  getMediaTweetUrl(media_key: string) {
    var matchedTweet = this.timeline?.data.find(x => x.attachments?.media_keys?.find(y => y == media_key));

    if (matchedTweet) {
      return 'https://twitter.com/' + this.user?.username + '/status/' + matchedTweet.id;
    }

    return '';
  }

  getImageThumbnail(url?: string) {
    if (url) return url.slice(0, url.lastIndexOf(".")) + "?format=jpg&name=thumb";
    return '';
  }

  updateMediaModal(dir: number) {
    if (dir !== 0 && this.modalRef?.componentInstance?.media &&  //Modal open and has an image already (used for getting next/prev from current)
        this.timeline?.includes?.media && //Timeline has media, used for edge-case and strict
        this.modalRef.componentInstance.imageLoaded) { //Only proceed if image loaded already, otherwise ignore request

      this.modalRef.componentInstance.imageLoaded = false;

      var media = this.timeline.includes.media;
      var media_key = this.modalRef.componentInstance.media.media_key;
      var index = media.findIndex(media => media.media_key === media_key);

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
        if(this.modalRef.componentInstance.media === media[index]) this.modalRef.componentInstance.imageLoaded = true;
        else this.modalRef.componentInstance.media = media[index];
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
