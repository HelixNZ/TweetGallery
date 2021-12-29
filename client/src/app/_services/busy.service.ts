import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BusyService {
  private busyRequestCount = 0;

  constructor() { }

  busy() {
    ++this.busyRequestCount;
  }

  idle() {
    --this.busyRequestCount;
  }

  isBusy() {
    return (this.busyRequestCount > 0);
  }
}
