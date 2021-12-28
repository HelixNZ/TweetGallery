import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Media } from '../_models/media';

@Component({
  selector: 'app-gallery-tile',
  templateUrl: './gallery-tile.component.html',
  styleUrls: ['./gallery-tile.component.css']
})
export class GalleryTileComponent {
  @Input() media?: Media;
  @Output() openOverlay = new EventEmitter();
  imageLoaded: boolean = false; //Flag for if the image has loaded

  openLink(url?: string) {
    if (url) window.open(url, "_blank");
  }
}
