import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeComponent } from './home/home.component';
import { MiddleClickDirective } from './_directives/middle-click.directive';
import { GalleryTileComponent } from './gallery-tile/gallery-tile.component';
import { GalleryOverlayComponent } from './gallery-overlay/gallery-overlay.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    MiddleClickDirective,
    GalleryTileComponent,
    GalleryOverlayComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
