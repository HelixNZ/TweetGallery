import { Component, Input, OnInit } from '@angular/core';
import { Filters } from '../_models/filters';
import { Media } from '../_models/media';

@Component({
  selector: 'app-gallery-tile',
  templateUrl: './gallery-tile.component.html',
  styleUrls: ['./gallery-tile.component.css']
})
export class GalleryTileComponent implements OnInit {
  @Input() parent: any;
  @Input() media?: Media;
  imageLoaded: boolean = false; //Flag for if the image has loaded

  constructor() { }

  ngOnInit(): void {
  }

  openLink(url?: string) {
    if (url) window.open(url, "_blank");
  }

}
