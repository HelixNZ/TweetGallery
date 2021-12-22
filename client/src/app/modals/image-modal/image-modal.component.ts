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

  constructor(public modalService: NgbModal) { }

  openImageInNewWindow(url?:string){
    if(url) window.open(url, "_blank");
  }
}
