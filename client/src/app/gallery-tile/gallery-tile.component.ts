import { Component, Input, OnInit } from '@angular/core';
import { Media } from '../_models/media';

@Component({
  selector: 'app-gallery-tile',
  templateUrl: './gallery-tile.component.html',
  styleUrls: ['./gallery-tile.component.css']
})
export class GalleryTileComponent implements OnInit {
  @Input() parent: any;
  @Input() media?: Media;
  @Input() filters = {video: true, photo: true, nsfw: false};
  imageLoaded: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  openLink(url?: string) {
    if (url) window.open(url, "_blank");
  }

}
