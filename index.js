// /**
//  * @format
//  */

// import { AppRegistry } from 'react-native';
// import App from './App';
// import { name as appName } from './app.json';
// import { enableScreens } from 'react-native-screens';
// enableScreens();
// AppRegistry.registerComponent(appName, () => App);



/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { enableScreens } from 'react-native-screens';

import {
  getApp,
} from '@react-native-firebase/app';

import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';

enableScreens();

/*
 * Firebase Messaging instance
 */
const firebaseApp = getApp();

const messaging =
  getMessaging(firebaseApp);


/*
 * Background / Quit state notification handler
 *
 * Jab app background ya quit state me hogi
 * aur FCM message receive hoga, ye handler chalega.
 */
setBackgroundMessageHandler(
  messaging,
  async remoteMessage => {

    console.log(
      'CUSTOMER BACKGROUND FCM:',
      remoteMessage,
    );

    console.log(
      'CUSTOMER BACKGROUND FCM DATA:',
      remoteMessage?.data,
    );

    console.log(
      'CUSTOMER BACKGROUND FCM NOTIFICATION:',
      remoteMessage?.notification,
    );
  },
);


AppRegistry.registerComponent(
  appName,
  () => App,
);