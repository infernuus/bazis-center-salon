import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@cloud/main/shared/guards/auth.guard';
import { PermissionsGuard, PermissionsGuardData } from '@cloud/main/shared/guards/permissions.guard';

import { SalonDetailComponent } from './salon-detail.component';

const routes: Routes = [
  {
    path: 'salon-data-upd/salons/new',
    component: SalonDetailComponent,
    canActivate: [AuthGuard, PermissionsGuard],
    data: {
      permissions: [95],
    } as PermissionsGuardData,
  },
  {
    path: 'salon-data-upd/salons/:id',
    component: SalonDetailComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [AuthGuard],
})
export class SalonDetailRoutingModule {}
