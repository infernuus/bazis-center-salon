import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { TranslateManagerService } from 'cloud-shared-lib';
import { catchError, Observable, tap, throwError } from 'rxjs';

export class SalonSettingData {
  id: number;
  name: string;
}

@Component({
  selector: 'cloud-appoint-salon-data-dialog',
  templateUrl: './appoint-salon-data-dialog.component.html',
})
export class AppointSalonDataDialogComponent {
  @ViewChild('settings') settings: MatSelectionList;

  constructor(
    public dialogRef: MatDialogRef<AppointSalonDataDialogComponent>,
    public translateManagerService: TranslateManagerService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      data$: Observable<SalonSettingData[]>;
      callback: (dataId: number) => Observable<void>;
    }
  ) {}

  saveAndClose(): void {
    const dataId: number = this.settings.selectedOptions.selected[0].value;

    this.data
      .callback(dataId)
      .pipe(
        tap(val => {
          this.translateManagerService.openSnackBar($localize`${this.data.title} назначены`);
          this.dialogRef.close();
        }),
        catchError(err => {
          this.translateManagerService.openSnackBar($localize`Ошибка назначения ${this.data.title}`);
          return throwError(() => err);
        })
      )
      .subscribe();
  }
}
