import Papa from 'papaparse';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

export const readCSV = async () => {
  try {
    let csvData = '';

    if (Platform.OS === 'android') {
      csvData = await RNFS.readFileAssets('articles.csv', 'utf8');
    } else {
      const path = RNFS.MainBundlePath + '/articles.csv';
      csvData = await RNFS.readFile(path, 'utf8');
    }

    console.log('RAW CSV => ', csvData);

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          console.log('PARSED => ', result.data);
          resolve(result.data);
        },
        error: (err) => reject(err),
      });
    });
  } catch (e) {
    console.log('FILE READ ERROR => ', e);
    throw e;
  }
};
