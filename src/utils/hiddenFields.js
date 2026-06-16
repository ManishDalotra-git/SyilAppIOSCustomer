let hiddenData = {
  contactId: null,
};

export const setContactId = (id) => {
  hiddenData.contactId = id;
};

export const getContactId = () => hiddenData.contactId;