import { ClipboardModule } from '@angular/cdk/clipboard';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileManagerService } from '@cloud/main/shared/services/file-manager/file-manager.service';
import { SalonService } from '@cloud/main/shared/services/salon/salon.service';
import { SharedModule } from '@cloud/main/shared/shared.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { SalonDetailRoutingModule } from './salon-detail-routing.module';
import { SalonDetailComponent } from './salon-detail.component';
import { AddSalonUserDialogComponent } from './salon-users/add-salon-user-dialog/add-salon-user-dialog.component';
import { SalonUsersComponent } from './salon-users/salon-users.component';
import { SalonFilesService } from '@cloud/main/shared/services/salon/salon-files.service';

@NgModule({
  imports: [
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    CdkTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDialogModule,
    MatAutocompleteModule,

    ClipboardModule,

    CommonModule,
    FuseSharedModule,
    SalonDetailRoutingModule,
    SharedModule,
  ],
  declarations: [SalonDetailComponent, SalonUsersComponent, AddSalonUserDialogComponent],
  providers: [SalonService, FileManagerService, SalonFilesService],
})
export class SalonDetailModule {}
