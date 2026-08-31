import React, {
  useEffect,
} from 'react';

import {
  Platform,
} from 'react-native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  NavigationContainer,
} from '@react-navigation/native';

import AsyncStorage
  from '@react-native-async-storage/async-storage';

import messaging
  from '@react-native-firebase/messaging';



// =====================================================
// SCREENS
// =====================================================

import Home
  from './src/screens/Home';

import Profile
  from './src/screens/Profile';

import Ticket
  from './src/screens/Ticket';

import ThankYou
  from './src/screens/ThankYou';

import Loading
  from './src/screens/Loading';

import Login
  from './src/screens/Login';

import ForgotPassword
  from './src/screens/ForgotPassword';

import KnowledgeBase
  from './src/screens/KnowledgeBase';

import KnowledgeDetail
  from './src/screens/KnowledgeDetail';

import More
  from './src/screens/More';

import Feedback
  from './src/screens/Feedback';

import AskAlex
  from './src/screens/AskAlex';

import ViewTicket
  from './src/screens/ViewTicket';

import ViewTicketDetail
  from './src/screens/ViewTicketDetail';

import UploadArticles
  from './src/screens/UploadArticles';

import OwnerTickets
  from './src/screens/OwnerTickets';

import Chatscreen
  from './src/screens/Chatscreen';

import CustomerNewsListing
  from './src/screens/CustomerNewsListing';

import CustomerNewsDetail
  from './src/screens/CustomerNewsDetail';

import WebViewScreen
  from './src/screens/WebViewScreen';



// =====================================================
// NAVIGATION HELPERS
// =====================================================

import {
  navigationRef,
  openPendingTicket,
} from './src/navigation/navigationRef';

import {
  setupNotificationNavigation,
} from './src/utils/fcm';



const Stack =
  createNativeStackNavigator();



// =====================================================
// SERVER URL
// =====================================================

const SERVER_URL =
  'https://syilappioscustomer.onrender.com';



// =====================================================
// SAVE CUSTOMER TOKEN TO SERVER
// =====================================================

const saveTokenToServer =
  async (
    email,
    fcmToken,
  ) => {

    try {

      if (
        !email ||
        !fcmToken
      ) {

        console.log(
          'APP FCM SAVE SKIPPED: email or token missing'
        );

        return false;

      }


      console.log(
        '=========================================='
      );

      console.log(
        'APP -> SAVE CUSTOMER FCM TOKEN'
      );

      console.log(
        'Email:',
        email
      );

      console.log(
        'Platform:',
        Platform.OS
      );


      const response =
        await fetch(
          `${SERVER_URL}/save-customer-fcm-token`,
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

                fcmToken:
                  fcmToken,

                platform:
                  Platform.OS,

              }),
          }
        );


      const responseText =
        await response.text();


      console.log(
        'APP FCM SAVE STATUS:',
        response.status
      );


      console.log(
        'APP FCM SAVE RESPONSE:',
        responseText
      );


      if (
        !response.ok
      ) {

        console.log(
          'APP FCM TOKEN SERVER SAVE FAILED'
        );

        return false;

      }


      /*
       * Local token bhi latest rakho.
       */

      await AsyncStorage.setItem(
        'customer_fcm_token',
        fcmToken
      );


      console.log(
        'APP CUSTOMER FCM TOKEN SAVED SUCCESSFULLY'
      );


      console.log(
        '=========================================='
      );


      return true;


    } catch (error) {

      console.log(
        'APP SAVE CUSTOMER FCM TOKEN ERROR:',
        error
      );


      return false;

    }

  };



// =====================================================
// APP
// =====================================================

