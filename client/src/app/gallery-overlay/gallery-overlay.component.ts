import { Component, HostListener, Input } from '@angular/core';
import { Filters } from '../_models/filters';
import { Media } from '../_models/media';
import { Timeline } from '../_models/timeline';

@Component({
  selector: 'app-gallery-overlay',
  templateUrl: './gallery-overlay.component.html',
  styleUrls: ['./gallery-overlay.component.css']
})
export class GalleryOverlayComponent {
  @Input() timeline?: Timeline;
  @Input() media?: Media;
  @Input() filters: Filters = { video: true, photo: true, flaggedSensitive: false };
  visible: boolean = false;
  imageLoaded: boolean = false;
  swipeCoord?: [number, number];
  swipeTime?: number;

  show(media: Media) {
    document.body.style.overflow = "hidden";
    this.imageLoaded = false;
    this.media = media;
    this.visible = true;
  }

  hide() {
    this.visible = false;
    document.body.style.overflow = "";
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
      if (dir !== 0 && (this.filters.photo || this.filters.video)) {
        while (true) {
          index += dir;
          if (index < 0) index = media.length - 1;
          else if (media && index >= media.length) index = 0;

          if (media[index].type === 'photo' && this.filters.photo) break;
          if (media[index].type !== 'photo' && this.filters.video) break;
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
    var dir = (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0);
    this.navigateMedia(dir);
  }

  //Swipe support
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
        this.navigateMedia((direction[0] < 0 ? 1 : -1));
      }
    }
  }
}
