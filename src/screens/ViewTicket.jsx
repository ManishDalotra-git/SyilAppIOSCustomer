import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Platform,
  Pressable,
  FlatList,
  Modal,
} from 'react-native';

import {
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import Footer from './components/Footer';



const TICKET_TYPE_KEY =
  'customer_view_ticket_selected_type';



const ViewTicket = ({ navigation }) => {

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

  const [firstName, setFirstName] =
    useState('');

  const [lastName, setLastName] =
    useState('');

  const [contactID, setContactID] =
    useState('');

  const [tickets, setTickets] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [
    appSupportTeamMember,
    setAppSupportTeamMember,
  ] = useState(false);


  /*
   * First time default:
   * Owned by me
   */

  const [ticketType, setTicketType] =
    useState('me');


  /*
   * Screen focus par same selection ka
   * fresh data load karne ke liye.
   */

  const [refreshKey, setRefreshKey] =
    useState(0);


  const [
    showTicketTypeModal,
    setShowTicketTypeModal,
  ] = useState(false);


  /*
   * Old API response ko latest selection
   * overwrite karne se rokne ke liye.
   */

  const requestId =
    useRef(0);



  // =====================================================
  // OWNED BY ME
  // =====================================================

  const fetchMyTickets =
    async () => {

      if (!contactID) {

        console.log(
          'Customer My Tickets skipped: contactID missing'
        );

        return;

      }


      const currentRequest =
        ++requestId.current;


      try {

        setLoading(true);


        console.log(
          '===================================='
        );

        console.log(
          'CUSTOMER: FETCH OWNED BY ME'
        );

        console.log(
          'Contact ID:',
          contactID
        );


        const response =
          await fetch(
            'https://syilappioscustomer.onrender.com/get-customer-my-tickets',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  contactId:
                    contactID,
                }),
            }
          );


        const responseText =
          await response.text();


        console.log(
          'Customer My Tickets HTTP status:',
          response.status
        );


        console.log(
          'Customer My Tickets raw response:',
          responseText
        );


        if (!response.ok) {

          throw new Error(
            `Customer My Tickets API failed: ${response.status} ${responseText}`
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

          console.log(
            'Customer My Tickets JSON error:',
            error
          );


          throw new Error(
            'Invalid Customer My Tickets JSON'
          );

        }


        /*
         * Agar dropdown change ho gaya
         * aur old response baad me aaye,
         * usko ignore karo.
         */

        if (
          currentRequest !==
          requestId.current
        ) {

          console.log(
            'Old Customer My Tickets response ignored'
          );

          return;

        }


        console.log(
          'Customer My Tickets Data:',
          data
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
          'Customer My Tickets Error:',
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



  // =====================================================
  // OWNED BY ORGANIZATION
  // =====================================================

  const fetchOrganizationTickets =
    async () => {

      if (!contactID) {

        console.log(
          'Customer Organization skipped: contactID missing'
        );

        return;

      }


      const currentRequest =
        ++requestId.current;


      try {

        setLoading(true);


        console.log(
          '===================================='
        );

        console.log(
          'CUSTOMER: FETCH OWNED BY ORGANIZATION'
        );

        console.log(
          'Contact ID:',
          contactID
        );


        const response =
          await fetch(
            'https://syilappioscustomer.onrender.com/get-customer-organization-tickets',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  contactId:
                    contactID,
                }),
            }
          );


        const responseText =
          await response.text();


        console.log(
          'Customer Organization HTTP status:',
          response.status
        );


        console.log(
          'Customer Organization raw response:',
          responseText
        );


        if (!response.ok) {

          throw new Error(
            `Customer Organization API failed: ${response.status} ${responseText}`
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

          console.log(
            'Customer Organization JSON error:',
            error
          );


          throw new Error(
            'Invalid Customer Organization JSON'
          );

        }


        if (
          currentRequest !==
          requestId.current
        ) {

          console.log(
            'Old Customer Organization response ignored'
          );

          return;

        }


        console.log(
          'Customer Organization Tickets Data:',
          data
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
          'Customer Organization Tickets Error:',
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



  // =====================================================
  // SCREEN FOCUS
  //
  // First time:
  // Owned by me
  //
  // Later:
  // Last selected me/org restore
  // =====================================================

  useFocusEffect(

    useCallback(
      () => {

        console.log(
          '========== CUSTOMER VIEW TICKET FOCUSED =========='
        );


        setShowTicketTypeModal(
          false
        );


        /*
         * Existing request invalidate.
         */

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


              const userContactID =
                await AsyncStorage.getItem(
                  'userID'
                );


              const supportMember =
                await AsyncStorage.getItem(
                  'app_support_team_member'
                );


              const savedTicketType =
                await AsyncStorage.getItem(
                  TICKET_TYPE_KEY
                );


              console.log(
                'Customer firstName:',
                userFirstName
              );


              console.log(
                'Customer lastName:',
                userLastName
              );


              console.log(
                'Customer contactID:',
                userContactID
              );


              console.log(
                'Customer Support Member:',
                supportMember
              );


              console.log(
                'Saved Customer Ticket Type:',
                savedTicketType
              );


              setFirstName(
                userFirstName ||
                  ''
              );


              setLastName(
                userLastName ||
                  ''
              );


              setContactID(
                userContactID ||
                  ''
              );


              setAppSupportTeamMember(
                supportMember ===
                  'Yes'
              );


              /*
               * Last valid selection restore.
               */

              if (
                savedTicketType ===
                  'me' ||
                savedTicketType ===
                  'org'
              ) {

                console.log(
                  'Restoring Customer Ticket Type:',
                  savedTicketType
                );


                setTicketType(
                  savedTicketType
                );

              } else {

                /*
                 * First ever visit.
                 */

                console.log(
                  'First Customer ViewTicket visit -> Owned by me'
                );


                setTicketType(
                  'me'
                );


                await AsyncStorage.setItem(
                  TICKET_TYPE_KEY,
                  'me'
                );

              }


              /*
               * Same contact + same ticketType ho,
               * tab bhi fresh API.
               */

              setRefreshKey(
                previous =>
                  previous + 1
              );


            } catch (error) {

              console.log(
                'Customer ViewTicket load error:',
                error
              );

            }

          };


        loadUserData();


        /*
         * Screen leave.
         */

        return () => {

          console.log(
            'Customer ViewTicket blurred'
          );


          requestId.current += 1;

        };

      },
      []
    )

  );



  // =====================================================
  // CORRECT API ACCORDING TO DROPDOWN
  // =====================================================

  useEffect(
    () => {

      if (!contactID) {

        console.log(
          'Customer Ticket API skipped: no contactID'
        );

        return;

      }


      console.log(
        '===================================='
      );

      console.log(
        'Customer Current Ticket Type:',
        ticketType
      );


      console.log(
        'Customer Refresh Key:',
        refreshKey
      );


      if (
        ticketType ===
        'me'
      ) {

        fetchMyTickets();

      } else if (
        ticketType ===
        'org'
      ) {

        fetchOrganizationTickets();

      }


      // eslint-disable-next-line react-hooks/exhaustive-deps

    },
    [
      contactID,
      ticketType,
      refreshKey,
    ]
  );



  // =====================================================
  // DROPDOWN CHANGE
  // =====================================================

  const handleTicketTypeChange =
    async newType => {

      try {

        console.log(
          'Customer changing Ticket Type:',
          newType
        );


        /*
         * Old request invalidate.
         */

        requestId.current += 1;


        /*
         * Immediately new value show.
         */

        setTicketType(
          newType
        );


        setShowTicketTypeModal(
          false
        );


        /*
         * Last selection save.
         */

        await AsyncStorage.setItem(
          TICKET_TYPE_KEY,
          newType
        );


        console.log(
          'Customer Ticket Type saved:',
          newType
        );


      } catch (error) {

        console.log(
          'Customer Ticket Type save error:',
          error
        );

      }

    };



  // =====================================================
  // CUSTOMER PORTAL FILTER
  //
  // Customer app me only customer_portal=true.
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
          portal ===
            'true' ||
          portal ===
            'yes' ||
          portal ===
            '1'
        );

      }
    );



  // =====================================================
  // NEWEST TICKET FIRST
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
    'Customer Total API Tickets:',
    tickets.length
  );


  console.log(
    'Customer Portal Filtered Tickets:',
    filteredTickets.length
  );



  // =====================================================
  // DATE FORMAT
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
  // INITIALS
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
          {/* TICKET TYPE */}
          {/* ================================================= */}

          <View
            style={{
              marginBottom:
                10,
            }}
          >

            <TouchableOpacity

              style={{

                borderWidth:
                  1,

                borderColor:
                  '#ddd',

                borderRadius:
                  6,

                height:
                  50,

                justifyContent:
                  'center',

                paddingHorizontal:
                  10,

              }}

              onPress={() =>
                setShowTicketTypeModal(
                  true
                )
              }

            >

              <Text
                allowFontScaling={
                  false
                }
                style={{
                  color:
                    '#000',
                }}
              >

                {ticketType ===
                'me'
                  ? 'Owned by me'
                  : 'Owned by organization'}

              </Text>

            </TouchableOpacity>

          </View>



          {/* ================================================= */}
          {/* DROPDOWN MODAL */}
          {/* ================================================= */}

          <Modal

            visible={
              showTicketTypeModal
            }

            transparent

            animationType="fade"

            onRequestClose={() =>
              setShowTicketTypeModal(
                false
              )
            }

          >

            <Pressable

              style={
                styles.modalOverlay
              }

              onPress={() =>
                setShowTicketTypeModal(
                  false
                )
              }

            >

              <Pressable
                style={
                  styles.modalContent
                }
                onPress={() => {}}
              >


                <TouchableOpacity

                  style={
                    styles.modalOption
                  }

                  onPress={() =>
                    handleTicketTypeChange(
                      'me'
                    )
                  }

                >

                  <Text
                    allowFontScaling={
                      false
                    }
                    style={
                      styles.modalOptionText
                    }
                  >

                    Owned by me

                  </Text>

                </TouchableOpacity>



                <TouchableOpacity

                  style={[
                    styles.modalOption,
                    styles.modalOptionLast,
                  ]}

                  onPress={() =>
                    handleTicketTypeChange(
                      'org'
                    )
                  }

                >

                  <Text
                    allowFontScaling={
                      false
                    }
                    style={
                      styles.modalOptionText
                    }
                  >

                    Owned by organization

                  </Text>

                </TouchableOpacity>


              </Pressable>

            </Pressable>

          </Modal>



          {/* ================================================= */}
          {/* TICKET TABLE */}
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



            {!loading && (

              <FlatList

                data={
                  sortedTickets
                }

                showsVerticalScrollIndicator={
                  false
                }

                keyExtractor={(
                  item
                ) =>
                  String(
                    item.ticketId
                  )
                }

                contentContainerStyle={{
                  paddingBottom:
                    420,

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


                      {/* Ticket ID + Customer unread badge */}

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
                          item.customer_unread_count ||
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
                                item.customer_unread_count
                              }

                            </Text>

                          </View>

                        )}

                      </View>



                      {/* Subject */}

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



                      {/* Created */}

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



                      {/* Owner */}

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



export default ViewTicket;



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


    // =================================================
    // MODAL
    // =================================================

    modalOverlay: {

      flex:
        1,

      backgroundColor:
        '#00000066',

      justifyContent:
        'center',

      paddingHorizontal:
        20,

    },


    modalContent: {

      backgroundColor:
        '#fff',

      borderRadius:
        10,

      overflow:
        'hidden',

    },


    modalOption: {

      padding:
        15,

      borderBottomWidth:
        1,

      borderBottomColor:
        '#ddd',

    },


    modalOptionLast: {

      borderBottomWidth:
        0,

    },


    modalOptionText: {

      fontSize:
        16,

      color:
        '#000',

    },


    // =================================================
    // TICKETS
    // =================================================

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