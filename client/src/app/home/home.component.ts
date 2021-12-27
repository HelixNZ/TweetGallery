import { Component, OnInit } from '@angular/core';
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
  modalRef?: NgbModalRef;
  states = {multiplePages: false, loading: false, loadingNextPage: false};
  query = "";
  filters = {video: true, photo: true, nsfw: false};

  constructor(
    private twitterService: TwitterService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.filters.photo = true;
    this.filters.video = true;
    this.filters.nsfw = localStorage.getItem("showSensitiveTweets") == "true" ? true : false;

    this.route.data.subscribe(routeData => {
      var handle = (routeData.handle as string);
      var tags = (routeData.tags as string);

      var query = handle ? handle : tags ? tags : undefined;

      if(query) {
        this.query = query; //temporary while we load the timeline
        this.states.loading = true;
        
        this.twitterService.getTimeline(query).subscribe(timeline => {
          this.timeline = timeline;
          this.query = this.timeline.query;
          this.states.loading = false; //Don't show loading for future, load silently

          //Peek & store future?
          if(timeline.nextPageToken && query){
            this.twitterService.getTimeline(query, timeline.nextPageToken).subscribe(futureTimeline => {
              this.futureTimeline = futureTimeline;
              if(futureTimeline.media) this.states.multiplePages = true; //Prevents the EOF message being displayed for single page results
            });
          }
        });
      }
    });
  }

  enableExplicit() {
    //TODO: Display warning message (Are you over 18 years old? before allowing this to be set true)
    this.filters.nsfw = !this.filters.nsfw;
    localStorage.setItem("showSensitiveTweets", this.filters.nsfw? "true": "false");
  }

  getNextPage() {
    if(this.timeline && this.futureTimeline?.media) {
      this.states.loading = true;

      //Use preloaded timeline
      if(this.timeline.media && this.futureTimeline.media) this.timeline.media = [...this.timeline.media, ...this.futureTimeline.media];
      else if(this.futureTimeline.media) this.timeline.media = this.futureTimeline.media;

      //Grab next page if there is one
      if (this.futureTimeline?.nextPageToken) {
        this.twitterService.getTimeline(this.timeline.query, this.futureTimeline.nextPageToken).subscribe(timeline => {
          this.futureTimeline = timeline;
          this.states.loading = false;
        });
      }
      else {
        this.futureTimeline = undefined;
        this.states.loading = false;
      }
    }
  }

  imageModalDismissed() : boolean {
    document.body.style.overflowY = "scroll";
    return(true);
  }

  openImageModal(media: Media) {
    this.modalRef = this.modalService.open(ImageModalComponent, { centered: true, beforeDismiss: this.imageModalDismissed});
    this.modalRef.componentInstance.timeline = this.timeline;
    this.modalRef.componentInstance.media = media;
    this.modalRef.componentInstance.filters = this.filters;
    document.body.style.overflowY = "hidden";
  }

  searchUser() { //TODO: Validate the form
    this.states.loading = true;
    const handleRegex = new RegExp('^@(\\w){1,15}$'); //support up to 3 tags/topics
    const tagRegex = new RegExp('^(-?((@|#|$)|((from|to|is|has):))?(\\w){1,15} ?){1,3}$'); //support up to 3 tags/topics
    var route = handleRegex.test(this.query) ? "/" + this.query : tagRegex.test(this.query) ? "tags/" + encodeURIComponent(this.query) : "/";
    this.router.navigateByUrl(route);
  }
}
