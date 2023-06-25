import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { DadataService } from '@cloud/main/shared/services/dadata/dadata.service';
import {
  Address,
  Country,
  IDadataSuggestAddressRequest,
  PlaceAutocompleteRequest,
  PlaceAutocompleteType,
  PlaceQueryAutocompleteResponseData,
  Salon,
  SalonDetail,
  SalonUser,
  User,
} from 'cloud-shared-lib';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ApiLinks } from '../../../app.api-links';

export interface IUserResponse {
  managersDTO: User[];
  totalCount: number;
}

@Injectable()
export class SalonListService {
  salons: Salon[];
  onSalonsChanged: BehaviorSubject<any> = new BehaviorSubject({});
  salonsTotalCount = 0;
  tempUsers: SalonUser[] = [];

  private readonly urlSalon: string = ApiLinks.salons;
  private readonly urlSalonLock: string = ApiLinks.salonLock;
  private readonly urlSalonUnlock: string = ApiLinks.salonUnlock;

  constructor(private http: HttpClient, private dadataService: DadataService) {}

  /**
   * Resolve
   * @param ActivatedRouteSnapshot route
   * @param RouterStateSnapshot state
   * @param route
   * @param state
   * @returns Observable<any> | Promise<any> | any
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    return new Promise((resolve, reject) => {
      Promise.all([this.getSalonList(0, 10, '', 0)]).then(() => {
        resolve(undefined);
      }, reject);
    });
  }

  getSalonList(
    pageIndex: number,
    pageSize: number,
    filterText: string,
    filterSalon: number,
    orderBy = '',
    sortDirection: SortDirection = 'desc'
  ): Promise<any> {
    const paramsHttp: HttpParams = new HttpParams()
      .set('pageIndex', pageIndex.toString())
      .set('pageSize', pageSize.toString())
      .set('filterText', filterText)
      .set('filterSalon', filterSalon.toString())
      .set('orderBy', orderBy)
      .set('sortDirection', sortDirection);

    return new Promise((resolve, reject) => {
      this.http
        .get(this.urlSalon, { params: paramsHttp })
        .pipe(
          map((res: { totalCount: number; salonsDTO: Salon[] }) => {
            this.salonsTotalCount = res.totalCount;
            return res.salonsDTO;
          })
        )
        .subscribe((response: Salon[]) => {
          this.salons = response;
          this.onSalonsChanged.next(this.salons);
          resolve(response);
        }, reject);
    });
  }

  addSalon(item: SalonDetail): Observable<number> {
    return this.http.post(this.urlSalon, item).pipe(
      tap((response: SalonDetail) => {
        this.salonsTotalCount++;
      }),
      map(res => res.id)
    );
  }

  editSalon(item: SalonDetail): Observable<void> {
    return this.http.put<void>(ApiLinks.salon(item.id), item);
  }

  deleteSalon(item: Salon): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.urlSalon}/${item.id}`).subscribe(() => {
        this.salons.splice(
          this.salons.findIndex(s => s.id === item.id),
          1
        );
        this.onSalonsChanged.next(this.salons);

        this.salonsTotalCount--;

        resolve(undefined);
      }, reject);
    });
  }

  toggleBlockSalon(item: Salon, success?: () => void): void {
    const paramsHttp: HttpParams = new HttpParams().set('id', item.id.toString());

    const url = item.blocked ? this.urlSalonUnlock : this.urlSalonLock;

    this.http.get(url, { params: paramsHttp }).subscribe(() => {
      this.salons.find(s => s.id === item.id).blocked = !item.blocked;

      this.onSalonsChanged.next(this.salons);

      if (success) {
        success();
      }
    });
  }

  forcedUpdatedPriceLists(salonId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post(ApiLinks.forcedUpdatePriceLists(salonId), undefined).subscribe(() => {
        resolve(undefined);
      }, reject);
    });
  }

  addSalonsFromXml(file: File): Observable<void> {
    const input = new FormData();
    input.append('file', file);

    return this.http.post<void>(ApiLinks.salons + '/add-from-xml', input);
  }

  gatDadataAddressSuggestions(query: string, count = 5): Observable<Address[]> {
    return this.dadataService
      .gatAddress({
        query: query,
        count: count,
        locations: [
          {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            country_iso_code: 'RU',
          },
        ],
      } as IDadataSuggestAddressRequest)
      .pipe(
        map(res =>
          res.map(
            s =>
              ({
                fiasId: s.data.fias_id,
                postalCode: s.data.postal_code,
                settlement: s.unrestricted_value,
              } as Address)
          )
        )
      );
  }

  gatGoogleAddressSuggestions(query: string, lang = 'en', country?: string): Observable<Address[]> {
    const reqData = {
      input: query,
      language: lang,
      components: country ? ['country:' + country] : undefined,
      types: PlaceAutocompleteType.address,
    } as PlaceAutocompleteRequest;

    return this.http.post<PlaceQueryAutocompleteResponseData>(ApiLinks.googlePlaceAutocomplete, reqData).pipe(
      map(res =>
        res.predictions.map(
          s =>
            ({
              fiasId: s.place_id,
              settlement: s.description,
            } as Address)
        )
      )
    );
  }

  getDadataCountry(query: string): Observable<Country[]> {
    return this.dadataService.getCountry(query).pipe(
      map(res =>
        res.map(
          s =>
            ({
              nameShort: s.data.name_short,
              code: s.data.code,
              alfa2: s.data.alfa2,
              alfa3: s.data.alfa3,
            } as Country)
        )
      )
    );
  }

  getManagers(filterText: string): Observable<IUserResponse> {
    const paramsHttp: HttpParams = new HttpParams().set('filterText', filterText);

    return this.http.get<IUserResponse>(ApiLinks.manager, { params: paramsHttp });
  }
}
