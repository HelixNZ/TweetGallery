import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { TagResolver } from './_resolvers/tag.resolver';
import { UserTimelineResolver } from './_resolvers/usertimeline.resolver';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tags/:tags', component: HomeComponent, resolve: { tags: TagResolver } },
  { path: ':username', component: HomeComponent, resolve: { username: UserTimelineResolver } },

  //Using the tag resolver for all paths so we can just catch all errors
  { path: '**', component: HomeComponent, resolve: { tags: TagResolver }, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
