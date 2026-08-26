import React, {
  useCallback,
  useState,
  useRef,
} from 'react';

import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
  StatusBar,
  Platform,
  Pressable,
  FlatList,
} from 'react-native';

import {
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import Footer from './components/Footer';



const OwnerTickets = ({ navigation }) => {

  StatusBar.setTranslucent(true);
  StatusBar.setBackgroundColor('transparent');
  StatusBar.setBarStyle('dark-content');


  const route =
    useRoute();

  const currentRoute =
    route.name;



  // =====================================================
  // STATES
  // =====================================================

  const [tickets, setTickets] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [firstName, setFirstName] =
    useState('');

  const [lastName, setLastName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [
    appSupportTeamMember,
    setAppSupportTeamMember,
  ] = useState(false);


  /*
   * Old API request ko invalidate
   * karne ke liye.
   */

  const requestId =
    useRef(0);



  // =====================================================
  // LOAD USER DATA
  // =====================================================

  useFocusEffect(

    useCallback(
      () => {

        console.log(
          '========== CUSTOMER OWNER TICKET FOCUSED =========='
        );


        requestId.current += 1;


        const loadUserData =
          async () => {

            try {

              const userFirstName =
                await AsyncStorage.getItem(
                  'userFirstName'
                );


              const userLastName =
                await AsyncStorage.getItem(
                  'userLastName'
                );


              const savedEmail =
                await AsyncStorage.getItem(
                  'userEmail'
                );


              const supportMember =
                await AsyncStorage.getItem(
                  'app_support_team_member'
                );


              console.log(
                'OwnerTicket firstName:',
                userFirstName
              );


              console.log(
                'OwnerTicket lastName:',
                userLastName
              );


              console.log(
                'OwnerTicket email:',
                savedEmail
              );


              console.log(
                'OwnerTicket support member:',
                supportMember
              );


              setFirstName(
                userFirstName ||
                  ''
              );


              setLastName(
                userLastName ||
                  ''
              );


              setEmail(
                savedEmail ||
                  ''
              );


              setAppSupportTeamMember(
                supportMember ===
                  'Yes'
              );


            } catch (error) {

              console.log(
                'OwnerTicket user load error:',
                error
              );

            }

          };


        loadUserData();


        return () => {

          /*
           * Screen leave hone par
           * current request invalidate.
           */

          requestId.current += 1;

        };

      },
      []
    )

  );



  // =====================================================
  // FETCH OWNER TICKETS
  // =====================================================

  useFocusEffect(

    useCallback(
      () => {

        if (!email) {

          console.log(
            'OwnerTicket fetch skipped: email missing'
          );

          return;

        }


        const fetchTickets =
          async () => {

            const currentRequest =
              ++requestId.current;


            try {

              setLoading(true);


              console.log(
                '===================================='
              );


              console.log(
                'FETCHING CUSTOMER OWNER TICKETS'
              );


              console.log(
                'User Email:',
                email
              );



              // =================================================
              // STEP 1
              // EMAIL -> HUBSPOT OWNER ID
              // =================================================

              const ownerRes =
                await fetch(
                  'https://syilappioscustomer.onrender.com/get-owner-id',
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
                          email,
                      }),
                  }
                );


              const ownerRaw =
                await ownerRes.text();


              console.log(
                'Owner HTTP Status:',
                ownerRes.status
              );


              console.log(
                'Owner Raw Response:',
                ownerRaw
              );


              if (!ownerRes.ok) {

                throw new Error(
                  `Owner lookup failed: ${ownerRes.status} ${ownerRaw}`
                );

              }


              let ownerData = {};


              try {

                ownerData =
                  ownerRaw
                    ? JSON.parse(
                        ownerRaw
                      )
                    : {};

              } catch (error) {

                throw new Error(
                  'Invalid Owner Lookup JSON'
                );

              }


              /*
               * Backend OwnerUserID HubSpot Owner ID
               * return kar raha hai.
               */

              const resolvedOwnerId =
                ownerData.OwnerUserID
                  ? String(
                      ownerData.OwnerUserID
                    )
                  : '35998790';


              console.log(
                'Resolved Customer Owner ID:',
                resolvedOwnerId
              );



              // =================================================
              // STEP 2
              // OWNER -> ALL TICKETS
              //
              // Backend pagination handle karega.
              // =================================================

              const response =
                await fetch(
                  'https://syilappioscustomer.onrender.com/get_owner_ticket',
                  {
                    method:
                      'POST',

                    headers: {
                      'Content-Type':
                        'application/json',
                    },

                    body:
                      JSON.stringify({
                        ownerId:
                          resolvedOwnerId,
                      }),
                  }
                );


              const responseText =
                await response.text();


              console.log(
                'Owner Tickets HTTP Status:',
                response.status
              );


              console.log(
                'Owner Tickets Raw Response:',
                responseText
              );


              if (!response.ok) {

                throw new Error(
                  `Owner Tickets API failed: ${response.status} ${responseText}`
                );

              }


              let data = {};


              try {

                data =
                  responseText
                    ? JSON.parse(
                        responseText
                      )
                    : {};

              } catch (error) {

                throw new Error(
                  'Invalid Owner Tickets JSON'
                );

              }


              /*
               * Agar user screen leave kar chuka ho
               * aur old API ab return kare,
               * state update mat karo.
               */

              if (
                currentRequest !==
                requestId.current
              ) {

                console.log(
                  'Old Owner Tickets response ignored'
                );

                return;

              }


              console.log(
                'Customer Owner Tickets Data:',
                data
              );


              console.log(
                'Backend Owner Ticket Total:',
                data.total
              );


              setTickets(
                Array.isArray(
                  data.tickets
                )
                  ? data.tickets
                  : []
              );


            } catch (error) {

              console.log(
                'Customer Owner Ticket Error:',
                error
              );


              if (
                currentRequest ===
                requestId.current
              ) {

                setTickets([]);

              }


            } finally {

              if (
                currentRequest ===
                requestId.current
              ) {

                setLoading(false);

              }

            }

          };


        fetchTickets();


      },
      [
        email,
      ]
    )

  );



  // =====================================================
  // CUSTOMER PORTAL FILTER
  //
  // Customer app me sirf
  // customer_portal = TRUE tickets.
  // =====================================================

  const filteredTickets =
    tickets.filter(
      item => {

        const portal =
          String(
            item.customer_portal ??
              ''
          )
            .trim()
            .toLowerCase();


        return (
          portal === 'true' ||
          portal === 'yes' ||
          portal === '1'
        );

      }
    );



  // =====================================================
  // SORT NEWEST FIRST
  // =====================================================

  const sortedTickets =
    [
      ...filteredTickets,
    ].sort(
      (
        a,
        b
      ) => {

        return (
          new Date(
            b.createdDate
          ).getTime() -

          new Date(
            a.createdDate
          ).getTime()
        );

      }
    );


  console.log(
    'OwnerTicket Total API Tickets:',
    tickets.length
  );


  console.log(
    'OwnerTicket Customer Portal Tickets:',
    filteredTickets.length
  );



  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate =
    dateString => {

      if (!dateString) {
        return '';
      }


      const date =
        new Date(
          dateString
        );


      return date.toLocaleDateString(
        'en-GB',
        {
          day:
            '2-digit',

          month:
            'short',

          year:
            'numeric',
        }
      );

    };



  // =====================================================
  // GET INITIALS
  // =====================================================

  const getInitials =
    (
      firstName = '',
      lastName = ''
    ) => {

      const first =
        firstName
          ?.charAt(0)
          ?.toUpperCase() ||
        '';


      const last =
        lastName
          ?.charAt(0)
          ?.toUpperCase() ||
        '';


      return `${first}${last}`;

    };



  // =====================================================
  // OWNER NAME
  // =====================================================

  const getStatusText =
    ownerId => {

      switch (
        String(
          ownerId ||
            ''
        )
      ) {

        case '3565407':
          return 'Tech Striker';

        case '4179990':
          return 'Pete Nicholls';

        case '18263262':
          return 'Jorge Murillo';

        case '28520943':
          return 'Paavo Laaksonen';

        case '31659248':
          return 'Mr. Xushuo';

        case '34789817':
          return 'Frans Buikema';

        case '35998790':
          return 'Mr. Chen';

        case '37497897':
          return 'Wesley Wang';

        case '39025454':
          return 'Ulises Rivera';

        case '60897705':
          return 'Ken Zhong';

        case '75260402':
          return 'Petr Dostálek';

        case '75329423':
          return 'Ashot Margaryan';

        case '75539833':
          return 'Nico Hugo';

        case '75539885':
          return 'Lev Levaneusky';

        case '76556861':
          return 'ANTOINE CAGLIOTI';

        case '76783421':
          return 'Gergő Peresztegi-Nagy';

        case '77228346':
          return 'Adinath Parmaj';

        case '77549745':
          return 'Yolyn Sam';

        case '78114697':
          return 'Nicola Roberts';

        case '78929149':
          return 'Doris Zhang';

        case '79421375':
          return 'Alex';

        case '80841596':
          return 'Xiaoyi Wu';

        case '81074581':
          return 'Luka Kljajić';

        case '81074588':
          return 'Renaud Perrin';

        case '81074589':
          return 'Manuel Weiss';

        case '81952028':
          return 'Marc Kneeshaw';

        case '81952029':
          return 'Gary Kneeshaw';

        case '82116023':
          return 'Ludwin Lai';

        case '82335884':
          return 'Mavis Xu';

        case '82335897':
          return 'Molly Che';

        case '82431058':
          return 'Fawad Khawaja';

        case '82472467':
          return 'Ramya Poobathy';

        case '82573946':
          return 'Dimitris Orfanidis';

        case '84095697':
          return 'gary.wallace@syil.com';

        case '84095698':
          return 'andrew.boyd@syil.com';

        case '85488871':
          return 'procurement@gmtgulf.com';

        case '85722551':
          return 'otorres@hartmetallgroup.com';

        case '85722552':
          return 'ivan.campos@campostools.com';

        case '85722553':
          return 'Radu Florin Plaiasu';

        case '85722554':
          return 'yossi@amg-machinery.com';

        case '85722555':
          return 'Walid MEZGHANI';

        case '85722556':
          return 'dan radulescu';

        case '85917932':
          return 'subhi jain';

        case '86106481':
          return 'GMT SYIL Support';

        case '86405174':
          return 'Anna Avetisyan';

        case '86405237':
          return 'Christian Scott';

        case '86405372':
          return 'sales@gmtgulf.com';

        case '86406673':
          return 'Yew Yeen Lee';

        case '87350983':
          return 'eric@syil.com';

        case '149082415':
          return 'Lee Wilkinson';

        case '347885886':
          return 'Brian Ang';

        case '561953197':
          return 'Evgeniya Ustyuzhanina';

        case '562969186':
          return 'Stefan Remde';

        case '685062721':
          return 'ROXANA CARRETO';

        case '730476349':
          return 'Marcus Refsgaard-Schuhmacher';

        case '739253069':
          return 'Richard Chagnon';

        case '972378267':
          return 'mentari@3dzaiku.com';

        case '1041824695':
          return 'Michal Pecina';

        case '1161041533':
          return 'James Mak';

        case '1532728806':
          return 'Joosia Miettinen';

        case '1560210639':
          return 'Tom Marshallsay';

        case '1682515558':
          return 'Chris Keller';

        case '1785961231':
          return 'Siarhei Melianchuk';

        case '1801645151':
          return 'Ivan Cavalera';

        case '1920062735':
          return 'Kaan Mehmetoğlu';

        case '1982134575':
          return 'Jan Crispyn';

        case '2065838673':
          return "Patrick O'Connor";

        case '2101352153':
          return 'Vaibhav Bhujbal';

        default:
          return 'In Progress';

      }

    };



  // =====================================================
  // UI
  // =====================================================

  return (

    <ImageBackground
      style={
        styles.background
      }
      resizeMode="cover"
    >

      <View
        style={
          styles.container
        }
      >

        <View
          style={
            styles.containerInner
          }
        >


          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <View
            style={
              styles.flexClass
            }
          >

            <Pressable
              onPress={() =>
                navigation.navigate(
                  'Profile'
                )
              }
            >

              <View
                style={
                  styles.initialsAvatar
                }
              >

                <Text
                  allowFontScaling={
                    false
                  }
                  style={
                    styles.initialsText
                  }
                >

                  {getInitials(
                    firstName,
                    lastName
                  )}

                </Text>

              </View>

            </Pressable>


            <Image
              source={require('../../images/syil_logo_black.png')}
              style={
                styles.logoSyil
              }
            />


            <Pressable
              onPress={() =>
                navigation.navigate(
                  'Ticket'
                )
              }
            >

              <Image
                source={require('../../images/ticket.png')}
                style={
                  styles.ticketIcon
                }
              />

            </Pressable>

          </View>



          {/* ================================================= */}
          {/* TABLE */}
          {/* ================================================= */}

          <View
            style={
              styles.ticketContainer
            }
          >

            <View
              style={
                styles.tableHeader
              }
            >

              <Text
                allowFontScaling={
                  false
                }
                style={[
                  styles.cell,
                  styles.headerText,
                ]}
              >
                Ticket ID
              </Text>


              <Text
                allowFontScaling={
                  false
                }
                style={[
                  styles.cell,
                  styles.headerText,
                ]}
              >
                Subject
              </Text>


              <Text
                allowFontScaling={
                  false
                }
                style={[
                  styles.cell,
                  styles.headerText,
                ]}
              >
                Created
              </Text>


              <Text
                allowFontScaling={
                  false
                }
                style={[
                  styles.cell,
                  styles.headerText,
                ]}
              >
                Ticket Owner
              </Text>

            </View>



            {/* ================================================= */}
            {/* LOADING */}
            {/* ================================================= */}

            {loading && (

              <Text
                allowFontScaling={
                  false
                }
                style={
                  styles.loadingText
                }
              >

                Loading ticket...

              </Text>

            )}



            {/* ================================================= */}
            {/* TICKET LIST */}
            {/* ================================================= */}

            {!loading && (

              <FlatList

                data={
                  sortedTickets
                }

                keyExtractor={(
                  item
                ) =>
                  String(
                    item.ticketId
                  )
                }

                showsVerticalScrollIndicator={
                  false
                }

                contentContainerStyle={{
                  paddingBottom:
                    300,

                  paddingTop:
                    0,
                }}

                renderItem={({
                  item,
                }) => (

                  <Pressable

                    onPress={() =>
                      navigation.navigate(
                        'ViewTicketDetail',
                        {
                          ticketId:
                            item.ticketId,

                          subject:
                            item.subject,
                        }
                      )
                    }

                  >

                    <View
                      style={
                        styles.tableRow
                      }
                    >


                      {/* ================================================= */}
                      {/* Ticket ID + Support Unread */}
                      {/* ================================================= */}

                      <View
                        style={
                          styles.ticketIdCell
                        }
                      >

                        <Text
                          allowFontScaling={
                            false
                          }
                          style={
                            styles.cellIDText
                          }
                        >

                          #{item.ticketId}

                        </Text>


                        {Number(
                          item.support_unread_count ||
                            0
                        ) > 0 && (

                          <View
                            style={
                              styles.unreadBadge
                            }
                          >

                            <Text
                              allowFontScaling={
                                false
                              }
                              style={
                                styles.unreadBadgeText
                              }
                            >

                              {
                                item.support_unread_count
                              }

                            </Text>

                          </View>

                        )}

                      </View>



                      {/* ================================================= */}
                      {/* SUBJECT */}
                      {/* ================================================= */}

                      <Text
                        allowFontScaling={
                          false
                        }
                        style={
                          styles.cell
                        }
                      >

                        {item.subject}

                      </Text>



                      {/* ================================================= */}
                      {/* CREATED */}
                      {/* ================================================= */}

                      <Text
                        allowFontScaling={
                          false
                        }
                        style={
                          styles.cell
                        }
                      >

                        {formatDate(
                          item.createdDate
                        )}

                      </Text>



                      {/* ================================================= */}
                      {/* OWNER */}
                      {/* ================================================= */}

                      <Text
                        allowFontScaling={
                          false
                        }
                        style={
                          styles.cell
                        }
                      >

                        {getStatusText(
                          item.ownerId
                        )}

                      </Text>


                    </View>

                  </Pressable>

                )}

                ListEmptyComponent={

                  <Text
                    allowFontScaling={
                      false
                    }
                    style={
                      styles.noTicketText
                    }
                  >

                    No tickets found

                  </Text>

                }

              />

            )}

          </View>

        </View>

      </View>



      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <Footer

        appSupportTeamMember={
          appSupportTeamMember
        }

        currentRoute={
          currentRoute
        }

      />


    </ImageBackground>

  );

};



