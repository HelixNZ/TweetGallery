import { Component, HostListener, OnInit } from '@angular/core';
import { TwitterService } from '../_services/twitter.service';
import { User } from '../_models/user';
import { Timeline } from '../_models/timeline';
import { ActivatedRoute, Router } from '@angular/router';
import { Tweet } from '../_models/tweet';
import { NgbModal, NgbModalConfig, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
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

  constructor(
    private twitterService: TwitterService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    public router: Router) {
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

  getUserTimeline(userId: string) {
    this.twitterService.getUserTimeline(userId).subscribe(timeline => {
      this.timeline = timeline;
    });
  }

  openImageModal(media: Media) {
    this.modalRef = this.modalService.open(ImageModalComponent, { centered: true });
    this.modalRef.componentInstance.media = media;
  }

  getMediaTweetUrl(media_key: string) {
    var matchedTweet = this.timeline?.data.find(x => x.attachments?.media_keys?.find(y => y == media_key));

    if (matchedTweet) {
      return 'https://twitter.com/' + this.user?.username + '/status/' + matchedTweet.id;
    }

    return '';
  }

  @HostListener('window:keyup', ['$event'])
  public keyup(event: KeyboardEvent): any {
    if (this.modalRef?.componentInstance?.media && this.timeline?.includes?.media) {
      var media = this.timeline.includes.media;
      var media_key = this.modalRef.componentInstance.media.media_key;
      var index = this.timeline.includes.media.findIndex(media => media.media_key === media_key);
      var push = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;

      if (push !== 0) {
        while (true) {
          index += push;
          if (index < 0) index = media.length - 1;
          else if (media && index >= media.length) index = 0;

          if(media[index].type === 'photo' && this.model.showPhotos) break;
          if(media[index].type !== 'photo' && this.model.showVideos) break;
        }

        this.modalRef.componentInstance.media = media[index];
      }
    }
  }
}
