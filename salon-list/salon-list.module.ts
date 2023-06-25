import { CdkTableModule } from '@angular/cdk/table';
import { NgModule } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserSelectDialogModule } from '@cloud/main/shared/modules/user-select-dialog/user-select-dialog.module';
import { SalonFilesService } from '@cloud/main/shared/services/salon/salon-files.service';
import { SharedModule } from '@cloud/main/shared/shared.module';
import { FuseConfirmDialogModule, FuseHighlightModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';

import { AppointSalonDataDialogComponent } from './appoint-salon-data-dialog/appoint-salon-data-dialog.component';
import { SalonDetailModule } from './salon-detail/salon-detail.module';
import { SalonListRoutingModule } from './salon-list-routing.module';
import { SalonListComponent } from './salon-list.component';
import { SalonListService } from './salon-list.service';
import { SalonReferenceService } from '@cloud/main/shared/services/reference/salon-reference.service';
import { AppointSalonFilesDialogComponent } from './appoint-salon-files-dialog/appoint-salon-files-dialog.component';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  imports: [
    MatIconModule,
    MatFormFieldModule,
    MatTableModule,
    CdkTableModule,
    MatPaginatorModule,
    MatSelectModule,
    MatToolbarModule,
    MatDialogModule,
    MatSnackBarModule,
    MatInputModule,
    MatSortModule,
    MatButtonModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatListModule,
    MatCardModule,

    SharedModule,
    MatMenuModule,
    FuseSharedModule,
    FuseConfirmDialogModule,
    FuseHighlightModule,
    UserSelectDialogModule,

    SalonListRoutingModule,
    SalonDetailModule,
  ],
  declarations: [SalonListComponent, AppointSalonDataDialogComponent, AppointSalonFilesDialogComponent],
  providers: [SalonListService, SalonFilesService, SalonReferenceService],
})
export class SalonListModule {}
