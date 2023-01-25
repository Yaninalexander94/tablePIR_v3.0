import { Component, DoCheck, OnInit } from '@angular/core';
import { initializeApp } from 'firebase/app';
import 'firebase/storage';
import { deleteObject, FirebaseStorage, getDownloadURL, getStorage, ref, StorageReference, uploadBytes } from 'firebase/storage';
import * as moment from 'moment';
import { Extensions, firebaseConfig } from './table.constants';
import { file } from './table.model';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit, DoCheck {
  public files: file[] = [];
  public storage: FirebaseStorage = {
    app: {name: '', automaticDataCollectionEnabled: false, options: {}},
    maxUploadRetryTime: 0,
    maxOperationRetryTime: 0,
  };
  /** Инициализация доступных расширений файлов для загрузки **/
  public extensionsForImport: string = Extensions.getExtensionsAsString([
    Extensions.XLSX,
    Extensions.XLS,
    Extensions.DOC,
    Extensions.DOCX,
    Extensions.PDF,
  ]);

  constructor() {
  }

  ngDoCheck(): void {
    localStorage.setItem('files', JSON.stringify(this.files));
  }

  ngOnInit(): void {
    /** Инициализация служб Firebase **/
    initializeApp(firebaseConfig);
    /** Инициализация хранилища FireBase **/
    this.storage = getStorage();

    /** Загрузка файлов из LocalStorage или иниализация пустого массива **/
    this.files = JSON.parse(localStorage.getItem('files')!) ?? [];

    /** Обработка событий drag & drop фалйа **/
    this.dragAndDropFileHandler();
  }

  /** Обработчик drag & drop файлов в браузер **/
  public dragAndDropFileHandler() {
    /** Обработка дропа файла **/
    document.getElementById('input-file')?.addEventListener('drop', element => {
      document.getElementById('input-file')?.classList.remove('drag-zone');
      element.preventDefault();
      let file = element.dataTransfer?.files[0];
      if (file) {
        this.fileHandler(file);
      }
    });

    /** Обработка окончания перемещения **/
    document.getElementById('input-file')?.addEventListener('dragover', element => {
      element.preventDefault();
      document.getElementById('input-file')?.classList.add('drag-zone');
    });

    /** Обработка покидания зоны дропа **/
    document.getElementById('input-file')?.addEventListener('dragleave', element => {
      element.preventDefault();
      document.getElementById('input-file')?.classList.remove('drag-zone');
    });
  }

  /** Импорт файла с кнопки **/
  public importFile(event: any) {
    const file = event.target.files[0];
    this.fileHandler(file);
  }

  /** Обработчик файла **/
  public fileHandler(file: any) {
    let duplicate: boolean = false;
    if (this.files != null) {
      this.files.find(elem => {
        if (elem.name === file.name) {
          duplicate = true;
        }
      });
    }
    if (duplicate) {
      this.setMessage('Такой файл уже существует');
    } else {
      this.uploadFileToServer(file);
    }
  }

  /** Вывод информационных сообщений под таблицей **/
  public setMessage(message: string): void {
    document.getElementById('table')?.insertAdjacentHTML(
      'afterend',
      '<span id="hint" style="display: flex; justify-content: center; margin-top: 15px">' + message + '</span>');
    setTimeout(() => {
      document.getElementById('hint')?.remove();
    }, 2000);
  }

  /** Обработчик размера файла **/
  public sizeHandler(size: number): string {
    if (size / 1000 < 1000) {
      return `${ (size / 1000).toFixed(2) } Кб`;
    } else {
      return `${ (size / 1000000).toFixed(2) } Мб`;
    }
  }

  /** Обработчик drag & drop строк массива файлов **/
  public dragAndDropHandler(elementId: number): void {
    const dragElement = document.getElementById(`${ elementId }`);
    const dragZone = document.getElementById('dragZone');
    this.setMessage('Перемещайте файл внутри таблицы');

    /** Обработка окончания перемещения **/
    dragZone?.addEventListener('dragover', (element => {
      element.preventDefault();
    }));

    dragElement?.addEventListener('drag', (element => {
      let onElement;
      /** Поиск элемента под курсором **/
      onElement = document.elementFromPoint(element.pageX, element.pageY);
      /** Поиск родительского элемента **/
      onElement = onElement?.closest('tr');
      dragElement.classList.add('drag-elem');
      dragZone?.classList.add('drag-zone');

      /** Обработка drag & drop **/
      if (onElement?.id) {
        const idDrop: number = +onElement.id - 1;
        const idDrag: number = +dragElement.id - 1;
        this.files = this.dragAndDropListChange(idDrop, idDrag);
      }
    }));

    /** Обработка дропа файла **/
    dragElement?.addEventListener('drop', (element => {
      dragElement.classList.remove('drag-elem');
      dragZone?.classList.remove('drag-zone');
      document.getElementById('hint')?.remove();
    }));
  }

  /** Изменение положения строк в массиве файлов (обработка drag & drop) **/
  public dragAndDropListChange(idDrop: number, idDrag: number): file[] {
    let index: number = 1;
    const dragItem: file = this.files[idDrag];
    const filesList: file[] = this.files.slice(0);
    filesList.splice(idDrag, 1);
    filesList.splice(idDrop, 0, dragItem);
    return filesList.map(element => {
      element.id = index;
      index++;
      return element;
    });
  }

  /** Удаление файла **/
  public deleteFile(fileId: number): void {
    const storageRef = ref(this.storage, `files/${ this.files[fileId - 1].name }`);
    /** Обработка удаления файла с сервера **/
    deleteObject(storageRef)
      .then(() => {
        this.setMessage('Файл с сервера удален');
      })
      .catch((error) => {
        this.setMessage('Произошла ошибка удаления файла с сервера');
      });
    this.files.splice(fileId - 1, 1);
    this.files.forEach((file, index) => {
        index++;
        file.id = index;
      },
    );
  }

  /** Загрузка файла на сервер FireBase **/
  public uploadFileToServer(file: any): void {
    const url: string = `files/${ file.name }`;
    const storageRef: StorageReference = ref(this.storage, url);

    uploadBytes(storageRef, file)
      .then((snapshot) => {
        /** Получение ссылки на файл **/
        getDownloadURL(storageRef)
          .then((link) => {
            /** Добавление файла в таблицу **/
            this.addFileToTable(file, link);
          })
          .catch((error) => {
            this.setMessage('Произошла ошибка получения ссылки на файл');
          });
      })
      .catch(error => {
        this.setMessage('Произошла ошибка загрузки файла на сервер');
      });
  }

  /** Добавление файла в таблицу **/
  public addFileToTable(file: any, link: string): void {
    this.files.push({
      id: this.files.length + 1,
      name: file.name,
      weight: `${ this.sizeHandler(+file.size) }`,
      date: moment(file.date || moment(file.lastModified).toString()).format('DD-MM-YYYY'),
      link: link,
    });
  }

  /** Скачивание файла c сервера FireBase **/
  public downloadFileFromServer(link: string): void {
    link
      ? window.open(link, '_blank')
      : this.setMessage('Произошла ошибка получения ссылки на файл');
  }

  /** Редактирование названия файла **/
  public editTitleFile(item: file): void {
    const element = document.getElementById(`input-title ${ item.id }`);
    const inputValueDefault = (<HTMLInputElement> element).value;
    const extension = inputValueDefault.slice(inputValueDefault.lastIndexOf('.'));

    let inputValue = (<HTMLInputElement> element).value.slice(0, inputValueDefault.length - extension.length);

    (<HTMLInputElement> element).value = inputValue;
    element?.setAttribute('class', 'input-title-edit');
    element?.removeAttribute('disabled');
    /** Если курсор за элементом - отменить редактирование **/
    element?.addEventListener('mouseleave', (event) => {
      (<HTMLInputElement> element).value = inputValueDefault;
      element?.setAttribute('disabled', 'disabled');
      element?.setAttribute('class', 'input-title');
    });
    /** Если нажат Enter - завершить редактирование и записать изменения в файл **/
    element?.addEventListener('keyup', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        element?.setAttribute('disabled', 'disabled');
        element?.setAttribute('class', 'input-title');
        inputValue = (<HTMLInputElement> element).value;
        if (inputValue.length > 0) {
          /** Проверка на существование расширения в наименовании файла, например, для обхода
           *  двойных событий нажатия клавиши (когда приплюсовывается лишний раз расширение файла) **/
          this.files[item.id - 1].name = (<HTMLInputElement> element).value = inputValue.indexOf(extension) < 0
            ? inputValue + extension
            : inputValue;
        } else {
          this.setMessage('Некорректное название файла');
          (<HTMLInputElement> element).value = this.files[item.id - 1].name;
        }
      }
    });
    /** FireBase не может изменить атрибут имени загруженного файла,
     * поэтому наименование файла меняется только в таблице и в LocalStorage
     * и из-за этого после переименования файла сбоит удаление файла с сервера**/
  }
}
