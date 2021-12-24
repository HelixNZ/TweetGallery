import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UserTimelineResolver } from './_resolvers/usertimeline.resolver';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: ':username', component: HomeComponent, resolve: { username: UserTimelineResolver } },

  //Using the userID resolver for all paths so we can just catch all errors
  { path: '**', component: HomeComponent, resolve: { username: UserTimelineResolver }, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
