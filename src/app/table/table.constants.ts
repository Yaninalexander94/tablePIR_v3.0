import { getStorage } from 'firebase/storage';

export class Extensions {
  public static XLSX: string = 'xlsx';
  public static XLS: string = 'xls';
  public static DOC: string = 'doc';
  public static DOCX: string = 'docx';
  public static PDF: string = 'pdf';

  public static getExtensionsAsString(extensions: string[]): string {
    return extensions.map(e => `.${ e }`).join(', ');
  }

  public static  getMaxLengthExtensions(extensions: string): number {
    return Math.max.apply(null, extensions.split(', ').map(e => (e.length)));
  }
}

/** Инициализация для FireBase **/
export const firebaseConfig = {
  apiKey: 'AIzaSyB0rSDN3NHe-9kFr1GXT9DH2frz9i_C0Ho',
  authDomain: 'tablepir.firebaseapp.com',
  projectId: 'tablepir',
  storageBucket: 'tablepir.appspot.com',
  messagingSenderId: '949823706019',
  appId: '1:949823706019:web:e4366655025ba881734016',
};

