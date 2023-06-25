import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { SelectionModel } from '@angular/cdk/collections';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatSort, Sort } from '@angular/material/sort';
import { LocalStorageManager } from '@cloud/main/shared/helpers/local-storage-manager.helper';
import { UserSelectDialogComponent } from '@cloud/main/shared/modules/user-select-dialog/user-select-dialog.component';
import { PermissionsService } from '@cloud/main/shared/services/permissions.service';
import { SalonFilesService } from '@cloud/main/shared/services/salon/salon-files.service';
import { ConfigTypeEnum, SalonService } from '@cloud/main/shared/services/salon/salon.service';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import {
  DialogsService,
  downloadFile,
  Salon,
  ServiceIdEnum,
  TranslateManagerService,
  TypeUseItemEnum,
  User,
} from 'cloud-shared-lib';
import { BehaviorSubject, fromEvent, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import {
  AppointSalonDataDialogComponent,
  SalonSettingData,
} from './appoint-salon-data-dialog/appoint-salon-data-dialog.component';
import { SalonListService } from './salon-list.service';
import { SalonReferenceService } from '@cloud/main/shared/services/reference/salon-reference.service';
import { AppointSalonFilesDialogComponent } from './appoint-salon-files-dialog/appoint-salon-files-dialog.component';
import * as _ from 'lodash';

@Component({
  selector: 'cloud-salon-list',
  templateUrl: './salon-list.component.html',
  styleUrls: ['./salon-list.component.scss'],
  animations: fuseAnimations,
})
export class SalonListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('filter', { static: true }) filter: ElementRef;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  @ViewChild('filterOption', { static: true }) filterOption: MatSelect;

  dataSource: Salon[] = [];

  displayedColumns = [
    'name',
    'article',
    'dateCreated',
    'identifier',
    'manager',
    'settings',
    'base-material',
    'version',
    'state',
    'block',
    'menu',
  ];
  Original = [...this.displayedColumns];

  confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
  unsubscribe$: Subject<void> = new Subject();
  appointManagerDialogRef: MatDialogRef<UserSelectDialogComponent>;
  selectedAll: boolean;

  user = LocalStorageManager.client;
  selected = new SelectionModel<number>(true, []);
  typeUseItemEnum = TypeUseItemEnum;

  urlSalonDetail = '/salon-data-upd/salons/';
  data$: Observable<Salon[]>;
  sort$: BehaviorSubject<Sort> = new BehaviorSubject({
    active: 'name',
    direction: 'desc',
  });

  addSalonPermission = false;
  deleteSalonPermission = false;
  editSalonPermission = false;

  constructor(
    public salonListService: SalonListService,
    public dialog: MatDialog,
    public translateManagerService: TranslateManagerService,
    private fuseNavigationService: FuseNavigationService,
    public salonFilesService: SalonFilesService,
    private dialogs: DialogsService,
    private salonService: SalonService,
    private salonReferenceService: SalonReferenceService,
    private permissionsService: PermissionsService,
    private breakpointObserver: BreakpointObserver
  ) {
    if (!this.permissionsService.has(97)) {
      _.pull(this.displayedColumns, 'block');
    }

    if (this.permissionsService.has(96)) {
      this.displayedColumns.unshift('selected');
    }

    this.fuseNavigationService.onToggleToolbarSrvInfo.next(ServiceIdEnum.PriceListUpdate);

    this.data$ = this.salonListService.onSalonsChanged.pipe(tap(d => (this.dataSource = d)));
  }

  ngOnInit(): void {
    this.deleteSalonPermission = this.permissionsService.has(98);
    this.addSalonPermission = this.permissionsService.has(95);
    this.editSalonPermission = this.permissionsService.has(96);

    this.addFilterListner();
    this.addPaginatorListner();
    this.breakpointObserver.observe([Breakpoints.Small]).subscribe((state: BreakpointState) => {
      if (state.matches) {
        _.pull(this.displayedColumns, 'manager', 'settings', 'base-material', 'version');
      } else {
        this.displayedColumns = [...this.Original];
      }
    });
  }
  ngAfterViewInit(): void {
    this.sort$.subscribe(() => this.getSalons());
  }

  selectAll(): void {
    this.selected.clear();
    this.selectedAll = !this.selectedAll;
    if (this.selectedAll) {
      this.selected.select(...this.salonListService.salons.map(d => d.id));
    }
  }

  deleteSalon(salon: Salon): void {
    this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      disableClose: false,
    });

    this.confirmDialogRef.componentInstance.confirmMessage = $localize`Удалить салон "${salon.name}"?`;

    this.confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.salonListService
          .deleteSalon(salon)
          .then(() => {
            this.translateManagerService.openSnackBar($localize`Салон удален`);
          })
          .catch((err: HttpErrorResponse) => {
            if (err.status === 400) {
              switch (err.error) {
                case 'orders':
                  this.translateManagerService.openSnackBar(
                    $localize`Невозможно удалить салон. У салона имеются синхронизированые заказы`
                  );
                  break;
                case 'prices':
                  this.translateManagerService.openSnackBar(
                    $localize`Невозможно удалить салон. У салона подключена услуга обновления прайс-листов`
                  );
                  break;
                case 'stock':
                  this.translateManagerService.openSnackBar(
                    $localize`Невозможно удалить салон. У салона назначены склады`
                  );
                  break;
              }
            }
          });
      }
      this.confirmDialogRef = null;
    });
  }

  isSelectedDisabled(): boolean {
    return this.selected.selected.length === 0;
  }

  appointSettings(): void {
    this.dialogs.open(AppointSalonDataDialogComponent, {
      data: {
        title: $localize`Настройки`,
        data$: this.salonFilesService.getSettingsList().pipe(
          map(value =>
            value.result?.map(
              item =>
                ({
                  id: item.id,
                  name: item.name,
                } as SalonSettingData)
            )
          )
        ),
        callback: (dataId: number): Observable<void> =>
          this.salonFilesService.putAppointSettingsList(this.selected.selected, dataId).pipe(
            tap(() => {
              this.selected.clear();
              this.getSalons();
            })
          ),
      },
    });
  }

  appointServicesConfig(): void {
    this.dialogs.open(AppointSalonDataDialogComponent, {
      data: {
        title: $localize`Набор услуг`,
        data$: this.salonReferenceService.getSalonServiceConfigs().pipe(
          map(value =>
            value.result?.map(
              item =>
                ({
                  id: item.id,
                  name: item.name,
                } as SalonSettingData)
            )
          )
        ),
        callback: (dataId: number): Observable<void> =>
          this.salonService.putSalonConfig(this.selected.selected, dataId, ConfigTypeEnum.Services).pipe(
            tap(() => {
              this.selected.clear();
              this.getSalons();
            })
          ),
      },
    });
  }

  appointStatesConfig(): void {
    this.dialogs.open(AppointSalonDataDialogComponent, {
      data: {
        title: $localize`Набор состояний`,
        data$: this.salonReferenceService.getSalonStateConfigs().pipe(
          map(value =>
            value.result?.map(
              item =>
                ({
                  id: item.id,
                  name: item.name,
                } as SalonSettingData)
            )
          )
        ),
        callback: (dataId: number): Observable<void> =>
          this.salonService.putSalonConfig(this.selected.selected, dataId, ConfigTypeEnum.States).pipe(
            tap(() => {
              this.selected.clear();
              this.getSalons();
            })
          ),
      },
    });
  }

  appointPaymentsTypeConfig(): void {
    this.dialogs.open(AppointSalonDataDialogComponent, {
      data: {
        title: $localize`Набор типов платежей`,
        data$: this.salonReferenceService.getSalonTypePaymentConfigs().pipe(
          map(value =>
            value.result?.map(
              item =>
                ({
                  id: item.id,
                  name: item.name,
                } as SalonSettingData)
            )
          )
        ),
        callback: (dataId: number): Observable<void> =>
          this.salonService.putSalonConfig(this.selected.selected, dataId, ConfigTypeEnum.Payments).pipe(
            tap(() => {
              this.selected.clear();
              this.getSalons();
            })
          ),
      },
    });
  }

  appointBaseMaterialsTypeConfig(): void {
    this.dialogs.open(AppointSalonDataDialogComponent, {
      data: {
        title: $localize`Набор баз материалов`,
        data$: this.salonReferenceService.getSalonBaseMaterialConfigs().pipe(
          map(value =>
            value.result?.map(
              item =>
                ({
                  id: item.id,
                  name: item.name,
                } as SalonSettingData)
            )
          )
        ),
        callback: (dataId: number): Observable<void> =>
          this.salonService.putSalonConfig(this.selected.selected, dataId, ConfigTypeEnum.BaseMaterials).pipe(
            tap(() => {
              this.selected.clear();
              this.getSalons();
            })
          ),
      },
    });
  }

  appointSalonFiles(typeUseItem: TypeUseItemEnum): void {
    this.dialogs
      .component(AppointSalonFilesDialogComponent, typeUseItem, 400, { panelClass: 'appoint-salon-files-dialog' })
      .pipe(
        filter(res => res !== undefined),
        switchMap((res: number) => this.salonService.putFiles(this.selected.selected, typeUseItem, res)),
        tap(() => {
          this.translateManagerService.openSnackBar($localize`Файлы назначены`);
          this.getSalons();
          this.selected.clear();
          this.selectedAll = false;
        }),
        catchError(() => {
          this.translateManagerService.openSnackBar($localize`Ошибка назначения файлов`);
          return of(undefined);
        }),
        takeUntil(this.unsubscribe$)
      )
      .subscribe();
  }

  exportSalonsToExcel(): void {
    this.salonService
      .getSalonsExcel()
      .pipe(
        tap(res => downloadFile(res.body, res.filename)),
        catchError(() => {
          this.translateManagerService.openSnackBar($localize`Не удалось скачать файл`);
          return of({ body: null, filename: '' });
        })
      )
      .subscribe();
  }

  getManagerName(manager: User): string {
    let result = '';
    if (manager?.id > 0) {
      result = manager.personSurname + ' ' + manager.personName + ' ' + manager.personPatronymic;
    }
    return result;
  }

  toggleBlockSalon(salon: Salon): void {
    this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      disableClose: false,
    });

    const confirmTransKey = salon.blocked
      ? $localize`Разблокировать салон "${salon.name}"?`
      : $localize`Заблокировать салон "${salon.name}"?`;
    this.confirmDialogRef.componentInstance.confirmMessage = confirmTransKey;

    this.confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.salonListService.toggleBlockSalon(salon, () => {
          const resTransKey = salon.blocked ? $localize`Салон заблокирован` : $localize`Салон разблокирован`;
          this.translateManagerService.openSnackBar(resTransKey);
        });
      }
      this.confirmDialogRef = null;
    });
  }

  forcedUpdatedPriceList(salon: Salon): void {
    this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      disableClose: false,
    });

    this.confirmDialogRef.componentInstance.confirmMessage = $localize`Запустить команду принудительного обновления всех прайс-листов для салона "${salon.name}"?`;

    this.confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.salonListService
          .forcedUpdatedPriceLists(salon.id)
          .then(() => {
            this.translateManagerService.openSnackBar($localize`Принудительное обновление всех прайс-листов запущено`);
            salon.countUpdatedPriceLists = 0;
          })
          .catch(() => {
            this.translateManagerService.openSnackBar($localize`Ошибка запуска команды обновления всех прайс-листов`);
          });
      }
      this.confirmDialogRef = null;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
  }

  private addPaginatorListner(): void {
    this.paginator.page.subscribe(() => {
      this.getSalons();
    });
  }

  private addFilterListner(): void {
    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.unsubscribe$))
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.paginator.pageIndex = 0;
        this.getSalons();
      });

    this.filterOption.selectionChange.subscribe((res: MatSelectChange) => {
      this.paginator.pageIndex = 0;
      this.getSalons();
    });
  }

  private getSalons(): void {
    this.salonListService.getSalonList(
      this.paginator.pageIndex,
      this.paginator.pageSize,
      this.filter.nativeElement.value,
      this.filterOption.value,
      this.sort$.value.active,
      this.sort$.value.direction
    );
  }
}
