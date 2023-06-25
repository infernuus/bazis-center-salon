import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SalonService } from '@cloud/main/shared/services/salon/salon.service';
import { ICustomResponse, SalonUser, SalonUserGroup, TranslateManagerService } from 'cloud-shared-lib';
import * as _ from 'lodash';
import { Observable, of, Subject } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { SalonListService } from '../../../salon-list.service';

@Component({
  selector: 'cloud-add-salon-user-dialog',
  templateUrl: './add-salon-user-dialog.component.html',
})
export class AddSalonUserDialogComponent implements OnInit, OnDestroy {
  @Input() salonId: number | null = null;
  @Input() groups: SalonUserGroup[];
  originalUser: SalonUser;
  userForm: FormGroup;
  userFormErrors: any;
  unsubscribe$: Subject<void> = new Subject();
  groups$: Observable<ICustomResponse<SalonUserGroup[]>>;
  selectedGroup: SalonUserGroup;
  index: number;
  private _user: SalonUser;

  set user(value: SalonUser) {
    this.originalUser = value;
    this._user = _.cloneDeep(value);
  }
  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddSalonUserDialogComponent>,
    private translateManagerService: TranslateManagerService,
    private salonService: SalonService,
    public salonListService: SalonListService
  ) {
    this.userFormErrors = {
      name: {},
      password: {},
      phone: {},
      email: {},
      note: {},
      blocked: {},
      groupId: {},
    };
  }

  ngOnInit(): void {
    this.userForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.maxLength(50)]],
      phone: ['', Validators.maxLength(40)],
      email: ['', [Validators.email, Validators.maxLength(80)]],
      note: ['', Validators.maxLength(400)],
      blocked: [false, Validators.required],
      groupId: [''],
    });

    this.userForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.onFormValuesChanged();
    });

    this.fillForm();
  }

  selectGroup(groupId: number): void {
    this.selectedGroup = this.groups.find(g => g.id === groupId);
    if (this.selectedGroup.isAdmin) {
      this.userForm.controls.blocked.setValue(false);
    }
  }

  onFormValuesChanged(): void {
    for (const field in this.userFormErrors) {
      this.userFormErrors[field] = {};
      const control = this.userForm.get(field);
      if (control && control.dirty && !control.valid) {
        this.userFormErrors[field] = control.errors;
      }
    }
  }

  addUser(user: SalonUser): void {
    if (this.salonId) {
      this.salonService
        .postSalonUser(this.salonId, [user])
        .pipe(
          tap(() => {
            this.dialogRef.close(true);
            this.translateManagerService.openSnackBar($localize`Пользователь добавлен`);
          }),
          catchError((error: HttpErrorResponse) => {
            if (+error.status === 403) {
              this.translateManagerService.openSnackBar($localize`Пользователь с данным именем уже существует`);
            } else {
              this.translateManagerService.openSnackBar($localize`Ошибка добавления пользователя`);
            }
            return of(undefined);
          }),
          takeUntil(this.unsubscribe$)
        )
        .subscribe();
    } else {
      this.salonListService.tempUsers.push(user);
      this.dialogRef.close(true);
      this.translateManagerService.openSnackBar($localize`Пользователь добавлен`);
    }
  }

  editUser(user: SalonUser): void {
    if (this.salonId) {
      this.salonService
        .putSalonUser(this.salonId, user)
        .pipe(
          tap(() => {
            this.dialogRef.close(true);
            this.translateManagerService.openSnackBar($localize`Пользователь изменен`);
          }),
          catchError((error: HttpErrorResponse) => {
            if (+error.status === 403) {
              this.translateManagerService.openSnackBar($localize`Пользователь с данным именем уже существует`);
            } else {
              this.translateManagerService.openSnackBar($localize`Ошибка изменения пользователя`);
            }
            return of(undefined);
          }),
          takeUntil(this.unsubscribe$)
        )
        .subscribe();
    } else {
      _.merge(this.originalUser, this._user);
      this.dialogRef.close(true);
      this.translateManagerService.openSnackBar($localize`Пользователь изменен`);
    }
  }

  closeDialogAndSaveData(): void {
    this._user.name = this.userForm.controls.name.value;
    this._user.password = this.userForm.controls.password.value;
    this._user.phone = this.userForm.controls.phone.value;
    this._user.email = this.userForm.controls.email.value;
    this._user.note = this.userForm.controls.note.value;
    this._user.blocked = this.userForm.controls.blocked.value;
    this._user.group.id = this.userForm.controls.groupId.value;

    if (this._user.id > 0 || this.originalUser) {
      this.editUser(this._user);
    } else {
      this.addUser(this._user);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
  }

  private fillForm(): void {
    if (!this._user) {
      this._user = new SalonUser();
    }
    this.userForm.patchValue(this._user);
    this.userForm.controls.groupId.setValue(this._user.group.id);
  }
}
