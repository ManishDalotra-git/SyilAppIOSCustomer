import React, {
  useState,
} from 'react';

import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

import {
  useNavigation,
} from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import messaging from '@react-native-firebase/messaging';

import {
  setContactId,
} from '../utils/hiddenFields';



const Login = () => {


  StatusBar.setTranslucent(true);

  StatusBar.setBackgroundColor(
    'transparent'
  );

  StatusBar.setBarStyle(
    'light-content'
  );


  const navigation =
    useNavigation();


  const [
    username,
    setUsername,
  ] = useState('');


  const [
    password,
    setPassword,
  ] = useState('');


  const [
    secure,
    setSecure,
  ] = useState(true);


  const [
    loading,
    setLoading,
  ] = useState(false);



  // =====================================================
  // SMALL DELAY HELPER
  // =====================================================

  const wait =
    milliseconds =>
      new Promise(
        resolve =>
          setTimeout(
            resolve,
            milliseconds
          )
      );



  // =====================================================
  // CUSTOMER FCM TOKEN
  // =====================================================

  const saveCustomerFCMTokenAfterLogin =
    async email => {

      try {

        console.log(
          '=========================================='
        );

        console.log(
          'CUSTOMER FCM SAVE START'
        );

        console.log(
          'Platform:',
          Platform.OS
        );

        console.log(
          'Customer email:',
          email
        );

        console.log(
          '=========================================='
        );


        if (!email) {

          console.log(
            'CUSTOMER FCM SAVE STOPPED: email missing'
          );

          return false;

        }



        // =================================================
        // FIREBASE AUTO INIT
        // =================================================

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
            'setAutoInitEnabled warning:',
            error
          );

        }



        // =================================================
        // iOS PERMISSION + REGISTRATION
        // =================================================

        if (
          Platform.OS ===
          'ios'
        ) {

          console.log(
            'Requesting iOS notification permission...'
          );


          const authStatus =
            await messaging()
              .requestPermission();


          console.log(
            'iOS notification auth status:',
            authStatus
          );


          const enabled =
            authStatus ===
              messaging
                .AuthorizationStatus
                .AUTHORIZED ||

            authStatus ===
              messaging
                .AuthorizationStatus
                .PROVISIONAL;


          console.log(
            'Notifications enabled:',
            enabled
          );


          if (!enabled) {

            console.log(
              'CUSTOMER FCM SAVE STOPPED: notification permission not enabled'
            );

            return false;

          }



          // ===============================================
          // REGISTER DEVICE FOR REMOTE MESSAGES
          // ===============================================

          try {

            await messaging()
              .registerDeviceForRemoteMessages();


            console.log(
              'iOS device registered for remote messages'
            );

          } catch (error) {

            console.log(
              'registerDeviceForRemoteMessages warning:',
              error
            );

          }



          // ===============================================
          // WAIT FOR APNS TOKEN
          // ===============================================

          let apnsToken =
            null;


          for (
            let attempt = 1;
            attempt <= 5;
            attempt++
          ) {

            try {

              apnsToken =
                await messaging()
                  .getAPNSToken();


              console.log(
                `APNs token attempt ${attempt}:`,
                apnsToken
                  ? 'AVAILABLE'
                  : 'NOT AVAILABLE'
              );


              if (
                apnsToken
              ) {

                console.log(
                  'APNs Token:',
                  `${apnsToken.substring(
                    0,
                    15
                  )}...`
                );


                break;

              }

            } catch (error) {

              console.log(
                `APNs token attempt ${attempt} error:`,
                error
              );

            }


            /*
             * TestFlight / real device par
             * APNs registration thoda time
             * le sakta hai.
             */

            await wait(
              1000
            );

          }


          if (!apnsToken) {

            console.log(
              'WARNING: APNs token still unavailable'
            );

            /*
             * Yahan return nahi karenge.
             * FCM getToken ko try karne denge.
             */

          }

        }



        // =================================================
        // GET FIREBASE FCM TOKEN
        // =================================================

        let fcmToken =
          null;


        for (
          let attempt = 1;
          attempt <= 5;
          attempt++
        ) {

          try {

            console.log(
              `Getting FCM token attempt ${attempt}...`
            );


            fcmToken =
              await messaging()
                .getToken();


            if (
              fcmToken
            ) {

              console.log(
                `FCM token received on attempt ${attempt}`
              );


              break;

            }


          } catch (error) {

            console.log(
              `FCM getToken attempt ${attempt} error:`,
              error
            );

          }


          await wait(
            1000
          );

        }



        if (!fcmToken) {

          console.log(
            'CUSTOMER FCM SAVE FAILED: Firebase token empty'
          );

          return false;

        }



        console.log(
          'CUSTOMER FCM TOKEN:',
          `${fcmToken.substring(
            0,
            20
          )}...`
        );



        // =================================================
        // SAVE TOKEN LOCALLY
        // =================================================

        await AsyncStorage.setItem(
          'customer_fcm_token',
          fcmToken
        );


        console.log(
          'Customer FCM token saved in AsyncStorage'
        );



        // =================================================
        // SAVE TOKEN TO RENDER / HUBSPOT
        // =================================================

        console.log(
          'Sending Customer FCM token to server...'
        );


        const response =
          await fetch(
            'https://syilappioscustomer.onrender.com/save-customer-fcm-token',
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
          'SAVE CUSTOMER FCM HTTP STATUS:',
          response.status
        );


        console.log(
          'SAVE CUSTOMER FCM RAW RESPONSE:',
          responseText
        );



        let responseData =
          {};


        try {

          responseData =
            responseText
              ? JSON.parse(
                  responseText
                )
              : {};

        } catch (error) {

          console.log(
            'Save Customer FCM response JSON parse error:',
            error
          );

        }



        if (
          !response.ok
        ) {

          console.log(
            'CUSTOMER FCM SERVER SAVE FAILED:',
            responseData
          );


          return false;

        }



        console.log(
          '=========================================='
        );

        console.log(
          'CUSTOMER FCM TOKEN SAVED SUCCESSFULLY'
        );

        console.log(
          'HubSpot Contact ID:',
          responseData.contactId
        );

        console.log(
          '=========================================='
        );


        return true;


      } catch (error) {

        console.log(
          '=========================================='
        );

        console.log(
          'CUSTOMER FCM TOKEN ERROR:',
          error
        );

        console.log(
          '=========================================='
        );


        return false;

      }

    };



  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit =
    async () => {

      if (
        !username.trim() ||
        !password
      ) {

        alert(
          'Please enter email and password'
        );

        return;

      }


      setLoading(
        true
      );


      try {

        const normalizedEmail =
          username
            .trim()
            .toLowerCase();


        console.log(
          '=========================================='
        );

        console.log(
          'CUSTOMER LOGIN START'
        );

        console.log(
          'Email:',
          normalizedEmail
        );

        console.log(
          '=========================================='
        );



        // =================================================
        // LOGIN API
        // =================================================

        const response =
          await fetch(
            'https://syilappioscustomer.onrender.com/check_login_detail',
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
                    normalizedEmail,

                  password:
                    password,

                }),
            }
          );


        const responseText =
          await response.text();


        console.log(
          'Login HTTP status:',
          response.status
        );


        console.log(
          'Login raw response:',
          responseText
        );



        let result =
          {};


        try {

          result =
            responseText
              ? JSON.parse(
                  responseText
                )
              : {};

        } catch (error) {

          console.log(
            'Login JSON error:',
            error
          );


          setLoading(
            false
          );


          alert(
            'Invalid server response'
          );


          return;

        }



        if (
          !response.ok
        ) {

          console.log(
            'Login failed:',
            result
          );


          setLoading(
            false
          );


          alert(
            result.message ||
              'Login failed'
          );


          return;

        }



        console.log(
          '=========================================='
        );

        console.log(
          'CUSTOMER LOGIN SUCCESS'
        );

        console.log(
          'Contact ID:',
          result.contactId
        );

        console.log(
          '=========================================='
        );



        // =================================================
        // SAVE LOGIN DATA
        // =================================================

        await AsyncStorage.setItem(
          'isLoggedIn',
          'true'
        );


        await AsyncStorage.setItem(
          'lastLoginTime',
          Date.now().toString()
        );


        await AsyncStorage.setItem(
          'userEmail',
          normalizedEmail
        );


        setContactId(
          result.contactId
        );


        await AsyncStorage.setItem(
          'userData',
          JSON.stringify({
            ...result.user,

            contactId:
              result.contactId,
          })
        );


        await AsyncStorage.setItem(
          'userID',
          String(
            result.contactId ??
              ''
          )
        );


        await AsyncStorage.setItem(
          'userFirstName',
          String(
            result.user
              ?.firstName ??
              ''
          )
        );


        await AsyncStorage.setItem(
          'userLastName',
          String(
            result.user
              ?.lastName ??
              ''
          )
        );


        await AsyncStorage.setItem(
          'userBio',
          String(
            result.user
              ?.bio ??
              ''
          )
        );


        await AsyncStorage.setItem(
          'userPhone',
          String(
            result.user
              ?.phone ??
              ''
          )
        );


        await AsyncStorage.setItem(
          'userGender',
          String(
            result.user
              ?.gender ??
              ''
          )
        );


        await AsyncStorage.setItem(
          'app_support_team_member',
          String(
            result.user
              ?.app_support_team_member ??
              ''
          )
        );



        console.log(
          'Customer login data saved in AsyncStorage'
        );



        // =================================================
        // IMPORTANT
        // SAVE FCM TOKEN AFTER LOGIN
        // =================================================

        const tokenSaved =
          await saveCustomerFCMTokenAfterLogin(
            normalizedEmail
          );


        console.log(
          '=========================================='
        );


        console.log(
          'Customer FCM final result:',
          tokenSaved
            ? 'SUCCESS'
            : 'FAILED'
        );


        console.log(
          '=========================================='
        );



        // =================================================
        // DEBUG SAVED DATA
        // =================================================

        const userID =
          await AsyncStorage.getItem(
            'userID'
          );


        const userFirstName =
          await AsyncStorage.getItem(
            'userFirstName'
          );


        const userLastName =
          await AsyncStorage.getItem(
            'userLastName'
          );


        const localFCMToken =
          await AsyncStorage.getItem(
            'customer_fcm_token'
          );


        console.log(
          'userID:',
          userID
        );


        console.log(
          'userFirstName:',
          userFirstName
        );


        console.log(
          'userLastName:',
          userLastName
        );


        console.log(
          'Local Customer FCM Token:',
          localFCMToken
            ? 'AVAILABLE'
            : 'EMPTY'
        );



        // =================================================
        // HOME
        // =================================================

        setLoading(
          false
        );


        navigation.replace(
          'Home'
        );


      } catch (error) {

        console.log(
          'CUSTOMER LOGIN ERROR:',
          error
        );


        setLoading(
          false
        );


        alert(
          'Network error'
        );

      }

    };



  // =====================================================
  // UI
  // =====================================================

  return (

    <ImageBackground

      source={require('../../images/Login_System.png')}

      style={
        styles.background
      }

      resizeMode="cover"

    >

      <KeyboardAvoidingView

        style={{
          flex: 1,
        }}

        behavior={
          Platform.OS ===
          'ios'
            ? 'padding'
            : 'height'
        }

        keyboardVerticalOffset={
          0
        }

      >

        <ScrollView

          contentContainerStyle={
            styles.container
          }

          showsVerticalScrollIndicator={
            false
          }

          keyboardShouldPersistTaps="handled"

        >


          {/* ================================================= */}
          {/* LOGO */}
          {/* ================================================= */}

          <View
            style={
              styles.logoAlign
            }
          >

            <Image

              source={require('../../images/syil_logo_white.png')}

              style={
                styles.logo
              }

            />

          </View>



          {/* ================================================= */}
          {/* WELCOME */}
          {/* ================================================= */}

          <Text
            allowFontScaling={
              false
            }
            style={
              styles.welcome
            }
          >

            Welcome back!

          </Text>



          {/* ================================================= */}
          {/* WHITE CARD */}
          {/* ================================================= */}

          <View
            style={
              styles.card
            }
          >

            <Text
              allowFontScaling={
                false
              }
              style={
                styles.signIn
              }
            >

              Sign In

            </Text>


            <Text
              allowFontScaling={
                false
              }
              style={
                styles.subText
              }
            >

              Enter Your email address and password to sign in the Customer Portal.

            </Text>



            {/* EMAIL */}

            <Text
              allowFontScaling={
                false
              }
              style={
                styles.label
              }
            >

              Email Address

            </Text>


            <TextInput

              allowFontScaling={
                false
              }

              style={
                styles.input
              }

              placeholder="Enter Your Email Address"

              value={
                username
              }

              onChangeText={
                setUsername
              }

              placeholderTextColor="#999"

              keyboardType="email-address"

              autoCapitalize="none"

              autoCorrect={
                false
              }

            />



            {/* PASSWORD */}

            <Text
              allowFontScaling={
                false
              }
              style={
                styles.label
              }
            >

              Password

            </Text>


            <View
              style={
                styles.passwordContainer
              }
            >

              <TextInput

                allowFontScaling={
                  false
                }

                style={
                  styles.passwordInput
                }

                placeholder="Enter Your Password"

                secureTextEntry={
                  secure
                }

                value={
                  password
                }

                onChangeText={
                  setPassword
                }

                placeholderTextColor="#999"

                autoCapitalize="none"

              />


              <TouchableOpacity

                onPress={() =>
                  setSecure(
                    !secure
                  )
                }

              >

                <Image

                  source={
                    secure

                      ? require('../../images/hide_icon.png')

                      : require('../../images/show_icon.png')
                  }

                  style={[
                    styles.eyeIcon,

                    secure
                      ? styles.hideIcon
                      : styles.showIcon,
                  ]}

                />

              </TouchableOpacity>

            </View>



            {/* FORGOT PASSWORD */}

            <Text

              allowFontScaling={
                false
              }

              onPress={() =>
                navigation.navigate(
                  'ForgotPassword'
                )
              }

              style={
                styles.forgot
              }

            >

              Forgot Password?

            </Text>



            {/* LOGIN BUTTON */}

            <TouchableOpacity

              disabled={
                loading
              }

              style={[
                styles.button,

                loading && {
                  opacity: 0.6,
                },
              ]}

              onPress={
                handleSubmit
              }

            >

              <Text
                allowFontScaling={
                  false
                }
                style={
                  styles.buttonText
                }
              >

                Log In

              </Text>

            </TouchableOpacity>

          </View>



          {/* ================================================= */}
          {/* SUPPORT */}
          {/* ================================================= */}

          <Text

            allowFontScaling={
              false
            }

            style={
              styles.footer
            }

            onPress={() =>
              Linking.openURL(
                'mailto:support@syil.com'
              )
            }

          >

            Need Help?{' '}

            <Text
              allowFontScaling={
                false
              }
              style={
                styles.support
              }
            >

              Contact Support

            </Text>

          </Text>


        </ScrollView>



        {/* ================================================= */}
        {/* LOADING MODAL */}
        {/* ================================================= */}

        <Modal

          visible={
            loading
          }

          transparent

          animationType="fade"

        >

          <View
            style={
              styles.loadingOverlay
            }
          >

            <Text
              allowFontScaling={
                false
              }
              style={
                styles.loadingText
              }
            >

              Please wait...

            </Text>

          </View>

        </Modal>


      </KeyboardAvoidingView>

    </ImageBackground>

  );

};



