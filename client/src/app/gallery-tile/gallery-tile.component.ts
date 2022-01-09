import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Media } from '../_models/media';
import { SettingsService } from '../_services/settings.service';

@Component({
  selector: 'app-gallery-tile',
  templateUrl: './gallery-tile.component.html',
  styleUrls: ['./gallery-tile.component.css']
})
export class GalleryTileComponent {
  @Input() allowSearch: boolean = false;
  @Input() media?: Media;
  @Output() openOverlay = new EventEmitter();
  imageLoaded: boolean = false; //Flag for if the image has loaded

  constructor(public settingsService: SettingsService) {}

  openLink(url?: string) {
    if (url) window.open(url, "_blank");
  }
}
