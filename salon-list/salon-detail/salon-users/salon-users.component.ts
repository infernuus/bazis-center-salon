import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { SalonService } from '@cloud/main/shared/services/salon/salon.service';
import { SalonUser, SalonUserGroup, TranslateManagerService } from 'cloud-shared-lib';
import { Observable, Subject, of } from 'rxjs';
import { filter, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AddSalonUserDialogComponent } from './add-salon-user-dialog/add-salon-user-dialog.component';
import { SalonListService } from '../../salon-list.service';
import { SalonReferenceService } from '@cloud/main/shared/services/reference/salon-reference.service';
import { PermissionsService } from '@cloud/main/shared/services/permissions.service';
import * as _ from 'lodash';

@Component({
  selector: 'cloud-salon-users',
  templateUrl: './salon-users.component.html',
  styleUrls: ['./salon-users.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SalonUsersComponent implements OnInit, OnDestroy {
  @Input() salonId: number | null;
  unsubscribe$: Subject<void> = new Subject();
  data$: Observable<SalonUser[]>;
  groups$: Observable<any[]>;
  dataTemp$: Observable<SalonUser[]>;
  displayedColumns = ['name', 'group', 'phone', 'email', 'note', 'isAdmin', 'blocked', 'edit'];

  groups: SalonUserGroup[] = [];

  dataSource: MatTableDataSource<SalonUser> = new MatTableDataSource<SalonUser>([]);
  addUserDialogRef: MatDialogRef<AddSalonUserDialogComponent>;

  constructor(
    private salonReferenceService: SalonReferenceService,
    private salonListService: SalonListService,
    private salonService: SalonService,
    private dialog: MatDialog,
    public translateManagerService: TranslateManagerService,
    private permissionsService: PermissionsService
  ) {
    this.groups$ = this.salonReferenceService.getUserGroups().pipe(
      filter(d => !!d.result),
      tap(d => (this.groups = d.result)),
      tap(() => this.addSuperAdmin(this.groups.filter(d => d.isAdmin)[0])),
      switchMap(() => (+this.salonId ? of([]) : this.dataTemp$))
    );
  }

  ngOnInit(): void {
    if (!this.permissionsService.has(96) && this.salonId !== null) {
      _.pull(this.displayedColumns, 'blocked');
      _.pull(this.displayedColumns, 'edit');
    }

    if (this.salonId !== null) {
      this.data$ = this.salonService.getSalonUsers(this.salonId).pipe(tap(data => (this.dataSource.data = data)));
    } else {
      this.dataTemp$ = of(void 0).pipe(tap(() => (this.dataSource.data = this.salonListService.tempUsers)));
    }
  }

  addUser(): void {
    this.addUserDialogRef = this.dialog.open(AddSalonUserDialogComponent, {
      disableClose: true,
      width: '500px',
    });

    this.addUserDialogRef.componentInstance.salonId = this.salonId;
    this.addUserDialogRef.componentInstance.groups = this.groups;

    this.addUserDialogRef
      .afterClosed()
      .pipe(
        map(result => result as boolean | undefined),
        filter(result => result !== undefined),
        switchMap(() => (+this.salonId ? this.data$ : this.dataTemp$)),
        takeUntil(this.unsubscribe$),
        finalize(() => (this.addUserDialogRef = null))
      )
      .subscribe();
  }

  editUser(item: SalonUser): void {
    this.addUserDialogRef = this.dialog.open(AddSalonUserDialogComponent, {
      disableClose: true,
      width: '500px',
    });
    this.addUserDialogRef.componentInstance.user = item;
    this.addUserDialogRef.componentInstance.salonId = this.salonId;
    this.addUserDialogRef.componentInstance.groups = this.groups;

    this.addUserDialogRef
      .afterClosed()
      .pipe(
        map(result => result as boolean | undefined),
        filter(result => result !== undefined),
        switchMap(() => (+this.salonId ? this.data$ : this.dataTemp$)),
        takeUntil(this.unsubscribe$),
        finalize(() => (this.addUserDialogRef = null))
      )
      .subscribe();
  }

  addSuperAdmin(group: SalonUserGroup): void {
    const superUser = {
      blocked: false,
      email: '',
      isAdmin: true,
      name: 'Admin',
      note: '',
      password: 'Admin',
      phone: '',
      group: group,
    } as SalonUser;
    this.salonListService.tempUsers.push(superUser);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
  }
}
