import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Media } from 'src/app/_models/media';

@Component({
  selector: 'app-image-modal',
  templateUrl: './image-modal.component.html',
  styleUrls: ['./image-modal.component.css']
})
export class ImageModalComponent {
  media?: Media;
  imageLoaded: boolean = false;

  constructor(public modalService: NgbModal) { }

  setMedia(media: Media) {
    this.imageLoaded = false;
    this.media = media;
  }

  getCurrentMedia(): Media | undefined {
    return(this.media);
  }

  openImageInNewWindow(){
    if(this.media) window.open(this.media.type === "photo" ? this.media.mediaUrl : this.media.tweetUrl, "_blank");
  }
}