export default OwnerTickets;



// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({

    background: {
      flex: 1,
    },


    container: {

      flex: 1,

      paddingHorizontal:
        16,

      paddingTop:
        Platform.OS ===
        'android'
          ? 60
          : 60,

      backgroundColor:
        '#fff',

    },


    containerInner: {
      flex: 1,
    },


    flexClass: {

      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom:
        26,

    },


    logoSyil: {

      width:
        87.6,

      height:
        24,

    },


    ticketIcon: {

      width:
        26.88,

      height:
        21.88,

    },


    initialsAvatar: {

      width:
        30,

      height:
        30,

      backgroundColor:
        '#000',

      borderRadius:
        100,

      justifyContent:
        'center',

      alignItems:
        'center',

    },


    initialsText: {

      fontSize:
        14,

      fontWeight:
        '500',

      color:
        '#FFEA00',

    },


    ticketContainer: {

      flex:
        1,

      marginTop:
        10,

    },


    tableHeader: {

      flexDirection:
        'row',

      paddingVertical:
        10,

      borderBottomWidth:
        1,

      borderColor:
        '#ddd',

    },


    tableRow: {

      flexDirection:
        'row',

      paddingVertical:
        14,

      borderBottomWidth:
        1,

      borderColor:
        '#f0f0f0',

    },


    cell: {

      flexBasis:
        '25%',

      width:
        '25%',

      fontSize:
        12,

      color:
        '#333',

      padding:
        5,

    },


    headerText: {

      fontWeight:
        '600',

      color:
        '#000',

    },


    loadingText: {

      textAlign:
        'center',

      padding:
        10,

      color:
        '#555',

    },


    noTicketText: {

      textAlign:
        'center',

      marginTop:
        20,

      color:
        '#999',

    },


    ticketIdCell: {

      flexBasis:
        '25%',

      width:
        '25%',

      flexDirection:
        'row',

      alignItems:
        'center',

      padding:
        5,

    },


    cellIDText: {

      fontSize:
        12,

      color:
        '#333',

      fontWeight:
        '700',

      flexShrink:
        1,

    },


    unreadBadge: {

      minWidth:
        20,

      height:
        20,

      borderRadius:
        10,

      backgroundColor:
        '#FFEA00',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        5,

      marginLeft:
        5,

    },


    unreadBadgeText: {

      color:
        '#000',

      fontSize:
        11,

      fontWeight:
        '700',

    },

  });