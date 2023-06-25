import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { LocalStorageManager } from '@cloud/main/shared/helpers/local-storage-manager.helper';
import { FileManagerService } from '@cloud/main/shared/services/file-manager/file-manager.service';
import { PermissionsService } from '@cloud/main/shared/services/permissions.service';
import { SalonReferenceService } from '@cloud/main/shared/services/reference/salon-reference.service';
import { SalonFilesService } from '@cloud/main/shared/services/salon/salon-files.service';
import { SalonService } from '@cloud/main/shared/services/salon/salon.service';
import { fuseAnimations } from '@fuse/animations';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import {
  Address,
  Country,
  ICustomResponse,
  ItemFile,
  MyValidator,
  SalonDetail,
  SalonBaseMaterialConfig,
  SalonIdentifierTypes,
  SalonServiceConfig,
  SalonStateConfig,
  ServiceIdEnum,
  TranslateManagerService,
  TypeUseItemEnum,
  SalonTypePaymentConfig,
  SalonFile,
  User,
} from 'cloud-shared-lib';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, concatMap, debounceTime, filter, map, skip, switchMap, tap } from 'rxjs/operators';
import * as _ from 'lodash';

import { SalonListService } from '../salon-list.service';

@Component({
  selector: 'cloud-salon-detail',
  templateUrl: './salon-detail.component.html',
  styleUrls: ['./salon-detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class SalonDetailComponent implements OnInit, OnDestroy {
  public urlBack = '/salon-data-upd/salons';
  public salon: SalonDetail = {} as SalonDetail;
  data$: Observable<SalonDetail>;
  dataServiceConfig$: Observable<ICustomResponse<SalonServiceConfig[]>>;
  dataStateConfig$: Observable<ICustomResponse<SalonStateConfig[]>>;
  dataTypePaymentConfig$: Observable<ICustomResponse<SalonTypePaymentConfig[]>>;
  dataBaseMaterialConfig$: Observable<ICustomResponse<SalonBaseMaterialConfig[]>>;
  dataInterior$: Observable<ItemFile[]>;
  dataTextures$: Observable<ItemFile[]>;
  dataComposition$: Observable<ItemFile[]>;
  dataDumpBaseMaterials$: Observable<ItemFile[]>;
  dataBaseMaterialTextures$: Observable<ItemFile[]>;
  dataScripts$: Observable<ItemFile[]>;
  dataSettings$: Observable<ICustomResponse<SalonFile[]>>;
  dataManager$: Observable<User[]>;
  salonForm: FormGroup;
  thisSalonIdentifierTypes = SalonIdentifierTypes;
  salonId: number | null;
  save$: Observable<void>;
  formAction$: Observable<any>;
  unsubscribe$: Subject<void> = new Subject();
  saveTempUsers$: Observable<any>;
  addSalon$: Observable<void>;
  postTemp$: Observable<any>;
  isNewSalon = true;

  addressResponse$: Observable<Address[]>;
  countryResponse$: Observable<Country[]>;
  params$: Observable<Params>;
  editSalonPermission = false;

  userLang = 'en';

  get isRussian(): boolean {
    return (
      typeof this.salonForm.controls.country.value !== 'string' && +this.salonForm.controls.country.value.code === 643
    );
  }

  constructor(
    private fuseNavigationService: FuseNavigationService,
    private route: ActivatedRoute,
    private salonService: SalonService,
    private salonReferenceService: SalonReferenceService,
    public translateManagerService: TranslateManagerService,
    private fileManagerService: FileManagerService,
    private salonListService: SalonListService,
    public salonFilesService: SalonFilesService,
    private formBuilder: FormBuilder,
    private activateRoute: ActivatedRoute,
    private router: Router,
    private permissionsService: PermissionsService
  ) {
    this.salonForm = this.formBuilder.group({
      identifierType: ['', Validators.required],
      identifier: ['', Validators.required],
      name: ['', Validators.required],
      article: ['', Validators.required],
      address: [{ value: '', disabled: true }, [Validators.required, MyValidator.autocompleteObjectValidator()]],
      country: ['', [Validators.required, MyValidator.autocompleteObjectValidator()]],
      invite: { value: '', disabled: true },
      serviceConfigId: [''],
      stateConfigId: [null],
      folderInteriorId: [null],
      folderTexturesId: [null],
      baseMaterialConfigId: [null],
      folderCompositionId: [null],
      dumpBaseMaterialId: [null],
      typePaymentConfigId: [null],
      folderBaseMaterialTexturesId: [null],
      folderScriptsId: [null],
      settingsId: [null],
      manager: [null],
    });

    this.salonId = +this.activateRoute.snapshot.params.id || null;

    if (this.activateRoute.snapshot.paramMap.has('id') && !this.salonId) {
      this.router.navigate(['/']);
    }

    this.isNewSalon = _.isNil(this.salonId);
    this.userLang = LocalStorageManager.client.languageCode;
  }

  ngOnInit(): void {
    this.editSalonPermission = this.permissionsService.has(96);
    if (!this.isNewSalon) {
      this.getSalonReq();
    }

    this.params$ = this.activateRoute.params.pipe(
      skip(1),
      tap(() => this.getSalonReq())
    );

    this.fuseNavigationService.onToggleToolbarSrvInfo.next(ServiceIdEnum.PriceListUpdate);
    this.dataServiceConfig$ = this.salonReferenceService.getSalonServiceConfigs();
    this.dataStateConfig$ = this.salonReferenceService.getSalonStateConfigs();
    this.dataInterior$ = this.fileManagerService.getFoldersByType(TypeUseItemEnum.InteriorElements);
    this.dataTextures$ = this.fileManagerService.getFoldersByType(TypeUseItemEnum.Textures);
    this.dataComposition$ = this.fileManagerService.getFoldersByType(TypeUseItemEnum.Composition);
    this.dataDumpBaseMaterials$ = this.fileManagerService.getFoldersByType(TypeUseItemEnum.DumpBaseMaterial);
    this.dataBaseMaterialConfig$ = this.salonReferenceService.getSalonBaseMaterialConfigs();
    this.dataTypePaymentConfig$ = this.salonReferenceService.getSalonTypePaymentConfigs();
    this.dataBaseMaterialTextures$ = this.fileManagerService.getFoldersByType(TypeUseItemEnum.BaseMaterialTextures);
    this.dataScripts$ = this.fileManagerService.getFoldersByType(TypeUseItemEnum.Scripts);
    this.dataSettings$ = this.salonFilesService.getSettingsList();

    this.dataManager$ = this.salonForm.controls.manager.valueChanges.pipe(
      filter(val => typeof val === 'string'),
      debounceTime(300),
      switchMap(val => {
        return this.salonListService.getManagers(val).pipe(map(res => res.managersDTO));
      }),
      catchError(() => {
        this.translateManagerService.openSnackBar($localize`Ошибка загрузки подсказок`);

        return of([]);
      })
    );

    this.addressResponse$ = this.salonForm.controls.address.valueChanges.pipe(
      filter(val => typeof val === 'string'),
      debounceTime(300),
      switchMap(val => {
        if (this.isRussian) {
          return this.salonListService.gatDadataAddressSuggestions(val);
        } else {
          return this.salonListService.gatGoogleAddressSuggestions(
            val,
            this.userLang,
            this.salonForm.controls.country.value.alfa2
          );
        }
      }),
      catchError(() => {
        this.translateManagerService.openSnackBar($localize`Ошибка загрузки подсказок`);

        return of([]);
      })
    );

    this.countryResponse$ = this.salonForm.controls.country.valueChanges.pipe(
      tap(val => {
        if (typeof val !== 'string') {
          this.salonForm.controls.address.enable({ emitEvent: false });
        } else {
          this.salonForm.controls.address.disable({ emitEvent: false });
          this.salonForm.controls.address.setValue('', { emitEvent: false });
        }
      }),
      filter(val => typeof val === 'string'),
      debounceTime(300),
      switchMap(val => this.salonListService.getDadataCountry(val)),
      catchError(() => {
        this.translateManagerService.openSnackBar($localize`Ошибка загрузки подсказок`);

        return of([]);
      })
    );

    this.formAction$ = this.salonForm.valueChanges.pipe(
      debounceTime(500),
      filter(() => !this.isNewSalon),
      tap(() => this.saveSalon())
    );

    if (!this.editSalonPermission) {
      this.salonForm.controls.manager.disable({ emitEvent: false, onlySelf: true });
    }
  }

  getSalonReq(): void {
    this.data$ = this.salonService.getSalon(this.salonId).pipe(
      tap(data => {
        this.salon = data;
        this.salonForm.patchValue(this.salon, { emitEvent: false, onlySelf: true });

        if (this.salon.country && typeof this.salon.country !== 'string' && this.permissionsService.has(96)) {
          this.salonForm.controls.address.enable({ emitEvent: false, onlySelf: true });
        } else {
          this.salonForm.controls.address.setValue('', { eventEmit: false, onlySelf: true });
        }

        if (!this.permissionsService.has(96)) {
          this.salonForm.disable({ emitEvent: false });
        }
      })
    );
  }

  addressAutocompleteDisplayFn(val: Address): any {
    return val?.settlement;
  }

  countryAutocompleteDisplayFn(val: Country): any {
    return val?.nameShort;
  }

  managerAutocompleteDisplayFn(val: User): any {
    if (val?.id) {
      return val.personSurname + ' ' + val.personName + ' ' + val.personPatronymic;
    }
    return null;
  }

  autocompleteClosed(control: AbstractControl): void {
    if (typeof control.value === 'string') {
      control.setValue('');
    }
  }

  autocompleteFocus(control: AbstractControl): any {
    if (typeof control.value === 'string' || !control.value) {
      control.setValue('');
    }
  }

  updateSalon(): void {
    if (this.salonForm.controls.identifier.valid) {
      this.salon.identifier = this.salonForm.controls.identifier.value;
    }
    if (this.salonForm.controls.identifierType.valid) {
      this.salon.identifierType = this.salonForm.controls.identifierType.value;
    }
    if (this.salonForm.controls.name.valid) {
      this.salon.name = this.salonForm.controls.name.value;
    }
    if (this.salonForm.controls.article.valid) {
      this.salon.article = this.salonForm.controls.article.value;
    }
    if (this.salonForm.controls.address.valid && this.salonForm.controls.country.valid) {
      this.salon.address = this.salonForm.controls.address.value;
      this.salon.country = this.salonForm.controls.country.value;
    }
    if (typeof this.salonForm.controls.manager.value !== 'string') {
      this.salon.manager = this.salonForm.controls.manager.value;
    } else {
      this.salon.manager = null;
    }

    this.salon.serviceConfigId = this.salonForm.controls.serviceConfigId.value;
    this.salon.stateConfigId = this.salonForm.controls.stateConfigId.value;
    this.salon.folderInteriorId = this.salonForm.controls.folderInteriorId.value;
    this.salon.folderTexturesId = this.salonForm.controls.folderTexturesId.value;
    this.salon.baseMaterialConfigId = this.salonForm.controls.baseMaterialConfigId.value;
    this.salon.folderCompositionId = this.salonForm.controls.folderCompositionId.value;
    this.salon.dumpBaseMaterialId = this.salonForm.controls.dumpBaseMaterialId.value;
    this.salon.typePaymentConfigId = this.salonForm.controls.typePaymentConfigId.value;
    this.salon.folderBaseMaterialTexturesId = this.salonForm.controls.folderBaseMaterialTexturesId.value;
    this.salon.folderScriptsId = this.salonForm.controls.folderScriptsId.value;
    this.salon.settingsId = this.salonForm.controls.settingsId.value;
  }

  saveSalon(): void {
    this.updateSalon();
    this.save$ = this.salonListService.editSalon(this.salon).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 403) {
          this.translateManagerService.openSnackBar($localize`Салон с таким идентификатором уже существует`);
        } else {
          this.translateManagerService.openSnackBar($localize`Не удалось применить изменения`);
        }

        return of(null);
      })
    );
  }

  addSalon(): void {
    this.updateSalon();
    this.addSalon$ = this.salonListService.addSalon(this.salon).pipe(
      tap(res => (this.salonId = res)),
      catchError((err: HttpErrorResponse) => {
        if (+err.status === 403) {
          this.translateManagerService.openSnackBar($localize`Салон с таким идентификатором уже существует`);
        } else {
          this.translateManagerService.openSnackBar($localize`Не удалось добавить салон`);
        }
        return new BehaviorSubject(null);
      }),
      filter(d => !!d),
      concatMap(res => {
        if (this.salonListService.tempUsers?.length) {
          return this.salonService.postSalonUser(res, this.salonListService.tempUsers);
        }
        return new BehaviorSubject(null);
      }),
      tap(() => {
        this.router.navigate(['/salon-data-upd/salons/' + this.salonId]);
        this.translateManagerService.openSnackBar($localize`Салон добавлен`);
      }),
      catchError((err: HttpErrorResponse) => {
        if (+err.status === 403) {
          this.translateManagerService.openSnackBar($localize`Пользователь с данным именем уже существует`);
        } else {
          this.translateManagerService.openSnackBar($localize`Ошибка добавления пользователя`);
        }
        return new BehaviorSubject(null);
      })
    );
  }

  clearTempUsers(): void {
    this.salonListService.tempUsers = [];
  }

  ngOnDestroy(): void {
    this.clearTempUsers();
    this.unsubscribe$.next();
  }
}
