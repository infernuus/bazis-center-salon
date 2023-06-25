import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@cloud/main/shared/guards/auth.guard';
import { PermissionsGuard, PermissionsGuardData } from '@cloud/main/shared/guards/permissions.guard';

import { SalonListComponent } from './salon-list.component';
import { SalonListService } from './salon-list.service';

const routes: Routes = [
  {
    path: 'salon-data-upd/salons',
    component: SalonListComponent,
    resolve: {
      data: SalonListService,
    },
    canActivate: [AuthGuard, PermissionsGuard],
    data: {
      permissions: [94],
    } as PermissionsGuardData,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [AuthGuard],
})
export class SalonListRoutingModule {}
