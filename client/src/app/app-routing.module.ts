import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UserIdResolver } from './_resolvers/userid.resolver';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: ':username', component: HomeComponent, resolve: { username: UserIdResolver } },

  //Using the userID resolver for all paths so we can just catch all errors
  { path: '**', component: HomeComponent, resolve: { username: UserIdResolver }, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