const App = () => {



  // ===================================================
  // NOTIFICATION NAVIGATION
  // ===================================================

  useEffect(
    () => {

      console.log(
        'Setting up Customer notification navigation'
      );


      const unsubscribe =
        setupNotificationNavigation();


      return () => {

        if (
          typeof unsubscribe ===
          'function'
        ) {

          unsubscribe();

        }

      };

    },
    []
  );



  // ===================================================
  // SYNC TOKEN WHEN APP STARTS
  //
  // Agar user already logged-in hai aur app dobara
  // open karta hai, current Firebase token HubSpot me
  // dobara confirm/save ho jayega.
  // ===================================================

  useEffect(
    () => {

      const syncCustomerTokenOnAppStart =
        async () => {

          try {

            console.log(
              '=========================================='
            );

            console.log(
              'CUSTOMER APP FCM STARTUP CHECK'
            );


            const isLoggedIn =
              await AsyncStorage.getItem(
                'isLoggedIn'
              );


            const savedEmail =
              await AsyncStorage.getItem(
                'userEmail'
              );


            console.log(
              'Is Logged In:',
              isLoggedIn
            );


            console.log(
              'Saved Email:',
              savedEmail
                ? 'AVAILABLE'
                : 'EMPTY'
            );



            // -------------------------------------------
            // USER LOGGED OUT
            // -------------------------------------------

            if (
              isLoggedIn !==
                'true' ||
              !savedEmail
            ) {

              console.log(
                'APP FCM STARTUP SYNC SKIPPED: user not logged in'
              );


              console.log(
                '=========================================='
              );


              return;

            }



            // -------------------------------------------
            // ENABLE FIREBASE AUTO INIT
            // -------------------------------------------

            try {

              await messaging()
                .setAutoInitEnabled(
                  true
                );


              console.log(
                'Firebase auto init enabled'
              );

            } catch (error) {

              console.log(
                'Firebase auto init warning:',
                error
              );

            }



            // -------------------------------------------
            // iOS REMOTE MESSAGE REGISTRATION
            // -------------------------------------------

            if (
              Platform.OS ===
              'ios'
            ) {

              try {

                await messaging()
                  .registerDeviceForRemoteMessages();


                console.log(
                  'APP: iOS registered for remote messages'
                );

              } catch (error) {

                console.log(
                  'APP iOS registration warning:',
                  error
                );

              }



              // -----------------------------------------
              // APNs TOKEN DEBUG
              // -----------------------------------------

              try {

                const apnsToken =
                  await messaging()
                    .getAPNSToken();


                console.log(
                  'APP APNs token:',
                  apnsToken
                    ? 'AVAILABLE'
                    : 'NOT AVAILABLE'
                );

              } catch (error) {

                console.log(
                  'APP APNs token check error:',
                  error
                );

              }

            }



            // -------------------------------------------
            // GET CURRENT FCM TOKEN
            // -------------------------------------------

            console.log(
              'APP: Getting current FCM token...'
            );


            const currentToken =
              await messaging()
                .getToken();


            if (
              !currentToken
            ) {

              console.log(
                'APP STARTUP FCM TOKEN EMPTY'
              );


              return;

            }



            console.log(
              'APP Current FCM Token:',
              `${currentToken.substring(
                0,
                20
              )}...`
            );



            // -------------------------------------------
            // SAVE SERVER
            // -------------------------------------------

            await saveTokenToServer(
              savedEmail,
              currentToken
            );


            console.log(
              'CUSTOMER APP FCM STARTUP SYNC FINISHED'
            );


            console.log(
              '=========================================='
            );


          } catch (error) {

            console.log(
              'CUSTOMER APP STARTUP FCM ERROR:',
              error
            );

          }

        };


      syncCustomerTokenOnAppStart();

    },
    []
  );



  // ===================================================
  // FCM TOKEN REFRESH LISTENER
  //
  // Firebase kabhi bhi device ka token change kar
  // sakta hai.
  //
  // New token automatically HubSpot me update hoga.
  // ===================================================

  useEffect(
    () => {

      console.log(
        'Registering Customer FCM token refresh listener'
      );


      const unsubscribe =
        messaging()
          .onTokenRefresh(
            async newToken => {

              try {

                console.log(
                  '=========================================='
                );

                console.log(
                  'CUSTOMER FCM TOKEN REFRESHED'
                );


                if (
                  !newToken
                ) {

                  console.log(
                    'NEW FCM TOKEN EMPTY'
                  );

                  return;

                }


                console.log(
                  'New Customer FCM Token:',
                  `${newToken.substring(
                    0,
                    20
                  )}...`
                );



                // ---------------------------------------
                // CHECK LOGIN
                // ---------------------------------------

                const isLoggedIn =
                  await AsyncStorage.getItem(
                    'isLoggedIn'
                  );


                const savedEmail =
                  await AsyncStorage.getItem(
                    'userEmail'
                  );


                console.log(
                  'Token refresh logged in:',
                  isLoggedIn
                );


                console.log(
                  'Token refresh email:',
                  savedEmail
                    ? 'AVAILABLE'
                    : 'EMPTY'
                );



                if (
                  isLoggedIn !==
                    'true' ||
                  !savedEmail
                ) {

                  console.log(
                    'TOKEN REFRESH SERVER SAVE SKIPPED: user logged out'
                  );


                  return;

                }



                // ---------------------------------------
                // SAVE NEW TOKEN
                // ---------------------------------------

                await AsyncStorage.setItem(
                  'customer_fcm_token',
                  newToken
                );


                await saveTokenToServer(
                  savedEmail,
                  newToken
                );


                console.log(
                  'CUSTOMER REFRESHED FCM TOKEN SAVED'
                );


                console.log(
                  '=========================================='
                );


              } catch (error) {

                console.log(
                  'CUSTOMER TOKEN REFRESH ERROR:',
                  error
                );

              }

            }
          );


      return () => {

        if (
          typeof unsubscribe ===
          'function'
        ) {

          unsubscribe();

        }

      };

    },
    []
  );



  // ===================================================
  // NAVIGATION
  // ===================================================

  return (

    <NavigationContainer

      ref={
        navigationRef
      }

      onReady={() => {

        console.log(
          'Customer Navigation container ready'
        );


        openPendingTicket();

      }}

    >

      <Stack.Navigator>


        <Stack.Screen
          name="Loading"
          component={Loading}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="Ticket"
          component={Ticket}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="ThankYou"
          component={ThankYou}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="Login"
          component={Login}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPassword}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="KnowledgeBase"
          component={KnowledgeBase}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="KnowledgeDetail"
          component={KnowledgeDetail}
          options={{
            title:
              'Article',

            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="More"
          component={More}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="Feedback"
          component={Feedback}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="AskAlex"
          component={AskAlex}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="ViewTicket"
          component={ViewTicket}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="ViewTicketDetail"
          component={ViewTicketDetail}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="UploadArticles"
          component={UploadArticles}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="OwnerTickets"
          component={OwnerTickets}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="Chatscreen"
          component={Chatscreen}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="CustomerNewsListing"
          component={CustomerNewsListing}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="CustomerNewsDetail"
          component={CustomerNewsDetail}
          options={{
            headerShown:
              false,
          }}
        />


        <Stack.Screen
          name="WebViewScreen"
          component={WebViewScreen}
          options={{
            headerShown:
              false,
          }}
        />


      </Stack.Navigator>

    </NavigationContainer>

  );

};



export default App;