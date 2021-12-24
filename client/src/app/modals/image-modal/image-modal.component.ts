import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Media } from 'src/app/_models/media';

@Component({
  selector: 'app-image-modal',
  templateUrl: './image-modal.component.html',
  styleUrls: ['./image-modal.component.css']
})
export class ImageModalComponent {
  @Input() public media?: Media;
  @Input() public imageLoaded: boolean = false;

  constructor(public modalService: NgbModal) { }

  openImageInNewWindow(){
    if(this.media) window.open(this.media.type === "photo" ? this.media.mediaUrl : this.media.tweetUrl, "_blank");
  }
}
