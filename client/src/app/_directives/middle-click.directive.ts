import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[middleclick]'
})
export class MiddleClickDirective {
  @Output('middleclick') middleclick = new EventEmitter();

  constructor() { }

  @HostListener('mousedown', ['$event'])
  mmbPress(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault(); //Ignore mmb click scroll
    }
  }

  @HostListener('mouseup', ['$event'])
  mmbRelease(event: MouseEvent) {
    if (event.button === 1) {
      this.middleclick.emit(event); //Enable (middleclick) in templates
    }
  }
}