export default Login;



// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({

    background: {
      flex: 1,
    },


    container: {

      flexGrow:
        1,

      justifyContent:
        'flex-start',

      paddingHorizontal:
        16,

      paddingTop:
        Platform.OS ===
        'android'
          ? 60
          : 60,

      paddingBottom:
        30,

    },


    logoAlign: {

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    logo: {

      width:
        120,

      height:
        50,

      resizeMode:
        'contain',

      marginTop:
        0,

      alignSelf:
        'center',

    },


    welcome: {

      color:
        '#fff',

      fontSize:
        32,

      fontWeight:
        '700',

      marginBottom:
        20,

      marginTop:
        50,

      textAlign:
        'center',

    },


    card: {

      backgroundColor:
        '#fff',

      width:
        '100%',

      borderRadius:
        25,

      padding:
        20,

      marginVertical:
        20,

    },


    signIn: {

      fontSize:
        24,

      fontWeight:
        '700',

      textAlign:
        'center',

      marginBottom:
        10,

      color:
        '#000',

    },


    subText: {

      textAlign:
        'center',

      color:
        '#000',

      fontSize:
        16,

      marginBottom:
        20,

    },


    label: {

      fontWeight:
        '600',

      marginBottom:
        5,

      marginTop:
        10,

      fontSize:
        20,

      color:
        '#000',

    },


    input: {

      backgroundColor:
        '#F2F2F2',

      borderRadius:
        100,

      paddingHorizontal:
        15,

      height:
        48,

      fontSize:
        16,

      color:
        '#000',

    },


    forgot: {

      textAlign:
        'right',

      color:
        '#555',

      marginVertical:
        10,

    },


    button: {

      backgroundColor:
        '#FFEA00',

      borderRadius:
        30,

      height:
        50,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginTop:
        10,

    },


    buttonText: {

      fontSize:
        18,

      fontWeight:
        '700',

      color:
        '#000',

    },


    footer: {

      color:
        '#fff',

      fontSize:
        16,

      textAlign:
        'center',

      marginBottom:
        10,

    },


    support: {

      color:
        '#FFEA00',

      fontWeight:
        '700',

      fontSize:
        20,

    },


    passwordContainer: {

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        '#F2F2F2',

      borderRadius:
        100,

      paddingHorizontal:
        15,

      height:
        48,

    },


    passwordInput: {

      flex:
        1,

      fontSize:
        16,

      color:
        '#000',

    },


    eyeIcon: {

      width:
        22,

      resizeMode:
        'contain',

    },


    hideIcon: {
      height: 19,
    },


    showIcon: {
      height: 16,
    },


    loadingOverlay: {

      position:
        'absolute',

      top:
        0,

      left:
        0,

      right:
        0,

      bottom:
        0,

      backgroundColor:
        'rgba(255, 255, 255, 0.9)',

      justifyContent:
        'center',

      alignItems:
        'center',

      zIndex:
        999,

    },


    loadingText: {

      fontSize:
        24,

      fontWeight:
        '700',

      color:
        '#000',

      textAlign:
        'center',

    },

  });