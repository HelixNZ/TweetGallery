import { Component, HostListener, Input } from '@angular/core';
import { Media } from '../_models/media';
import { Timeline } from '../_models/timeline';
import { SettingsService } from '../_services/settings.service';

@Component({
  selector: 'app-gallery-overlay',
  templateUrl: './gallery-overlay.component.html',
  styleUrls: ['./gallery-overlay.component.css']
})
export class GalleryOverlayComponent {
  @Input() timeline?: Timeline;
  media?: Media;
  visible: boolean = false;
  imageLoaded: boolean = false;
  swipeCoord?: [number, number];
  swipeTime?: number;

  constructor(public settingsService: SettingsService) { }

  show(media: Media) {
    document.body.style.overflowY = "hidden";
    document.body.style.touchAction = "pan-x";
    this.imageLoaded = false;
    this.media = media;
    this.visible = true; //display after setup
  }

  hide() {
    this.visible = false; //hide before the scrollbar comes back
    document.body.style.overflowY = "";
    document.body.style.touchAction = ""; //consider not doing this
  }

  openImageInNewWindow() {
    if (this.media) window.open(this.media.type === "photo" ? this.media.mediaUrl : this.media.tweetUrl, "_blank");
  }

  navigateMedia(dir: number) {
    if (dir !== 0 && this.media !== undefined && this.timeline?.media) { //Timeline has media, used for edge-case and strict

      var media = this.timeline.media;
      var index = media.findIndex((x: Media) => x === this.media);

      //If user wants to cycle in a direction
      //  and if we are showing either media type.
      //This is an edge case but if the user somehow opens the modal
      //  with both filters off, they can lock up their browser....
      if (dir !== 0 && (this.settingsService.filters.photo || this.settingsService.filters.video)) {
        while (true) {
          index += dir;
          if (index < 0) index = media.length - 1;
          else if (media && index >= media.length) index = 0;

          if (media[index].type === 'photo' && this.settingsService.filters.photo) break;
          if (media[index].type !== 'photo' && this.settingsService.filters.video) break;
        }

        if (this.media !== media[index]) {
          this.imageLoaded = false;
          this.media = media[index];
        }
      }
    }
  }

  //Keypress
  @HostListener('window:keyup', ['$event'])
  public keyup(event: KeyboardEvent): any {
    if(this.visible) {
      var dir = (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0);
      this.navigateMedia(dir);
    }
  }

  //Swipe support
  @HostListener('window:touchstart', ['$event'])
  public swipe_start(event: TouchEvent): any {
    if(this.visible) {
      event.preventDefault(); //block all other swipes

      const coord: [number, number] = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
      const time = new Date().getTime();
  
      this.swipeCoord = coord;
      this.swipeTime = time;
    }
  }

  @HostListener('window:touchend', ['$event'])
  public swipe_end(event: TouchEvent): any {
    if(this.visible) {
      if (this.swipeTime && this.swipeCoord) {
        const coord: [number, number] = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
        const time = new Date().getTime();

        const direction = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
        const duration = time - this.swipeTime;

        if (duration < 1000 //
          && Math.abs(direction[0]) > 30 // Long enough
          && Math.abs(direction[0]) > Math.abs(direction[1] * 3)) { // Horizontal enough
          this.navigateMedia((direction[0] < 0 ? 1 : -1));
        }
      }
    }
  }
}
