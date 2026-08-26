import notifee, {
  AndroidImportance,
  EventType,
} from '@notifee/react-native';

import {
  Platform,
} from 'react-native';

import {
  getApp,
} from '@react-native-firebase/app';

import {
  AuthorizationStatus,
  getAPNSToken,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  requestPermission,
} from '@react-native-firebase/messaging';

import {
  openTicketFromNotification,
} from '../navigation/navigationRef';


const firebaseApp =
  getApp();

const messaging =
  getMessaging(
    firebaseApp,
  );

const API_URL =
  'https://syilappioscustomer.onrender.com';


/*
 * =====================================================
 * Customer FCM Token Setup
 * =====================================================
 *
 * Login ke baad:
 *
 * 1. Notification permission
 * 2. APNs token check
 * 3. FCM token generate
 * 4. Backend -> HubSpot me save
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
       * Notification permission.
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
       * iOS APNs token.
       */
      if (
        Platform.OS ===
        'ios'
      ) {

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
       * Backend par token save.
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



/*
 * =====================================================
 * Notification Navigation + Foreground Handling
 * =====================================================
 *
 * Handles:
 *
 * 1. Foreground notification
 * 2. Background notification tap
 * 3. Quit-state notification tap
 */
export const setupNotificationNavigation =
  () => {

    console.log(
      'CUSTOMER notification navigation setup',
    );


    /*
     * =================================================
     * CASE 1:
     * App foreground me hai
     * =================================================
     */
    const unsubscribeForeground =
      onMessage(
        messaging,

        async remoteMessage => {

          try {

            console.log(
              'CUSTOMER foreground notification:',
              remoteMessage,
            );


            console.log(
              'CUSTOMER foreground data:',
              remoteMessage?.data,
            );


            const totalUnreadCount =
              Number(
                remoteMessage
                  ?.data
                  ?.totalUnreadCount ||
                0,
              );

            console.log(
              'CUSTOMER foreground total unread:',
              totalUnreadCount,
            );

            /*
            * App foreground me ho to
            * app icon badge manually update.
            */
            await notifee.setBadgeCount(
              totalUnreadCount,
            );

            console.log(
              'CUSTOMER foreground app badge updated:',
              totalUnreadCount,
            );


            const title =
              remoteMessage
                ?.notification
                ?.title ||
              'SYIL Support';


            const body =
              remoteMessage
                ?.notification
                ?.body ||
              'You have a new ticket update.';


            /*
             * Foreground me local notification
             * display karo.
             */
            await notifee
              .displayNotification({
                title,

                body,

                data:
                  remoteMessage
                    ?.data ||
                  {},


                /*
                 * iOS
                 */
                ios: {
                  sound:
                    'default',
                },


                /*
                 * Android future support.
                 */
                android: {
                  channelId:
                    'customer-ticket-updates',

                  importance:
                    AndroidImportance.HIGH,

                  pressAction: {
                    id:
                      'default',
                  },
                },
              });


            console.log(
              'CUSTOMER foreground notification displayed',
            );

          } catch (error) {

            console.error(
              'CUSTOMER foreground notification error:',
              error,
            );
          }
        },
      );


      const unsubscribeNotifeePress =
  notifee.onForegroundEvent(
    async ({
      type,
      detail,
    }) => {

      if (
        type !== EventType.PRESS
      ) {
        return;
      }

      console.log(
        'CUSTOMER Notifee notification pressed:',
        detail?.notification?.data,
      );

      const data =
        detail?.notification?.data ||
        {};

      openTicketFromNotification(
        data,
      );

      const notificationId =
        detail?.notification?.id;

      if (notificationId) {
        await notifee.cancelNotification(
          notificationId,
        );
      }
    },
  );



    /*
     * =================================================
     * CASE 2:
     * App background me thi.
     * User system notification par click karta hai.
     * =================================================
     */
    const unsubscribeOpened =
      onNotificationOpenedApp(
        messaging,

        remoteMessage => {

          console.log(
            'CUSTOMER notification opened from background:',
            remoteMessage,
          );


          if (!remoteMessage) {
            return;
          }


          console.log(
            'CUSTOMER notification data:',
            remoteMessage.data,
          );


          openTicketFromNotification(
            remoteMessage.data ||
              {},
          );
        },
      );



    /*
     * =================================================
     * CASE 3:
     * App completely closed / killed thi.
     *
     * Notification click se app open hui.
     * =================================================
     */
    getInitialNotification(
      messaging,
    )
      .then(
        remoteMessage => {

          if (!remoteMessage) {

            console.log(
              'CUSTOMER app was not opened from notification',
            );

            return;
          }


          console.log(
            'CUSTOMER app opened from quit-state notification:',
            remoteMessage,
          );


          console.log(
            'CUSTOMER initial notification data:',
            remoteMessage.data,
          );


          openTicketFromNotification(
            remoteMessage.data ||
              {},
          );
        },
      )
      .catch(
        error => {

          console.error(
            'CUSTOMER initial notification error:',
            error,
          );
        },
      );



    /*
     * =================================================
     * Cleanup
     * =================================================
     *
     * App.jsx useEffect cleanup ke waqt
     * dono listeners remove honge.
     */
    return () => {

  if (
    typeof unsubscribeForeground ===
    'function'
  ) {
    unsubscribeForeground();
  }

  if (
    typeof unsubscribeNotifeePress ===
    'function'
  ) {
    unsubscribeNotifeePress();
  }

  if (
    typeof unsubscribeOpened ===
    'function'
  ) {
    unsubscribeOpened();
  }

};
  };