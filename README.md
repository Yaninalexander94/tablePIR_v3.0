# PIR v3.0

## Задание на ПИР:
1.	Реализовать возможность загрузки файлов формата: xlsx, .docx, .pdf
2.	Реализовать отображение загруженных файлов в виде таблицы
3.	Добавить возможность удаления файлов
4.	Добавить возможность изменения наименования файла внутри таблицы
5.	Добавить drag and drop для созданной таблицы
6.	Добавить возможность просмотра файла внутри приложения

## Известные "особенности" проекта:
1. FireBase не может изменить атрибут имени загруженного файла, поэтому наименование файла меняется только в таблице и в LocalStorage
и из-за этого после переименования файла сбоит удаление файла с сервера;
2. При перетаскивании файла внутри таблицы идет подсветка области drop внутри самой таблицы, но при наведении на область drop импорта файла, 
то подсвечивается и вторая область drop импорта файла (и наоборот, при перетаскивании файла из проводника в приложение);
3. Таблица дублируется в localStorage для сохранения состояния таблице при сбросе страницы, однако при изменении порта или адреса при билде 
проекта таблица загружается пустая (т.к. localStorage пустой);
4. Файлы в таблице скачиваются методом получения из FireBase ссылки на скачивание файла и открытии ссылки в новой вкладке (для предпросмотра
(не скачивания) pdf файлов).

## Дополнительная информация
Инициализация параметров БД сервера FireBase настраивается в константе 
 firebaseConfig = {
   & apiKey: 'AIzaSyB0rSDN3NHe-9kFr1GXT9DH2frz9i_C0Ho',
   authDomain: 'tablepir.firebaseapp.com',
   projectId: 'tablepir',
  storageBucket: 'tablepir.appspot.com',
   messagingSenderId: '949823706019',
   appId: '1:949823706019:web:e4366655025ba881734016',
 };

Для бесплатной загрузки файлов по API в режиме тестирования на облако FireBase необходимо в настройках Storage в правилах прописать публичные
настройки доступа:
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.3.5.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.
