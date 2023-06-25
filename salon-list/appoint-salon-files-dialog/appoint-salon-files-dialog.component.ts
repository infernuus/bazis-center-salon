import { Component, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { FileManagerService } from '@cloud/main/shared/services/file-manager/file-manager.service';
import { ItemFile, TypeUseItemEnum } from 'cloud-shared-lib';
import { Observable } from 'rxjs';

@Component({
  selector: 'cloud-appoint-salon-files-dialog',
  templateUrl: './appoint-salon-files-dialog.component.html',
  styleUrls: ['./appoint-salon-files-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppointSalonFilesDialogComponent implements OnInit {
  @ViewChild('files') files: MatSelectionList;

  data$: Observable<ItemFile[]>;

  constructor(
    public dialogRef: MatDialogRef<AppointSalonFilesDialogComponent>,
    private fileManagerService: FileManagerService,
    @Inject(MAT_DIALOG_DATA) private typeFile: TypeUseItemEnum
  ) {}

  getTitle(): string {
    let title = '';
    switch (this.typeFile) {
      case TypeUseItemEnum.BaseMaterial:
        title = $localize`Назначить базу материалов`;
        break;

      case TypeUseItemEnum.Composition:
        title = $localize`Назначить готовые композиции`;
        break;

      case TypeUseItemEnum.DumpBaseMaterial:
        title = $localize`Назначить дамп базы материалов`;
        break;

      case TypeUseItemEnum.InteriorElements:
        title = $localize`Назначить элементы интерьера`;
        break;

      case TypeUseItemEnum.Textures:
        title = $localize`Назначить текстуры`;
        break;

      case TypeUseItemEnum.BaseMaterialTextures:
        title = $localize`Назначить текстуры для базы материалов`;
        break;

      case TypeUseItemEnum.Scripts:
        title = $localize`Назначить скрипты`;
        break;

      default:
        break;
    }
    return title;
  }

  ngOnInit(): void {
    this.data$ = this.fileManagerService.getFoldersByType(this.typeFile);
  }

  saveAndClose(): void {
    this.dialogRef.close(this.files.selectedOptions.selected[0].value);
  }
}
