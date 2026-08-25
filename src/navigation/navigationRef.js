import {
  createNavigationContainerRef,
} from '@react-navigation/native';

export const navigationRef =
  createNavigationContainerRef();

let pendingTicketData = null;


/*
 * Notification se correct ticket open.
 */
export const openTicketFromNotification = data => {

  console.log(
    'CUSTOMER Notification navigation data:',
    data,
  );

  if (!data?.ticketId) {

    console.log(
      'CUSTOMER Notification ticketId missing',
    );

    return;
  }

  const routeParams = {

    ticketId:
      String(data.ticketId),

    subject:
      String(
        data.ticketSubject ||
        'Ticket Details',
      ),

    threadId:
      String(
        data.threadId || '',
      ),

    fromNotification:
      true,
  };


  const currentRoute =
    navigationRef.isReady()
      ? navigationRef.getCurrentRoute()
      : null;

  console.log(
    'CUSTOMER Current route during notification:',
    currentRoute?.name,
  );


  /*
   * Navigation ready nahi hai
   * ya Loading screen chal rahi hai,
   * to temporarily save karo.
   */
  if (
    !navigationRef.isReady() ||
    currentRoute?.name === 'Loading'
  ) {

    console.log(
      'CUSTOMER Saving notification ticket temporarily',
    );

    pendingTicketData =
      routeParams;

    return;
  }


  console.log(
    'CUSTOMER Opening ViewTicketDetail:',
    routeParams,
  );

  navigationRef.navigate(
    'ViewTicketDetail',
    routeParams,
  );
};


/*
 * Pending ticket hai ya nahi.
 */
export const hasPendingTicket =
  () => {

    return Boolean(
      pendingTicketData?.ticketId,
    );
  };


/*
 * Navigation ready hone ke baad
 * pending ticket open.
 */
export const openPendingTicket =
  () => {

    if (
      !navigationRef.isReady() ||
      !pendingTicketData
    ) {

      return false;
    }

    const routeParams =
      pendingTicketData;

    pendingTicketData = null;

    console.log(
      'CUSTOMER Opening pending ticket:',
      routeParams,
    );

    navigationRef.navigate(
      'ViewTicketDetail',
      routeParams,
    );

    return true;
  };