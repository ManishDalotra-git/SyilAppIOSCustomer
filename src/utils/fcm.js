import {
  Platform,
} from 'react-native';

import {
  getApp,
} from '@react-native-firebase/app';

import {
  AuthorizationStatus,
  getAPNSToken,
  getMessaging,
  getToken,
  requestPermission,
} from '@react-native-firebase/messaging';

const firebaseApp = getApp();

const messaging =
  getMessaging(firebaseApp);

const API_URL =
  'https://syilappioscustomer.onrender.com';


/*
 * Customer login ke baad:
 *
 * 1. Notification permission lega
 * 2. APNs token check karega
 * 3. FCM token generate karega
 * 4. Customer backend par token save karega
 */
export const saveCustomerFCMToken =
  async email => {

    try {

      if (!email) {
        console.log(
          'CUSTOMER FCM: Email missing',
        );

        return null;
      }

      /*
       * iOS notification permission.
       */
      const authStatus =
        await requestPermission(
          messaging,
        );

      const permissionGranted =
        authStatus ===
          AuthorizationStatus.AUTHORIZED ||
        authStatus ===
          AuthorizationStatus.PROVISIONAL;

      console.log(
        'CUSTOMER FCM auth status:',
        authStatus,
      );

      if (!permissionGranted) {

        console.log(
          'CUSTOMER FCM: Notification permission denied',
        );

        return null;
      }


      /*
       * iOS APNs token check.
       */
      if (Platform.OS === 'ios') {

        const apnsToken =
          await getAPNSToken(
            messaging,
          );

        console.log(
          'CUSTOMER APNs Token:',
          apnsToken
            ? 'Generated successfully'
            : 'Not available yet',
        );
      }


      /*
       * Firebase FCM token.
       */
      const fcmToken =
        await getToken(
          messaging,
        );

      if (!fcmToken) {

        console.log(
          'CUSTOMER FCM: Token empty',
        );

        return null;
      }

      console.log(
        'CUSTOMER FCM Token:',
        fcmToken,
      );


      /*
       * Customer backend par save.
       *
       * Backend endpoint next step me
       * create karenge.
       */
      const response =
        await fetch(
          `${API_URL}/save-customer-fcm-token`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                email:
                  email
                    .trim()
                    .toLowerCase(),

                fcmToken,

                platform:
                  Platform.OS,
              }),
          },
        );


      const responseText =
        await response.text();

      let responseData = {};

      try {

        responseData =
          responseText
            ? JSON.parse(
                responseText,
              )
            : {};

      } catch {

        throw new Error(
          `Server returned invalid response: ${responseText.slice(
            0,
            150,
          )}`,
        );
      }


      if (!response.ok) {

        throw new Error(
          responseData.message ||
          responseData.error ||
          `HTTP ${response.status}`,
        );
      }


      console.log(
        'CUSTOMER FCM token saved successfully:',
        responseData,
      );

      return fcmToken;

    } catch (error) {

      console.error(
        'CUSTOMER FCM setup error:',
        error,
      );

      return null;
    }
  };