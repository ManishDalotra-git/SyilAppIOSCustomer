require('dotenv').config();


const {
  initializeApp,
  cert,
  getApps,
} = require('firebase-admin/app');

const {
  getMessaging,
} = require('firebase-admin/messaging');


if (!process.env.FIREBASE_ADMIN_SDK) {
  throw new Error(
    'FIREBASE_ADMIN_SDK environment variable is missing',
  );
}


const firebaseServiceAccount =
  JSON.parse(
    process.env.FIREBASE_ADMIN_SDK,
  );


if (getApps().length === 0) {

  initializeApp({
    credential:
      cert(
        firebaseServiceAccount,
      ),
  });

}


console.log(
  'Customer Firebase Admin initialized',
);



const express = require('express');
const bodyParser = require('body-parser');

const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const multer = require('multer');
const { send } = require('process');
const hubspotUpload = multer({
  dest: 'uploads/'
});

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log('api--- ', HUBSPOT_API_KEY);
console.log('OPENAI_API_KEY--- ', OPENAI_API_KEY);





app.post('/ask-alex', async (req, res) => {
  const { question } = req.body;
  console.log('question---- ', question);
  try {
    
     console.log('question----try00 ', question);
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: 'gpt-5-mini',
        tools: [{ type: 'web_search' }],
        input: [
          {
            role: 'system',
            content:`
              You are "Alex", a professional AI support assistant for SYIL.

              ========================
              CORE KNOWLEDGE RULES
              ========================
              - Answer ONLY using information available on:
                • https://syil.com
                • https://syil.com/dealer-portal
              - Do NOT use external knowledge, assumptions, or general CNC information.
              - If requested information is not available on the official SYIL websites, say so clearly and politely.

              ========================
              GREETING & SMALL TALK
              ========================
              - If the user says "hi", "hello", "hey":
                Respond:
                "Hello! Welcome to SYIL Support. I'm Alex, your AI assistant 🙂.\n\nHow are you today? How may I assist you?"

              - If the user asks "how are you", "how are you doing":
                Respond professionally and friendly:
                "I'm doing well, thank you for asking. How are you today? How may I assist you?"

              - Do NOT include key features, machines, or product details in greeting or small talk responses.

              ========================
              SYIL / MACHINE / PRODUCT QUESTIONS
              ========================
              - ONLY when the user asks about:
                • SYIL as a company
                • CNC machines
                • Specific models (X5, X7, X9, X11, L-series, G2, R1, etc.)
                • Capabilities, specifications, or use cases
              - Then:
                - Provide a clear, accurate, and professional response.
                - Include a clearly labeled **"Key Features"** section in bullet points.
                - Ensure every feature is sourced from official SYIL website content.
                - Do not exaggerate or add marketing claims.

              ========================
              DEALER PORTAL & RESTRICTED INFO
              ========================
              - If the user asks about:
                • Pricing
                • Dealer access
                • Private documents
                • Restricted resources
              - Respond that this information is available through authorized dealers only.
              - Guide the user to the SYIL Dealer Portal.
              - Never guess or invent confidential information.

              ========================
              CLARIFICATION RULE
              ========================
              - If the user's question is unclear or incomplete, ask ONE short clarification question before answering.

              ========================
              TONE & STYLE
              ========================
              - Professional, polite, and friendly.
              - Clear and structured responses.
              - Use bullet points for features.
              - Avoid unnecessary verbosity or casual slang.

              ========================
              FALLBACK RULE
              ========================
              - If the question is unrelated to SYIL or not covered on the official websites:
                Respond:
                "This information is not available on the official SYIL website. Please contact SYIL support or an authorized dealer for further assistance."
              `
          },
          {
            role: 'user',
            content: question
          }
        ],
        text: {
          format: { type: 'text' }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    
    const messageBlock = response.data.output.find(
      o => o.type === 'message'
    );

    const content = messageBlock?.content?.[0] || {};
    const text = content.text || '';
    const annotations = content.annotations || [];

      
    const title =
      annotations.length > 0 && annotations[0].title
        ? annotations[0].title
        : '';


        console.log('content---- ', content);
        console.log('text---- ', text);
        console.log('annotations---- ', annotations);
        console.log('title---- ', title);

    return res.json({
      title,
      text
    });

  } catch (error) {
    console.error('OpenAI Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to fetch answer from OpenAI'
    });
  }
});





app.get('/articles', (req, res) => {
  const filePath = path.join(__dirname, 'assets', 'articles.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to read articles' });
    }

    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      res.status(500).json({ message: 'Invalid JSON format' });
    }
  });
});









const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/json') {
      return cb(new Error('Only JSON files are allowed'));
    }
    cb(null, true);
  }
});

app.post('/upload-articles', upload.single('file'), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'assets', 'articles.json');

  fs.readFile(tempPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Error reading file' });
    try {
      JSON.parse(data);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid JSON file' });
    }

    fs.writeFile(targetPath, data, 'utf8', (err) => {
      if (err) return res.status(500).json({ message: 'Error saving file' });

      fs.unlinkSync(tempPath);

      res.json({ message: 'articles.json updated successfully' });
    });
  });
});




app.post('/get-contact-id', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['email'],
        }),
      }
    );

    const searchData = await searchResponse.json();

    // Contact Found
    if (searchResponse.ok && searchData.results?.length > 0) {
      return res.json({
        contactId: searchData.results[0].id,
        created: false,
      });
    }

    // CREATE CONTACT (IF NOT FOUND)
    const createResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            email: email,
            hubspot_owner_id: '86106481'
          },
        }),
      }
    );

    const createData = await createResponse.json();

    if (createResponse.ok) {
      return res.json({
        contactId: createData.id,
        created: true,
      });
    } else {
      return res.status(createResponse.status).json(createData);
    }

  } catch (error) {
    console.error('Contact Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Step 2: Create ticket and associate with contact
const uploadedFiles = [];
app.post('/upload-to-hubspot', hubspotUpload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.json({ success: true, files: [] });
    }
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.path));
      formData.append('fileName', file.originalname);
      formData.append('folderId', '204201997753');
      formData.append(
        'options',
        JSON.stringify({ access: 'PUBLIC_INDEXABLE' })
      );
      const response = await axios.post(
        'https://api.hubapi.com/files/v3/files',
        formData,
        {
          headers: {
            Authorization: `Bearer ${HUBSPOT_API_KEY}`,
            ...formData.getHeaders(),
          },
        }
      );
      uploadedFiles.push({
        id: response.data.id,
        url: response.data.url,
      });
      fs.unlinkSync(file.path);
    }
    res.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (err) {
    console.log(err.response?.data || err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Create ticket via HubSpot form submission
app.post('/create-ticket', async (req, res) => {
  try {
    const { contactId, ticketData } = req.body;

    if (!ticketData) {
      return res.status(400).json({ error: 'ticketData missing' });
    }

    const {
      email,
      company,
      machineType,
      controller,
      serialNo,
      salesOrder,
      subject,
      description,
      priority,
      warranty,
      categories,
      files,
    } = ticketData;

    const categoryArray = Array.isArray(categories) ? categories : [];

    const fields = [
      { objectTypeId: '0-1', name: 'email', value: email || '' },

      { objectTypeId: '0-5', name: 'subject', value: subject || '' },
      { objectTypeId: '0-5', name: 'content', value: description || '' },
      { objectTypeId: '0-5', name: 'company', value: company || '' },
      { objectTypeId: '0-5', name: 'machine_type', value: machineType || '' },
      { objectTypeId: '0-5', name: 'controller', value: controller || '' },
      { objectTypeId: '0-5', name: 'machine_serial_number', value: serialNo || '' },
      { objectTypeId: '0-5', name: 'sales_order_number', value: salesOrder || '' },
      {
        objectTypeId: '0-5',
        name: 'warranty',
        value: warranty ? 'true' : 'false',
      },
      {
        objectTypeId: '0-5',
        name: 'hs_ticket_priority',
        value: priority || 'LOW',
      },
      {
        objectTypeId: '0-5',
        name: 'hs_ticket_category',
        value: categoryArray.join(';') || '',
      },
      {
        objectTypeId: '0-5',
        name: 'source_status',
        value: 'Mobile',
      },
      {
        objectTypeId: '0-5',
        name: 'customer_portal',
        value: 'True',
      },
    ];

  

    console.log('uploadedFiles----- ', uploadedFiles);

    if ( uploadedFiles && uploadedFiles.length > 0 ) 
        {
          const fileIds = uploadedFiles.map(f => f.id);

          fields.push({
            objectTypeId: '0-5',
            name: 'hs_file_upload',
            value: fileIds.join(';'),
          });
        }

    const formUrl = 'https://api.hsforms.com/submissions/v3/integration/submit/4392290/6cfd4e04-60e6-42ae-aea8-5e3825d8c7c0';


    console.log('fields---- ' , fields);

    const response = await axios.post(
      formUrl,
      { fields },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
      }
    );

    uploadedFiles.length = 0;
    console.log(response);
    console.log('HubSpot STATUS:', response.status);


    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    
    await new Promise(resolve => setTimeout(resolve, 15000));

    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['mobile_ticket_id'],
        }),
      }
    );

    const searchData = await searchResponse.json();

    const mobile_ticket_id =
      searchData?.results?.[0]?.properties?.mobile_ticket_id || null;

    /* ------------------ FINAL RESPONSE ------------------ */

    return res.status(200).json({
      success: true,
      message: 'Ticket created successfully',
      contactId,
      mobile_ticket_id,
    });
    


  } catch (err) {
    console.error(
      '❌ Error in /create-ticket:',
      err.response?.data || err.message
    );
    return res.status(500).json({ error: 'Ticket creation failed' });
  }
});


app.post('/get-user-data', async (req, res) => {
  const { email } = req.body;

  try {
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['app_support_team_member'],
        }),
      }
    );

    const data = await searchResponse.json();

    if (!data.results.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      app_support_team_member:
        data.results[0].properties.app_support_team_member || '',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});




app.post('/check_login_detail', async (req, res) => {
  const { email, password } = req.body;
  console.log('email---- ' , email);
  console.log(HUBSPOT_API_KEY);
  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required',
    });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    // SEARCH CONTACT BY EMAIL
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['email', 'mobile_password', 'firstname', 'lastname', 'profile_image', 'bio', 'phone', 'gender', 'app_support_team_member'],
        }),
      }
    );

    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      return res.status(401).json({
        message: 'Invalid email, please enter your valid email',
      });
    }

    const contact = searchData.results[0];
    const contactId = contact.id;
    const hubspotPassword = contact.properties.mobile_password;

    if (!hubspotPassword) {
      return res.status(401).json({
        message: 'Password not set for this account',
      });
    }

    if (hubspotPassword !== password) {
      return res.status(401).json({
        message: 'Please enter a valid password',
      });
    }

    // LOGIN SUCCESS
    return res.status(200).json({
      message: 'Login successful',
      contactId: contactId,
      user: {
        email: contact.properties.email,
        firstName: contact.properties.firstname || '',
        lastName: contact.properties.lastname || '',
        profileImage: contact.properties.hs_avatar_url || '',
        bio: contact.properties.bio || '',
        phone: contact.properties.phone || '',
        gender: contact.properties.gender || '',
        app_support_team_member: contact.properties.app_support_team_member || '',
      },
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
});


// Forgot Password
app.post('/forgot_password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    // Search contact by email in HubSpot
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                { propertyName: 'email', operator: 'EQ', value: email },
              ],
            },
          ],
          properties: ['email'],
        }),
      }
    );

    const searchData = await searchResponse.json();

    // Email not found
    if (!searchData.results || searchData.results.length === 0) {
      return res.status(404).json({ message: 'Please enter a valid email.' });
    }

    // Submit email to HubSpot form endpoint
    const formResponse = await fetch(
      'https://api.hsforms.com/submissions/v3/integration/submit/4392290/635124f0-b15f-40c2-9806-5405ca736690',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          fields: [
            {
              objectTypeId: '0-1',
              name: 'email',
              value: email,
            },
          ],
        }),
      }
    );

    if (!formResponse.ok) {
      const formError = await formResponse.text();
      console.error('Form submission error:', formError);
      return res.status(500).json({
        message: 'Failed to submit form. Please try again later.',
      });
    }

    // Success response
    return res.status(200).json({
      message:
        'Thank you for submitting the form. Please check your email to reset your password. If you do not see the email in your inbox, please check your spam or junk folder as well.',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});




app.post('/submit-feedback', async (req, res) => {
  const { email, subject, message, rating } = req.body;

  console.log('req__body_____ ', req.body);

  if (!email || !subject) {
    return res.status(400).json({ error: 'Email and Subject are required' });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    // -------- Step 1: Search contact --------
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                { propertyName: 'email', operator: 'EQ', value: email },
              ],
            },
          ],
          properties: ['email'],
        }),
      }
    );

    const searchData = await searchResponse.json();

    if (!searchResponse.ok || !searchData.results?.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contactId = searchData.results[0].id;

    // -------- Step 2: Create Feedback object & associate with contact --------
    const HUBSPOT_FEEDBACK_OBJECT_ID = '2-56321597';

    const feedbackResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/${HUBSPOT_FEEDBACK_OBJECT_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            subject: subject,
            what_went_wrong: message,
            rating: rating,
          },
          associations: [
            {
              to: { id: contactId },
              types: [{ associationCategory: 'USER_DEFINED', associationTypeId: 131 }]
            }
          ]
        })
      }
    );

    const feedbackData = await feedbackResponse.json();

    if (!feedbackResponse.ok) {
      return res.status(feedbackResponse.status).json(feedbackData);
    }

    res.json({ success: true, feedback: feedbackData, contactId });

  } catch (error) {
    console.error('Submit Feedback Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/get-profile-by-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: 'Email is required',
    });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    const response = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: [
            'email',
            'firstname',
            'lastname',
            'bio',
            'phone',
            'gender',
          ],
        }),
      }
    );

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const contact = data.results[0].properties;

    res.status(200).json({
      user: {
        email: contact.email || '',
        firstname: contact.firstname || '',
        lastname: contact.lastname || '',
        bio: contact.bio || '',
        phone: contact.phone || '',
        gender: contact.gender || '',
      },
    });

  } catch (error) {
    console.error('HubSpot API Error:', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
});



app.post('/update-profile', async (req, res) => {
  const { contactId, firstName, lastName, bio, phone, gender, image } = req.body;

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            firstname: firstName,
            lastname: lastName,
            bio,
            phone,
            gender,
            hs_avatar_url: image,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(400).json({ err });
    }

    res.json({
      success: true,
      user: { firstName, lastName, bio, phone, gender, profileImage: image },
    });

  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/get_tickets', async (req, res) => {
  const { contactId, type } = req.body;

  if (!contactId) {
    return res.status(400).json({
      message: 'Contact ID is required',
    });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    let ticketIds = [];

    if (type === 'me') {

      const associationResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/ticket`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const associationData = await associationResponse.json();

      if (associationData.results) {
        ticketIds = associationData.results.map(item => item.id);
      }
    }

    if (type === 'org') {

      const contactRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=companies`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const contactData = await contactRes.json();

      const companies = contactData?.associations?.companies?.results || [];

      const company = companies.find(c => c.type === 'contact_to_company');

      if (!company) {
        return res.status(200).json({ tickets: [] });
      }

      const companyId = company.id;

      const companyRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?associations=tickets`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const companyData = await companyRes.json();

      const tickets = companyData?.associations?.tickets?.results || [];

      ticketIds = tickets
        .filter(t => t.type === 'company_to_ticket')
        .map(t => t.id);
    }

    if (!ticketIds.length) {
      return res.status(200).json({
        message: 'No tickets found',
        tickets: [],
      });
    }

    const ticketPromises = ticketIds.map(ticketId =>
      fetch(
        `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}?properties=subject,createdate,hubspot_owner_id,hs_pipeline_stage,customer_portal,customer_unread_count`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      ).then(res => res.json())
    );

    const ticketResponses = await Promise.all(ticketPromises);

    const formattedTickets = ticketResponses.map(ticket => ({
      ticketId: ticket.id,
      subject: ticket.properties.subject || '',
      createdDate: ticket.properties.createdate || '',
      ownerId: ticket.properties.hubspot_owner_id || '',
      status: ticket.properties.hs_pipeline_stage || '',
      customer_portal: ticket.properties.customer_portal || '',
      customer_unread_count: Number(ticket.properties.customer_unread_count || 0),
    }));

    return res.status(200).json({
      tickets: formattedTickets,
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
});



app.post('/get-customer-my-tickets', async (req, res) => {

  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json({
      message: 'Contact ID is required',
    });
  }

  try {

    const fetch = (...args) =>
      import('node-fetch').then(
        ({ default: fetch }) => fetch(...args)
      );


    console.log(
      '========== GET CUSTOMER MY TICKETS =========='
    );

    console.log(
      'Contact ID:',
      contactId
    );


    // =====================================================
    // STEP 1
    // CONTACT -> ALL TICKET IDS
    // PAGINATION
    // =====================================================

    let allTicketIds = [];
    let after = null;
    let pageNumber = 1;


    do {

      let associationUrl =
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/tickets?limit=100`;


      if (after) {

        associationUrl +=
          `&after=${encodeURIComponent(after)}`;

      }


      console.log(
        `Fetching customer my-ticket association page ${pageNumber}`
      );


      const associationResponse =
        await fetch(
          associationUrl,
          {
            method: 'GET',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },
          }
        );


      const associationText =
        await associationResponse.text();


      let associationData = {};


      try {

        associationData =
          associationText
            ? JSON.parse(associationText)
            : {};

      } catch (error) {

        console.error(
          'Customer My Tickets association JSON error:',
          associationText
        );

        return res.status(500).json({
          message:
            'Invalid HubSpot association response',
        });

      }


      console.log(
        `Customer My Tickets page ${pageNumber} status:`,
        associationResponse.status
      );


      console.log(
        `Customer My Tickets page ${pageNumber} count:`,
        associationData.results?.length || 0
      );


      if (!associationResponse.ok) {

        console.error(
          'Customer My Tickets association failed:',
          associationData
        );


        return res
          .status(associationResponse.status)
          .json({
            message:
              'Failed to fetch customer ticket associations',

            detail:
              associationData,
          });

      }


      const pageIds =
        (associationData.results || [])
          .map(item => String(item.id))
          .filter(Boolean);


      allTicketIds.push(
        ...pageIds
      );


      console.log(
        'Customer My Ticket IDs collected:',
        allTicketIds.length
      );


      after =
        associationData
          ?.paging
          ?.next
          ?.after ||
        null;


      pageNumber += 1;


    } while (after);



    // =====================================================
    // REMOVE DUPLICATES
    // =====================================================

    const ticketIds = [
      ...new Set(allTicketIds),
    ];


    console.log(
      'FINAL UNIQUE CUSTOMER MY TICKET IDS:',
      ticketIds.length
    );


    if (!ticketIds.length) {

      return res.status(200).json({
        message:
          'No customer tickets found',

        total: 0,

        tickets: [],
      });

    }



    // =====================================================
    // STEP 2
    // BATCH READ TICKET DETAILS
    // =====================================================

    const BATCH_SIZE = 100;

    const chunks = [];


    for (
      let i = 0;
      i < ticketIds.length;
      i += BATCH_SIZE
    ) {

      chunks.push(
        ticketIds.slice(
          i,
          i + BATCH_SIZE
        )
      );

    }


    let allTickets = [];


    for (
      let batchIndex = 0;
      batchIndex < chunks.length;
      batchIndex++
    ) {

      const chunk =
        chunks[batchIndex];


      console.log(
        `Fetching Customer My Ticket batch ${batchIndex + 1}/${chunks.length}`
      );


      const batchResponse =
        await fetch(
          'https://api.hubapi.com/crm/v3/objects/tickets/batch/read',
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({

                properties: [
                  'subject',
                  'createdate',
                  'hubspot_owner_id',
                  'hs_pipeline_stage',
                  'customer_portal',
                  'customer_unread_count',
                ],

                inputs:
                  chunk.map(
                    ticketId => ({
                      id:
                        String(ticketId),
                    })
                  ),

              }),
          }
        );


      const batchText =
        await batchResponse.text();


      let batchData = {};


      try {

        batchData =
          batchText
            ? JSON.parse(batchText)
            : {};

      } catch (error) {

        console.error(
          `Customer My Ticket batch ${batchIndex + 1} JSON error:`,
          batchText
        );

        return res.status(500).json({
          message:
            `Invalid HubSpot response for batch ${batchIndex + 1}`,
        });

      }


      if (!batchResponse.ok) {

        console.error(
          `Customer My Ticket batch ${batchIndex + 1} failed:`,
          batchData
        );


        return res
          .status(batchResponse.status)
          .json({

            message:
              `Customer My Ticket batch ${batchIndex + 1} failed`,

            detail:
              batchData,
          });

      }


      allTickets.push(
        ...(batchData.results || [])
      );


      console.log(
        'Customer My Ticket details collected:',
        allTickets.length
      );


      if (
        batchIndex <
        chunks.length - 1
      ) {

        await new Promise(
          resolve =>
            setTimeout(resolve, 150)
        );

      }

    }



    // =====================================================
    // FORMAT
    // =====================================================

    const formattedTickets =
      allTickets
        .filter(
          ticket =>
            ticket &&
            ticket.properties
        )
        .map(ticket => ({

          ticketId:
            String(ticket.id),

          subject:
            ticket.properties
              ?.subject || '',

          createdDate:
            ticket.properties
              ?.createdate || '',

          ownerId:
            ticket.properties
              ?.hubspot_owner_id || '',

          status:
            ticket.properties
              ?.hs_pipeline_stage || '',

          customer_portal:
            ticket.properties
              ?.customer_portal ?? '',

          customer_unread_count:
            Number(
              ticket.properties
                ?.customer_unread_count ||
              0
            ),

        }));


    console.log(
      'FINAL CUSTOMER MY TICKETS:',
      formattedTickets.length
    );


    return res.status(200).json({

      message:
        'Customer my tickets fetched successfully',

      associatedTicketCount:
        ticketIds.length,

      total:
        formattedTickets.length,

      tickets:
        formattedTickets,

    });


  } catch (error) {

    console.error(
      'GET CUSTOMER MY TICKETS ERROR:',
      error
    );


    return res.status(500).json({

      message:
        'Internal server error',

      error:
        error?.message ||
        'Unknown error',

    });

  }

});




app.post(
  '/get-customer-organization-tickets',
  async (req, res) => {

    const { contactId } = req.body;


    if (!contactId) {

      return res.status(400).json({
        message:
          'Contact ID is required',
      });

    }


    try {

      const fetch = (...args) =>
        import('node-fetch').then(
          ({ default: fetch }) =>
            fetch(...args)
        );


      console.log(
        '========== GET CUSTOMER ORGANIZATION TICKETS =========='
      );

      console.log(
        'Contact ID:',
        contactId
      );


      // =====================================================
      // STEP 1
      // CONTACT -> COMPANY
      // =====================================================

      const contactResponse =
        await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=companies`,
          {
            method: 'GET',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },
          }
        );


      const contactData =
        await contactResponse.json();


      if (!contactResponse.ok) {

        return res
          .status(contactResponse.status)
          .json({
            message:
              'Failed to fetch contact company',

            detail:
              contactData,
          });

      }


      const companies =
        contactData
          ?.associations
          ?.companies
          ?.results ||
        [];


      if (!companies.length) {

        return res.status(200).json({

          message:
            'No organization found',

          total: 0,

          tickets: [],

        });

      }


      const companyId =
        String(
          companies[0].id
        );


      console.log(
        'Customer Company ID:',
        companyId
      );



      // =====================================================
      // STEP 2
      // COMPANY -> ALL TICKET IDS
      // PAGINATION
      // =====================================================

      let allTicketIds = [];

      let after = null;

      let pageNumber = 1;


      do {

        let associationUrl =
          `https://api.hubapi.com/crm/v3/objects/companies/${companyId}/associations/tickets?limit=100`;


        if (after) {

          associationUrl +=
            `&after=${encodeURIComponent(after)}`;

        }


        console.log(
          `Fetching Customer Organization association page ${pageNumber}`
        );


        const associationResponse =
          await fetch(
            associationUrl,
            {
              method: 'GET',

              headers: {
                Authorization:
                  `Bearer ${HUBSPOT_API_KEY}`,

                'Content-Type':
                  'application/json',
              },
            }
          );


        const associationText =
          await associationResponse.text();


        let associationData = {};


        try {

          associationData =
            associationText
              ? JSON.parse(
                  associationText
                )
              : {};

        } catch (error) {

          return res.status(500).json({

            message:
              'Invalid organization association response',

          });

        }


        console.log(
          `Customer Organization page ${pageNumber} count:`,
          associationData.results?.length || 0
        );


        if (!associationResponse.ok) {

          return res
            .status(
              associationResponse.status
            )
            .json({

              message:
                'Failed to fetch organization ticket associations',

              detail:
                associationData,

            });

        }


        const pageIds =
          (
            associationData.results ||
            []
          )
            .map(
              item =>
                String(item.id)
            )
            .filter(Boolean);


        allTicketIds.push(
          ...pageIds
        );


        after =
          associationData
            ?.paging
            ?.next
            ?.after ||
          null;


        pageNumber += 1;


      } while (after);



      // =====================================================
      // REMOVE DUPLICATES
      // =====================================================

      const ticketIds = [
        ...new Set(
          allTicketIds
        ),
      ];


      console.log(
        'FINAL CUSTOMER ORGANIZATION TICKET IDS:',
        ticketIds.length
      );


      if (!ticketIds.length) {

        return res.status(200).json({

          message:
            'No organization tickets found',

          total:
            0,

          tickets:
            [],

        });

      }



      // =====================================================
      // STEP 3
      // BATCH READ TICKETS
      // =====================================================

      const BATCH_SIZE =
        100;


      const chunks =
        [];


      for (
        let i = 0;
        i < ticketIds.length;
        i += BATCH_SIZE
      ) {

        chunks.push(
          ticketIds.slice(
            i,
            i + BATCH_SIZE
          )
        );

      }


      let allTickets =
        [];


      for (
        let batchIndex = 0;
        batchIndex < chunks.length;
        batchIndex++
      ) {

        const chunk =
          chunks[batchIndex];


        console.log(
          `Fetching Customer Organization batch ${batchIndex + 1}/${chunks.length}`
        );


        const batchResponse =
          await fetch(
            'https://api.hubapi.com/crm/v3/objects/tickets/batch/read',
            {
              method:
                'POST',

              headers: {
                Authorization:
                  `Bearer ${HUBSPOT_API_KEY}`,

                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({

                  properties: [
                    'subject',
                    'createdate',
                    'hubspot_owner_id',
                    'hs_pipeline_stage',
                    'customer_portal',
                    'customer_unread_count',
                  ],

                  inputs:
                    chunk.map(
                      ticketId => ({
                        id:
                          String(ticketId),
                      })
                    ),

                }),
            }
          );


        const batchText =
          await batchResponse.text();


        let batchData =
          {};


        try {

          batchData =
            batchText
              ? JSON.parse(
                  batchText
                )
              : {};

        } catch (error) {

          return res.status(500).json({

            message:
              `Invalid HubSpot organization batch ${batchIndex + 1}`,

          });

        }


        if (!batchResponse.ok) {

          console.error(
            `Customer Organization batch ${batchIndex + 1} failed:`,
            batchData
          );


          return res
            .status(
              batchResponse.status
            )
            .json({

              message:
                `Customer Organization batch ${batchIndex + 1} failed`,

              detail:
                batchData,

            });

        }


        allTickets.push(
          ...(
            batchData.results ||
            []
          )
        );


        console.log(
          'Customer Organization ticket details collected:',
          allTickets.length
        );


        if (
          batchIndex <
          chunks.length - 1
        ) {

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                150
              )
          );

        }

      }



      // =====================================================
      // FORMAT
      // =====================================================

      const formattedTickets =
        allTickets

          .filter(
            ticket =>
              ticket &&
              ticket.properties
          )

          .map(
            ticket => ({

              ticketId:
                String(ticket.id),

              subject:
                ticket.properties
                  ?.subject ||
                '',

              createdDate:
                ticket.properties
                  ?.createdate ||
                '',

              ownerId:
                ticket.properties
                  ?.hubspot_owner_id ||
                '',

              status:
                ticket.properties
                  ?.hs_pipeline_stage ||
                '',

              customer_portal:
                ticket.properties
                  ?.customer_portal ??
                '',

              customer_unread_count:
                Number(
                  ticket.properties
                    ?.customer_unread_count ||
                  0
                ),

            })
          );


      console.log(
        'FINAL CUSTOMER ORGANIZATION TICKETS:',
        formattedTickets.length
      );


      return res.status(200).json({

        message:
          'Customer organization tickets fetched successfully',

        organizationId:
          companyId,

        associatedTicketCount:
          ticketIds.length,

        total:
          formattedTickets.length,

        tickets:
          formattedTickets,

      });


    } catch (error) {

      console.error(
        'GET CUSTOMER ORGANIZATION TICKETS ERROR:',
        error
      );


      return res.status(500).json({

        message:
          'Internal server error',

        error:
          error?.message ||
          'Unknown error',

      });

    }

  }
);



app.post('/get_owner_ticket', async (req, res) => {

  const { ownerId } = req.body;


  if (!ownerId) {

    return res.status(400).json({

      message:
        'Owner ID is required',

    });

  }


  try {

    const fetch = (...args) =>
      import('node-fetch').then(
        ({ default: fetch }) =>
          fetch(...args)
      );


    console.log(
      '========== GET CUSTOMER OWNER TICKETS =========='
    );


    console.log(
      'Owner ID:',
      ownerId
    );


    let allTickets =
      [];

    let after =
      null;

    let pageNumber =
      1;



    // =====================================================
    // FETCH ALL OWNER TICKETS
    // WITH SEARCH PAGINATION
    // =====================================================

    do {

      console.log(
        `Fetching Customer Owner Ticket page ${pageNumber}`
      );


      const requestBody = {

        filterGroups: [
          {
            filters: [
              {
                propertyName:
                  'hubspot_owner_id',

                operator:
                  'EQ',

                value:
                  String(
                    ownerId
                  ),
              },
            ],
          },
        ],


        properties: [
          'subject',
          'content',
          'hs_pipeline',
          'hs_pipeline_stage',
          'hubspot_owner_id',
          'createdate',
          'customer_portal',
          'support_unread_count',
        ],


        limit:
          100,


        sorts: [
          {
            propertyName:
              'createdate',

            direction:
              'DESCENDING',
          },
        ],

      };


      if (after) {

        requestBody.after =
          after;

      }


      const response =
        await fetch(

          'https://api.hubapi.com/crm/v3/objects/tickets/search',

          {
            method:
              'POST',

            headers: {

              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',

            },


            body:
              JSON.stringify(
                requestBody
              ),

          }

        );


      const responseText =
        await response.text();


      let data = {};


      try {

        data =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};

      } catch (error) {

        console.error(
          `Customer Owner Ticket page ${pageNumber} JSON error:`,
          responseText
        );


        return res.status(500).json({

          message:
            `Invalid HubSpot response on Owner Ticket page ${pageNumber}`,

        });

      }


      console.log(
        `Customer Owner Ticket page ${pageNumber} HTTP status:`,
        response.status
      );


      console.log(
        `Customer Owner Ticket page ${pageNumber} count:`,
        data.results?.length ||
          0
      );


      if (!response.ok) {

        console.error(
          `Customer Owner Ticket page ${pageNumber} failed:`,
          data
        );


        return res
          .status(
            response.status
          )
          .json({

            message:
              `Failed to fetch Owner Ticket page ${pageNumber}`,

            detail:
              data,

          });

      }


      allTickets.push(
        ...(
          data.results ||
          []
        )
      );


      console.log(
        'Total Customer Owner Tickets collected:',
        allTickets.length
      );


      after =
        data
          ?.paging
          ?.next
          ?.after ||
        null;


      console.log(
        'Next after:',
        after
      );


      pageNumber +=
        1;


    } while (after);



    // =====================================================
    // REMOVE DUPLICATES
    // =====================================================

    const uniqueTickets =
      Array.from(

        new Map(

          allTickets.map(
            ticket => [

              String(
                ticket.id
              ),

              ticket,

            ]
          )

        ).values()

      );


    console.log(
      'Unique Customer Owner Tickets:',
      uniqueTickets.length
    );



    // =====================================================
    // FORMAT
    // =====================================================

    const tickets =
      uniqueTickets.map(
        item => ({

          ticketId:
            String(
              item.id
            ),

          subject:
            item.properties
              ?.subject ||
            '',

          createdDate:
            item.properties
              ?.createdate ||
            '',

          ownerId:
            item.properties
              ?.hubspot_owner_id ||
            '',

          status:
            item.properties
              ?.hs_pipeline_stage ||
            '',

          content:
            item.properties
              ?.content ||
            '',

          customer_portal:
            item.properties
              ?.customer_portal ??
            '',

          support_unread_count:
            Number(
              item.properties
                ?.support_unread_count ||
              0
            ),

        })
      );



    console.log(
      '===================================='
    );


    console.log(
      'FINAL CUSTOMER OWNER TICKET COUNT:',
      tickets.length
    );


    console.log(
      '===================================='
    );



    return res.status(200).json({

      message:
        'All customer owner tickets fetched successfully',

      ownerId:
        String(
          ownerId
        ),

      total:
        tickets.length,

      tickets:
        tickets,

    });


  } catch (error) {

    console.error(
      'Customer Owner Ticket Fetch Error:',
      {
        message:
          error?.message,

        stack:
          error?.stack,
      }
    );


    return res.status(500).json({

      message:
        'Internal server error',

      error:
        error?.message ||
        'Unknown error',

    });

  }

});



app.post('/get-owner-id', async (req, res) => {
  const { email } = req.body;
  console.log('=== get-owner-id hit ===');
  console.log('Email received:', email);

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const response = await axios.get(
      'https://api.hubapi.com/crm/v3/owners?archived=false',
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
      }
    );

    const owners = response.data.results || [];
    console.log('Total owners found:', owners.length);
    console.log('All owner emails:', owners.map(o => o.email));

    const matchedOwner = owners.find(
      (owner) => owner.email?.toLowerCase() === email?.toLowerCase()
    );

    console.log('Matched owner:', matchedOwner || 'NOT FOUND');

    if (!matchedOwner) {
      return res.status(200).json({ ownerId: null });
    }

    return res.status(200).json({ ownerId: matchedOwner.userId, OwnerUserID: matchedOwner.id });

  } catch (err) {
    console.error('Get owner error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to get owner' });
  }
});


app.post('/get_ticket_conversation', async (req, res) => {
  const { ticketId } = req.body;

  if (!ticketId) {
    return res.status(400).json({ message: 'Ticket ID is required' });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    const ticketRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}?properties=hs_conversations_originating_thread_id`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
      }
    );

    const ticketData = await ticketRes.json();
    const threadId =
      ticketData?.properties?.hs_conversations_originating_thread_id;

      console.log('threadId--- ' , threadId);
    if (!threadId) {
      return res.status(200).json({
        messages: [],
      });
    }

    // GET THREAD MESSAGES
    const msgRes = await fetch(
      `https://api.hubapi.com/conversations/v3/conversations/threads/${threadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
      }
    );

    const msgData = await msgRes.json();

    console.log('msgData--- ', msgData.results);  

    // FORMAT MESSAGES
    const formattedMessages = msgData.results
      .filter(m => m.type === 'MESSAGE')
      .map(m => {
        const sender = m.senders?.[0] || {};
        const email = sender?.deliveryIdentifier?.value || '';
        const name = sender?.name || email;

        return {
          id: m.id,
          direction: m.direction,
          senderName: name,
          text: m.text || '',
          richText: m.richText || '',
          createdAt: m.createdAt,
          subject : m.subject,
          attachments: m.attachments,
          channelAccountId : m.channelAccountId,
          channelId: m.channelId,
          conversationsThreadId: m.conversationsThreadId,
        };
      });

    return res.status(200).json({
      messages: formattedMessages,
    });

  } catch (err) {
    console.error('Conversation error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


const uploadedFilesForViewTicket = [];
app.post('/upload-to-hubspot-view', hubspotUpload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.json({ success: true, files: [] });
    }
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.path));
      formData.append('fileName', file.originalname);
      formData.append('folderId', '204201997753'); 
      formData.append(
        'options',
        JSON.stringify({ access: 'PUBLIC_INDEXABLE' })
      );
      const response = await axios.post(
        'https://api.hubapi.com/files/v3/files',
        formData,
        {
          headers: {
            Authorization: `Bearer ${HUBSPOT_API_KEY}`,
            ...formData.getHeaders(),
          },
        }
      );
      uploadedFilesForViewTicket.push({
        id: response.data.id,
        url: response.data.url,
      });
      fs.unlinkSync(file.path);
    }
    res.json({
      success: true,
      files: uploadedFilesForViewTicket,
    });
    console.log('uploadedFilesForViewTicket--- ', uploadedFilesForViewTicket);
    uploadedFilesForViewTicket.length = 0; 
  } catch (err) {
    console.log(err.response?.data || err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.post('/send-hubspot-message', async (req, res) => {
  const { threadId, text, recipientEmail, attachmentIds, channelAccountId, channelId, senderActorId, subject } = req.body;

  console.log('=== send-hubspot-message hit ===');
  console.log('threadId:', threadId);
  console.log('text:', text);
  console.log('recipientEmail:', recipientEmail);
  console.log('attachmentIds:', attachmentIds);
  console.log('channelAccountId:', channelAccountId);
  console.log('channelId:', channelId);
  console.log('senderActorId received:', senderActorId);
  console.log('subject:', subject);

  try {
    const body = {
      type: 'MESSAGE',
      text: text,
      subject: subject,
      senderActorId: senderActorId,
      channelId: '1002',
      channelAccountId: '597383280',
      recipients: [
        {
          recipientField: 'TO',
          deliveryIdentifiers: [
            { type: 'HS_EMAIL_ADDRESS', value: recipientEmail },
          ],
        },
      ],
    };

    if (attachmentIds && attachmentIds.length > 0) {
      body.attachments = attachmentIds.map((id) => ({ fileId: String(id) }));
    }

    console.log('Final body HubSpot ko ja raha hai:', JSON.stringify(body, null, 2));

    const response = await axios.post(
      `https://api.hubapi.com/conversations/v3/conversations/threads/${threadId}/messages`,
      body,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ HubSpot response:', response.data);
    return res.status(200).json({ success: true, data: response.data });

  } catch (err) {
    console.error('❌ Send message error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Message send failed', detail: err.response?.data });
  }
});
   

app.get('/customer-news', async (req, res) => {  
  try {
    const response = await fetch(
      'https://api.hubapi.com/cms/v3/blogs/posts?contentGroupId__eq=189594723724',
      {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.log('Customer News Error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
});
 

app.post(
  '/save-customer-fcm-token',
  async (req, res) => {

    const {
      email,
      fcmToken,
      platform,
    } = req.body;

    if (!email || !fcmToken) {
      return res.status(400).json({
        success: false,
        message:
          'Email and FCM token are required',
      });
    }

    try {

      const fetch = (...args) =>
        import('node-fetch').then(
          ({ default: fetch }) =>
            fetch(...args),
        );

      /*
       * HubSpot contact find by email.
       */
      const searchResponse =
        await fetch(
          'https://api.hubapi.com/crm/v3/objects/contacts/search',
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              filterGroups: [
                {
                  filters: [
                    {
                      propertyName:
                        'email',

                      operator:
                        'EQ',

                      value:
                        email
                          .trim()
                          .toLowerCase(),
                    },
                  ],
                },
              ],

              properties: [
                'email',
                'customer_fcm_token',
              ],

              limit: 1,
            }),
          },
        );

      const searchData =
        await searchResponse.json();

      if (!searchResponse.ok) {

        console.error(
          'Customer contact search error:',
          searchData,
        );

        return res
          .status(searchResponse.status)
          .json({
            success: false,
            message:
              'Unable to search HubSpot contact',
            detail:
              searchData,
          });
      }

      if (
        !searchData.results?.length
      ) {

        return res.status(404).json({
          success: false,
          message:
            'HubSpot contact not found',
        });
      }

      const contactId =
        searchData.results[0].id;


      /*
       * Customer FCM token save.
       */
      const updateResponse =
        await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
          {
            method:
              'PATCH',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                properties: {
                  customer_fcm_token:
                    fcmToken,
                },
              }),
          },
        );

      const updateText =
        await updateResponse.text();

      let updateData = {};

      try {

        updateData =
          updateText
            ? JSON.parse(
                updateText,
              )
            : {};

      } catch {

        updateData = {
          rawResponse:
            updateText,
        };
      }

      if (!updateResponse.ok) {

        console.error(
          'Customer FCM token update error:',
          updateData,
        );

        return res
          .status(updateResponse.status)
          .json({
            success: false,
            message:
              'Customer FCM token could not be saved',
            detail:
              updateData,
          });
      }

      console.log(
        `Customer FCM token saved for contact ${contactId}, platform ${platform || 'unknown'}`,
      );

      return res.status(200).json({
        success: true,
        message:
          'Customer FCM token saved successfully',
        contactId,
        platform:
          platform || '',
      });

    } catch (error) {

      console.error(
        'Save customer FCM token error:',
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          'Internal server error',
      });
    }
  },
);


/*
 * =====================================================
 * CUSTOMER LOGOUT - REMOVE FCM TOKEN
 * =====================================================
 */
app.post('/remove-customer-fcm-token', async (req, res) => {

  const { contactId, fcmToken } = req.body;

  console.log('CUSTOMER LOGOUT TOKEN REMOVE:', {
    contactId,
    hasToken: !!fcmToken,
  });

  if (!contactId) {
    return res.status(400).json({
      success: false,
      message: 'Contact ID is required',
    });
  }

  try {

    const fetch = (...args) =>
      import('node-fetch').then(
        ({ default: fetch }) => fetch(...args)
      );

    const contactResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=customer_fcm_token`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const contactData = await contactResponse.json();

    if (!contactResponse.ok) {
      console.error(
        'Customer logout contact fetch failed:',
        contactData
      );

      return res.status(500).json({
        success: false,
        message: 'Unable to fetch customer',
      });
    }

    const savedToken =
      contactData?.properties?.customer_fcm_token || '';

 
    if (
      fcmToken &&
      savedToken &&
      savedToken !== fcmToken
    ) {
      console.log(
        'CUSTOMER LOGOUT: token changed already, skipping clear'
      );

      return res.status(200).json({
        success: true,
        cleared: false,
        message: 'A newer token is already saved',
      });
    }

    /*
     * HubSpot token clear.
     */
    const updateResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
      {
        method: 'PATCH',

        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          properties: {
            customer_fcm_token: '',
          },
        }),
      }
    );

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      console.error(
        'Customer FCM token remove failed:',
        updateData
      );

      return res.status(500).json({
        success: false,
        message: 'Unable to remove customer FCM token',
      });
    }

    console.log(
      `Customer FCM token removed for contact ${contactId}`
    );

    return res.status(200).json({
      success: true,
      cleared: true,
      message: 'Customer FCM token removed successfully',
    });

  } catch (error) {

    console.error(
      'Customer logout token remove error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});





const getCustomerTotalUnreadCount =
  async (
    contactId,
    fetch,
  ) => {

    try {

      console.log(
        '========== GET CUSTOMER TOTAL UNREAD COUNT =========='
      );

      console.log(
        'Contact ID:',
        contactId
      );


      // =====================================================
      // STEP 1
      // CONTACT -> ALL ASSOCIATED TICKET IDS
      // WITH PAGINATION
      // =====================================================

      let allTicketIds = [];

      let after = null;

      let pageNumber = 1;


      do {

        let associationUrl =
          `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/tickets?limit=100`;


        if (after) {

          associationUrl +=
            `&after=${encodeURIComponent(after)}`;

        }


        console.log(
          `Fetching Customer Unread association page ${pageNumber}`
        );


        const associationResponse =
          await fetch(
            associationUrl,
            {
              method:
                'GET',

              headers: {

                Authorization:
                  `Bearer ${HUBSPOT_API_KEY}`,

                'Content-Type':
                  'application/json',

              },
            }
          );


        const associationText =
          await associationResponse.text();


        let associationData = {};


        try {

          associationData =
            associationText
              ? JSON.parse(
                  associationText
                )
              : {};

        } catch (error) {

          console.error(
            'Customer unread association JSON error:',
            associationText
          );


          return 0;

        }


        console.log(
          `Customer Unread association page ${pageNumber} HTTP status:`,
          associationResponse.status
        );


        console.log(
          `Customer Unread association page ${pageNumber} count:`,
          associationData.results?.length ||
            0
        );


        if (
          !associationResponse.ok
        ) {

          console.error(
            'Customer unread association failed:',
            associationData
          );


          return 0;

        }


        const pageIds =
          (
            associationData.results ||
            []
          )
            .map(
              item =>
                String(
                  item.id
                )
            )
            .filter(
              Boolean
            );


        allTicketIds.push(
          ...pageIds
        );


        console.log(
          'Customer unread ticket IDs collected:',
          allTicketIds.length
        );


        after =
          associationData
            ?.paging
            ?.next
            ?.after ||
          null;


        pageNumber +=
          1;


      } while (after);



      // =====================================================
      // REMOVE DUPLICATE IDS
      // =====================================================

      const ticketIds = [
        ...new Set(
          allTicketIds
        ),
      ];


      console.log(
        'FINAL CUSTOMER UNREAD UNIQUE TICKET IDS:',
        ticketIds.length
      );


      if (
        !ticketIds.length
      ) {

        return 0;

      }



      // =====================================================
      // STEP 2
      // BATCH READ TICKET DETAILS
      //
      // Need only:
      // customer_portal
      // customer_unread_count
      // =====================================================

      const BATCH_SIZE =
        100;


      const chunks =
        [];


      for (
        let i = 0;
        i < ticketIds.length;
        i += BATCH_SIZE
      ) {

        chunks.push(
          ticketIds.slice(
            i,
            i + BATCH_SIZE
          )
        );

      }


      console.log(
        'Customer unread total batches:',
        chunks.length
      );


      let allTickets =
        [];


      for (
        let batchIndex = 0;
        batchIndex < chunks.length;
        batchIndex++
      ) {

        const chunk =
          chunks[
            batchIndex
          ];


        console.log(
          `Fetching Customer Unread batch ${batchIndex + 1}/${chunks.length}`
        );


        const batchResponse =
          await fetch(
            'https://api.hubapi.com/crm/v3/objects/tickets/batch/read',
            {
              method:
                'POST',

              headers: {

                Authorization:
                  `Bearer ${HUBSPOT_API_KEY}`,

                'Content-Type':
                  'application/json',

              },


              body:
                JSON.stringify({

                  properties: [

                    'customer_portal',

                    'customer_unread_count',

                  ],


                  inputs:
                    chunk.map(
                      ticketId => ({

                        id:
                          String(
                            ticketId
                          ),

                      })
                    ),

                }),

            }
          );


        const batchText =
          await batchResponse.text();


        let batchData =
          {};


        try {

          batchData =
            batchText
              ? JSON.parse(
                  batchText
                )
              : {};

        } catch (error) {

          console.error(
            `Customer unread batch ${batchIndex + 1} JSON error:`,
            batchText
          );


          return 0;

        }


        console.log(
          `Customer unread batch ${batchIndex + 1} HTTP status:`,
          batchResponse.status
        );


        console.log(
          `Customer unread batch ${batchIndex + 1} returned:`,
          batchData.results?.length ||
            0
        );


        if (
          !batchResponse.ok
        ) {

          console.error(
            `Customer unread batch ${batchIndex + 1} failed:`,
            batchData
          );


          return 0;

        }


        allTickets.push(
          ...(
            batchData.results ||
            []
          )
        );


        console.log(
          'Customer unread ticket details collected:',
          allTickets.length
        );


        /*
         * Small delay between batches
         * to reduce HubSpot rate-limit pressure.
         */

        if (
          batchIndex <
          chunks.length - 1
        ) {

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                150
              )
          );

        }

      }



      // =====================================================
      // STEP 3
      // CUSTOMER PORTAL TRUE ONLY
      // =====================================================

      const customerTickets =
        allTickets.filter(
          ticket => {

            const rawCustomerPortal =
              ticket
                ?.properties
                ?.customer_portal;


            const normalized =
              String(
                rawCustomerPortal ??
                  ''
              )
                .trim()
                .toLowerCase();


            const isCustomerPortal =
              rawCustomerPortal ===
                true ||

              normalized ===
                'true' ||

              normalized ===
                'yes' ||

              normalized ===
                '1';


            return (
              isCustomerPortal
            );

          }
        );


      console.log(
        'Customer Portal TRUE tickets:',
        customerTickets.length
      );



      // =====================================================
      // STEP 4
      // TOTAL CUSTOMER UNREAD COUNT
      // =====================================================

      const totalUnreadCount =
        customerTickets.reduce(
          (
            total,
            ticket
          ) => {

            const count =
              Number(
                ticket
                  ?.properties
                  ?.customer_unread_count ||
                  0
              );


            return (
              total +
              (
                Number.isFinite(
                  count
                )
                  ? count
                  : 0
              )
            );

          },
          0
        );


      console.log(
        '===================================='
      );


      console.log(
        `TOTAL CUSTOMER UNREAD FOR CONTACT ${contactId}:`,
        totalUnreadCount
      );


      console.log(
        '===================================='
      );


      return (
        totalUnreadCount
      );


    } catch (error) {

      console.error(
        'getCustomerTotalUnreadCount error:',
        {
          message:
            error?.message,

          stack:
            error?.stack,
        }
      );


      return 0;

    }

  };




  /*
 * =====================================================
 * SUPPORT TEAM TOTAL UNREAD COUNT
 * =====================================================
 */
const getCustomerSupportTotalUnreadCount =
  async (
    ownerId,
    fetch,
  ) => {

    try {

      let allTickets = [];
      let after = null;


      do {

        const response =
          await fetch(
            'https://api.hubapi.com/crm/v3/objects/tickets/search',
            {
              method:
                'POST',

              headers: {
                Authorization:
                  `Bearer ${HUBSPOT_API_KEY}`,

                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  filterGroups: [
                    {
                      filters: [
                        {
                          propertyName:
                            'hubspot_owner_id',

                          operator:
                            'EQ',

                          value:
                            String(
                              ownerId,
                            ),
                        },
                      ],
                    },
                  ],

                  properties: [
                    'customer_portal',
                    'support_unread_count',
                  ],

                  limit:
                    100,

                  ...(after
                    ? {
                        after,
                      }
                    : {}),
                }),
            },
          );


        const data =
          await response.json();


        if (!response.ok) {

          console.error(
            'Customer Support unread ticket search failed:',
            data,
          );

          return 0;
        }


        allTickets = [
          ...allTickets,
          ...(data.results || []),
        ];


        after =
          data?.paging
            ?.next
            ?.after ||
          null;


      } while (after);


      const totalUnread =
        allTickets.reduce(
          (
            total,
            ticket,
          ) => {

            const rawPortal =
              String(
                ticket.properties
                  ?.customer_portal ||
                '',
              )
                .trim()
                .toLowerCase();


            const isCustomerPortal =
              rawPortal === 'true' ||
              rawPortal === 'yes' ||
              rawPortal === '1';


          
            if (!isCustomerPortal) {
              return total;
            }


            const unread =
              Number(
                ticket.properties
                  ?.support_unread_count ||
                0,
              );


            return (
              total +
              (
                Number.isFinite(
                  unread,
                )
                  ? unread
                  : 0
              )
            );
          },
          0,
        );


      console.log(
        `Customer Support Owner ${ownerId} total unread:`,
        totalUnread,
      );


      return totalUnread;


    } catch (error) {

      console.error(
        'getCustomerSupportTotalUnreadCount error:',
        error,
      );

      return 0;
    }
  };




  app.post(
  '/mark-customer-ticket-read',
  async (req, res) => {

    const {
      ticketId,
      contactId,
      appSupportTeamMember,
    } = req.body;

    const isSupportTeamMember =
      String(
        appSupportTeamMember || '',
      )
        .trim()
        .toLowerCase() === 'yes';

    console.log(
      'Mark customer ticket read:',
      {
        ticketId,
        contactId,
        role:
          isSupportTeamMember
            ? 'support'
            : 'customer',
      },
    );


    if (!ticketId || !contactId) {

      return res.status(400).json({
        success: false,
        message:
          'ticketId and contactId are required',
      });
    }


    try {

      const fetch =
        (...args) =>
          import(
            'node-fetch'
          ).then(
            ({
              default: fetch,
            }) =>
              fetch(...args),
          );


      /*
       * ==========================================
       * STEP 1
       * Current ticket unread = 0
       * ==========================================
       */
      const updateResponse =
        await fetch(
          `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}`,
          {
            method:
              'PATCH',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                properties: {
                  ...(isSupportTeamMember
                    ? {
                        support_unread_count: '0',
                      }
                    : {
                        customer_unread_count: '0',
                      }),
                },
              }),
          },
        );


      const updateData =
        await updateResponse.json();


      if (!updateResponse.ok) {

        console.error(
          'Customer ticket mark read failed:',
          updateData,
        );

        return res.status(500).json({
          success: false,
          message:
            'Unable to mark ticket as read',
        });
      }


      console.log(
        `Customer ticket ${ticketId} unread reset to 0`,
      );


      /*
       * ==========================================
       * STEP 2
       * Remaining total unread calculate
       * ==========================================
       */
      let totalUnreadCount = 0;


/*
 * ==========================================
 * SUPPORT TEAM MEMBER
 * ==========================================
 */
if (isSupportTeamMember) {

  /*
   * Contact ID support member
   */
  const supportContactResponse =
    await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=email`,
      {
        method: 'GET',

        headers: {
          Authorization:
            `Bearer ${HUBSPOT_API_KEY}`,

          'Content-Type':
            'application/json',
        },
      },
    );


  const supportContactData =
    await supportContactResponse.json();


  const supportEmail =
    String(
      supportContactData
        ?.properties
        ?.email ||
      '',
    )
      .trim()
      .toLowerCase();


  console.log(
    'Support read reset email:',
    supportEmail,
  );


 
  let supportOwnerId = '';


  if (supportEmail) {

    const ownersResponse =
      await fetch(
        'https://api.hubapi.com/crm/v3/owners?archived=false',
        {
          method: 'GET',

          headers: {
            Authorization:
              `Bearer ${HUBSPOT_API_KEY}`,

            'Content-Type':
              'application/json',
          },
        },
      );


    const ownersData =
      await ownersResponse.json();


    const matchedOwner =
      (
        ownersData.results || []
      ).find(
        owner =>
          String(
            owner.email || '',
          )
            .trim()
            .toLowerCase() ===
          supportEmail,
      );


    supportOwnerId =
      String(
        matchedOwner?.id ||
        '',
      );


    console.log(
      'Support read reset Owner ID:',
      supportOwnerId ||
      'Not found',
    );
  }


  if (supportOwnerId) {

    totalUnreadCount =
      await getCustomerSupportTotalUnreadCount(
        supportOwnerId,
        fetch,
      );

  } else {

    console.log(
      'Support Owner ID not found while calculating badge',
    );

    totalUnreadCount = 0;
  }

}


/*
 * ==========================================
 * NORMAL CUSTOMER
 * ==========================================
 */
else {

  totalUnreadCount =
    await getCustomerTotalUnreadCount(
      String(contactId),
      fetch,
    );
}


console.log(
  'Mark read total unread count:',
  {
    role:
      isSupportTeamMember
        ? 'support'
        : 'customer',

    totalUnreadCount,
  },
);


      /*
       * ==========================================
       * RESULT
       * ==========================================
       */
      return res.status(200).json({

        success:
          true,

        ticketId:
          String(ticketId),

        ticketUnreadCount:
          0,

        totalUnreadCount:
          Number(
            totalUnreadCount || 0,
          ),
      });


    } catch (error) {

      console.error(
        'Mark customer ticket read error:',
        error,
      );


      return res.status(500).json({
        success: false,
        message:
          'Internal server error',
      });
    }
  },
);



app.post(
  '/hubspot-webhook',
  async (req, res) => {

  
    res.sendStatus(200);

    try {

      console.log(
        '========== CUSTOMER HUBSPOT WEBHOOK RECEIVED ==========',
      );

      console.log(
        'Webhook body:',
        JSON.stringify(
          req.body,
          null,
          2,
        ),
      );


      const events =
        Array.isArray(req.body)
          ? req.body
          : [];


      if (!events.length) {

        console.log(
          'Customer webhook body empty',
        );

        return;
      }


    
      const event =
        events[0];


      const threadId =
        event.objectId;

      const webhookMessageId =
        event.messageId;


      console.log(
        'Customer Thread ID:',
        threadId,
      );

      console.log(
        'Customer Webhook Message ID:',
        webhookMessageId,
      );

      console.log(
        'Customer Subscription Type:',
        event.subscriptionType,
      );


      if (
        !threadId ||
        !webhookMessageId
      ) {

        console.log(
          'Customer webhook threadId/messageId missing',
        );

        return;
      }


      const fetch =
        (...args) =>
          import(
            'node-fetch'
          ).then(
            ({
              default: fetch,
            }) =>
              fetch(...args),
          );


      /*
       * =====================================================
       * STEP 1
       * =====================================================
       */
      const messagesResponse =
        await fetch(
          `https://api.hubapi.com/conversations/v3/conversations/threads/${threadId}/messages`,
          {
            method:
              'GET',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },
          },
        );


      const messagesData =
        await messagesResponse.json();


      console.log(
        'Customer messages status:',
        messagesResponse.status,
      );


      if (
        !messagesResponse.ok
      ) {

        console.error(
          'Customer HubSpot messages error:',
          messagesData,
        );

        return;
      }


      const latestMessage =
        (
          messagesData.results ||
          []
        ).find(
          message =>
            message.type ===
              'MESSAGE' &&
            String(
              message.id,
            ) ===
              String(
                webhookMessageId,
              ),
        );


      if (!latestMessage) {

        console.log(
          'Customer exact webhook message not found',
        );

        return;
      }


      console.log(
        'Customer message direction:',
        latestMessage.direction,
      );

      console.log(
        'Customer message text:',
        latestMessage.text,
      );


      /*
       * CUSTOMER APP RULE:
       *
       * Customer ko notification sirf
       * Support / HubSpot se reply aane par.
       *
       * OUTGOING = HubSpot/Support -> Customer
       *
       * INCOMING = Customer -> HubSpot
       *
       * Incoming ko customer ko wapas notify
       * nahi karna.
       */
      if (
        latestMessage.direction !== 'OUTGOING' &&
        latestMessage.direction !== 'INCOMING'
      ) {

        console.log(
          `Webhook skipped: unsupported direction ${latestMessage.direction}`,
        );

        return;
      }


      /*
       * =====================================================
       * STEP 2
       * Thread se associated Ticket find karo.
       * =====================================================
       */
      const ticketSearchResponse =
        await fetch(
          'https://api.hubapi.com/crm/v3/objects/tickets/search',
          {
            method:
              'POST',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                filterGroups: [
                  {
                    filters: [
                      {
                        propertyName:
                          'hs_conversations_originating_thread_id',

                        operator:
                          'EQ',

                        value:
                          String(
                            threadId,
                          ),
                      },
                    ],
                  },
                ],

                properties: [
                  'subject',
                  'customer_portal',
                  'hs_conversations_originating_thread_id',
                  'customer_unread_count',
                  'support_unread_count',
                  'hubspot_owner_id',
                ],

                limit:
                  1,
              }),
          },
        );


      const ticketSearchData =
        await ticketSearchResponse.json();


      console.log(
        'Customer ticket search status:',
        ticketSearchResponse.status,
      );


      if (
        !ticketSearchResponse.ok
      ) {

        console.error(
          'Customer ticket search error:',
          ticketSearchData,
        );

        return;
      }


      if (
        !ticketSearchData
          .results
          ?.length
      ) {

        console.log(
          'Customer ticket not found for thread:',
          threadId,
        );

        return;
      }


      const matchedTicket =
        ticketSearchData
          .results[0];


      const ticketId =
        String(
          matchedTicket.id,
        );


      const ticketSubject =
        matchedTicket
          .properties
          ?.subject ||
        'Ticket Update';

      const ticketOwnerId =
        String(
          matchedTicket
            .properties
            ?.hubspot_owner_id ||
          '',
        );

      console.log(
        'Customer Ticket Owner ID:',
        ticketOwnerId || 'Not assigned',
      );


      const rawCustomerPortal =
        matchedTicket
          .properties
          ?.customer_portal;


      const normalizedCustomerPortal =
        String(
          rawCustomerPortal ??
          '',
        )
          .trim()
          .toLowerCase();


      const isCustomerPortalTicket =
        rawCustomerPortal ===
          true ||
        normalizedCustomerPortal ===
          'true' ||
        normalizedCustomerPortal ===
          'yes' ||
        normalizedCustomerPortal ===
          '1';


      console.log(
        'Customer Matched Ticket ID:',
        ticketId,
      );

      console.log(
        'Customer Ticket Subject:',
        ticketSubject,
      );

      console.log(
        'customer_portal raw:',
        rawCustomerPortal,
      );

      console.log(
        'Is Customer Portal Ticket:',
        isCustomerPortalTicket,
      );


      /*
       * Sirf customer_portal=True tickets
       * Customer app me notification bhejenge.
       */
      if (
        !isCustomerPortalTicket
      ) {

        console.log(
          'Customer push skipped: customer_portal is not true',
        );

        return;
      }



      /*
 * =====================================================
 * INCOMING MESSAGE
 * CUSTOMER -> SUPPORT TEAM MEMBER
 * =====================================================
 */
if (
  latestMessage.direction ===
  'INCOMING'
) {

  console.log(
    '========== CUSTOMER -> SUPPORT NOTIFICATION ==========',
  );


  /*
   * =====================================================
   * STEP 1
   * Ticket Owner required.
   * =====================================================
   */
  if (!ticketOwnerId) {

    console.log(
      'Support push skipped: Ticket owner ID missing',
    );

    return;
  }


  /*
   * =====================================================
   * STEP 2
   * HubSpot Owner ID -> Owner Email
   * =====================================================
   */
  let ticketOwnerEmail = '';

  try {

    const ownerResponse =
      await fetch(
        `https://api.hubapi.com/crm/v3/owners/${ticketOwnerId}`,
        {
          method: 'GET',

          headers: {
            Authorization:
              `Bearer ${HUBSPOT_API_KEY}`,

            'Content-Type':
              'application/json',
          },
        },
      );


    const ownerData =
      await ownerResponse.json();


    if (!ownerResponse.ok) {

      console.error(
        'Customer Support owner fetch failed:',
        ownerData,
      );

      return;
    }


    ticketOwnerEmail =
      String(
        ownerData.email ||
        '',
      )
        .trim()
        .toLowerCase();


    console.log(
      'Customer Support Ticket Owner Email:',
      ticketOwnerEmail ||
      'Not available',
    );


  } catch (error) {

    console.error(
      'Customer Support owner fetch error:',
      error,
    );

    return;
  }


  if (!ticketOwnerEmail) {

    console.log(
      'Support push skipped: Ticket owner email missing',
    );

    return;
  }


  /*
   * =====================================================
   * STEP 3
   * Ticket Owner ka HubSpot Contact find.
   *
   * Required:
   * app_support_team_member = Yes
   * customer_fcm_token exists
   * =====================================================
   */
  const ownerContactSearchResponse =
    await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${HUBSPOT_API_KEY}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName:
                      'email',

                    operator:
                      'EQ',

                    value:
                      ticketOwnerEmail,
                  },
                ],
              },
            ],

            properties: [
              'email',
              'firstname',
              'lastname',
              'app_support_team_member',
              'customer_fcm_token',
            ],

            limit:
              1,
          }),
      },
    );


  const ownerContactSearchData =
    await ownerContactSearchResponse.json();


  if (
    !ownerContactSearchResponse.ok
  ) {

    console.error(
      'Customer Support owner contact search failed:',
      ownerContactSearchData,
    );

    return;
  }


  const ownerContact =
    ownerContactSearchData
      .results?.[0];


  if (!ownerContact) {

    console.log(
      `Support push skipped: Contact not found for owner ${ticketOwnerEmail}`,
    );

    return;
  }


  /*
   * =====================================================
   * STEP 4
   * Support member verification.
   * =====================================================
   */
  const supportValue =
    String(
      ownerContact
        .properties
        ?.app_support_team_member ||
      '',
    )
      .trim()
      .toLowerCase();


  const supportToken =
    ownerContact
      .properties
      ?.customer_fcm_token;


  console.log(
    'Ticket Owner app_support_team_member:',
    supportValue || 'empty',
  );


  console.log(
    'Ticket Owner has customer FCM token:',
    Boolean(
      supportToken,
    ),
  );


  if (
    supportValue !==
    'yes'
  ) {

    console.log(
      `Support push skipped: Ticket owner ${ticketOwnerEmail} is not app support team member`,
    );

    return;
  }


  if (!supportToken) {

    console.log(
      `Support push skipped: Ticket owner ${ticketOwnerEmail} has no customer_fcm_token`,
    );

    return;
  }


  /*
   * =====================================================
   * STEP 5
   * Current ticket support unread +1
   * =====================================================
   */
  const currentSupportUnread =
    Number(
      matchedTicket
        .properties
        ?.support_unread_count ||
      0,
    );


  const newSupportUnread =
    currentSupportUnread + 1;


  console.log(
    `Customer Support Ticket ${ticketId} unread:`,
    `${currentSupportUnread} -> ${newSupportUnread}`,
  );


  const supportUnreadUpdateResponse =
    await fetch(
      `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}`,
      {
        method:
          'PATCH',

        headers: {
          Authorization:
            `Bearer ${HUBSPOT_API_KEY}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            properties: {
              support_unread_count:
                String(
                  newSupportUnread,
                ),
            },
          }),
      },
    );


  const supportUnreadUpdateText =
    await supportUnreadUpdateResponse.text();


  if (
    !supportUnreadUpdateResponse.ok
  ) {

    console.error(
      'Customer Support unread update failed:',
      supportUnreadUpdateText,
    );

    return;
  }


  console.log(
    'Customer Support unread count updated successfully:',
    newSupportUnread,
  );


  /*
   * =====================================================
   * STEP 6
   * Customer sender name.
   * =====================================================
   */
  const senderEmail =
    latestMessage
      .senders?.[0]
      ?.deliveryIdentifier
      ?.value
      ?.trim()
      ?.toLowerCase() ||
    '';


  let senderName =
    latestMessage
      .senders?.[0]
      ?.name ||
    senderEmail ||
    'Customer';


  /*
   * Sender contact mile to proper
   * First Name + Last Name use karo.
   */
  if (senderEmail) {

    try {

      const senderContactResponse =
        await fetch(
          'https://api.hubapi.com/crm/v3/objects/contacts/search',
          {
            method:
              'POST',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                filterGroups: [
                  {
                    filters: [
                      {
                        propertyName:
                          'email',

                        operator:
                          'EQ',

                        value:
                          senderEmail,
                      },
                    ],
                  },
                ],

                properties: [
                  'firstname',
                  'lastname',
                  'email',
                ],

                limit:
                  1,
              }),
          },
        );


      const senderContactData =
        await senderContactResponse.json();


      const senderContact =
        senderContactData
          ?.results?.[0];


      if (senderContact) {

        const fullName = [
          senderContact
            .properties
            ?.firstname,

          senderContact
            .properties
            ?.lastname,
        ]
          .filter(Boolean)
          .join(' ')
          .trim();


        if (fullName) {
          senderName =
            fullName;
        }
      }

    } catch (error) {

      console.log(
        'Customer sender contact lookup error:',
        error,
      );
    }
  }


  console.log(
    'Customer message sender:',
    {
      email:
        senderEmail,

      name:
        senderName,
    },
  );


  /*
   * =====================================================
   * STEP 7
   * Support member total unread badge.
   * =====================================================
   */
  const totalSupportUnread =
    await getCustomerSupportTotalUnreadCount(
      ticketOwnerId,
      fetch,
    );


  console.log(
    `Customer Support push badge for ${ticketOwnerEmail}:`,
    totalSupportUnread,
  );


  /*
   * =====================================================
   * STEP 8
   * Push content.
   * =====================================================
   */
  const supportNotificationTitle =
    `New message from ${senderName}`;


  const supportNotificationBody =
    latestMessage
      .text
      ?.trim() ||
    `You received a new customer reply on ${ticketSubject}.`;


  /*
   * =====================================================
   * STEP 9
   * Firebase push to SUPPORT MEMBER.
   * =====================================================
   */
  try {

    const pushResponse =
      await getMessaging()
        .send({

          token:
            supportToken,


          notification: {

            title:
              supportNotificationTitle,

            body:
              supportNotificationBody
                .slice(
                  0,
                  200,
                ),
          },


          data: {

            ticketId:
              String(
                ticketId,
              ),

            threadId:
              String(
                threadId,
              ),

            messageId:
              String(
                latestMessage.id,
              ),

            ticketSubject:
              String(
                ticketSubject,
              ),

            senderEmail:
              String(
                senderEmail,
              ),

            senderRole:
              'customer',

            direction:
              'INCOMING',

            targetScreen:
              'ViewTicketDetail',

            type:
              'customer_message',

            /*
             * Specific ticket unread.
             */
            ticketUnreadCount:
              String(
                newSupportUnread,
              ),

            /*
             * Support member total
             * app icon unread.
             */
            totalUnreadCount:
              String(
                totalSupportUnread,
              ),
          },


          apns: {

            headers: {
              'apns-priority':
                '10',
            },

            payload: {

              aps: {

                alert: {

                  title:
                    supportNotificationTitle,

                  body:
                    supportNotificationBody
                      .slice(
                        0,
                        200,
                      ),
                },

                sound:
                  'default',

                badge:
                  totalSupportUnread,
              },
            },
          },
        });


    console.log(
      'Customer Support Push success:',
      pushResponse,
    );


    console.log(
      '========== CUSTOMER SUPPORT PUSH SUMMARY ==========',
    );

    console.log(
      'Support Recipient:',
      ticketOwnerEmail,
    );

    console.log(
      'Support Ticket Unread:',
      newSupportUnread,
    );

    console.log(
      'Support Total Unread:',
      totalSupportUnread,
    );


  } catch (pushError) {

    console.error(
      'Customer Support Push failed:',
      {
        code:
          pushError?.code,

        message:
          pushError?.message,
      },
    );
  }


  /*
   * VERY IMPORTANT:
   *
   * INCOMING support flow complete.
   * Neeche existing OUTGOING -> Customer
   * code run nahi hona chahiye.
   */
  return;
}




      /*
 * =====================================================
 * CUSTOMER UNREAD COUNT
 * =====================================================
 *
 * Support ka OUTGOING message aane par
 * current ticket ka unread count +1.
 */


      if (
  latestMessage.direction !==
  'OUTGOING'
) {

  console.log(
    `Existing Customer push skipped for direction ${latestMessage.direction}`,
  );

  return;
}



const currentCustomerUnread =
  Number(
    matchedTicket
      .properties
      ?.customer_unread_count ||
    0,
  );


const newCustomerUnread =
  currentCustomerUnread + 1;


console.log(
  `Customer Ticket ${ticketId} unread:`,
  `${currentCustomerUnread} -> ${newCustomerUnread}`,
);


/*
 * HubSpot ticket property update.
 */
const unreadUpdateResponse =
  await fetch(
    `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}`,
    {
      method:
        'PATCH',

      headers: {
        Authorization:
          `Bearer ${HUBSPOT_API_KEY}`,

        'Content-Type':
          'application/json',
      },

      body:
        JSON.stringify({
          properties: {
            customer_unread_count:
              String(
                newCustomerUnread,
              ),
          },
        }),
    },
  );


const unreadUpdateData =
  await unreadUpdateResponse.json();


if (
  !unreadUpdateResponse.ok
) {

  console.error(
    'Customer unread count update failed:',
    unreadUpdateData,
  );

} else {

  console.log(
    'Customer unread count updated successfully:',
    newCustomerUnread,
  );
} 



      /*
       * =====================================================
       * STEP 3
       * Ticket ke associated Contacts find karo.
       * =====================================================
       */
      const contactsResponse =
        await fetch(
          `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}/associations/contacts`,
          {
            method:
              'GET',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },
          },
        );


      const contactsData =
        await contactsResponse.json();


      console.log(
        'Customer ticket contacts status:',
        contactsResponse.status,
      );


      if (
        !contactsResponse.ok
      ) {

        console.error(
          'Customer ticket contacts error:',
          contactsData,
        );

        return;
      }


      const associatedContactIds =
        (
          contactsData.results ||
          []
        )
          .map(
            item =>
              String(
                item.id,
              ),
          )
          .filter(
            Boolean,
          );


      console.log(
        'Customer Associated Contact IDs:',
        associatedContactIds,
      );


      if (
        !associatedContactIds.length
      ) {

        console.log(
          'Customer push skipped: no associated contact',
        );

        return;
      }


      /*
       * =====================================================
       * STEP 4
       * Associated contacts ka customer_fcm_token fetch.
       * =====================================================
       */
      const contactRequests =
        associatedContactIds.map(
          async contactId => {

            const response =
              await fetch(
                `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=email,firstname,lastname,customer_fcm_token`,
                {
                  method:
                    'GET',

                  headers: {
                    Authorization:
                      `Bearer ${HUBSPOT_API_KEY}`,

                    'Content-Type':
                      'application/json',
                  },
                },
              );


            const data =
              await response.json();


            if (
              !response.ok
            ) {

              console.error(
                `Customer contact ${contactId} fetch failed:`,
                data,
              );

              return null;
            }


            return data;
          },
        );


      const associatedContacts =
        (
          await Promise.all(
            contactRequests,
          )
        ).filter(
          Boolean,
        );


      console.log(
        'Customer Associated Contacts:',
        associatedContacts.map(
          contact => ({
            contactId:
              String(
                contact.id,
              ),

            email:
              contact
                .properties
                ?.email ||
              '',

            hasCustomerToken:
              Boolean(
                contact
                  .properties
                  ?.customer_fcm_token,
              ),
          }),
        ),
      );


      /*
       * Sirf customer_fcm_token wale contacts.
       */
      const customerRecipients =
        associatedContacts
          .filter(
            contact =>
              Boolean(
                contact
                  .properties
                  ?.customer_fcm_token,
              ),
          )
          .map(
            contact => ({
              contactId:
                String(
                  contact.id,
                ),

              email:
                String(
                  contact
                    .properties
                    ?.email ||
                  '',
                )
                  .trim()
                  .toLowerCase(),

              token:
                contact
                  .properties
                  ?.customer_fcm_token,
            }),
          );


      console.log(
        'Customer notification recipients:',
        customerRecipients.map(
          recipient => ({
            contactId:
              recipient.contactId,

            email:
              recipient.email,
          }),
        ),
      );


      if (
        !customerRecipients.length
      ) {

        console.log(
          'Customer push skipped: no customer_fcm_token found',
        );

        return;
      }


      /*
       * =====================================================
       * STEP 5
       * Notification content.
       * =====================================================
       */
      const notificationTitle =
        'New reply from SYIL Support';


      const notificationBody =
        latestMessage
          .text
          ?.trim() ||
        `You have a new reply on ${ticketSubject}.`;


      /*
       * =====================================================
       * STEP 6
       * Firebase Push.
       * =====================================================
       */
      const pushResults =
        await Promise.allSettled(

          customerRecipients.map(
            async recipient => {


              const totalUnreadCount =
                await getCustomerTotalUnreadCount(
                  recipient.contactId,
                  fetch,
                );

              console.log(
                `Customer push badge for ${recipient.email}:`,
                totalUnreadCount,
              );
              

              return getMessaging()
                .send({

                  token:
                    recipient.token,


                  notification: {

                    title:
                      notificationTitle,

                    body:
                      notificationBody.slice(
                        0,
                        200,
                      ),
                  },


                  /*
                   * IMPORTANT:
                   *
                   * notification tap ke baad
                   * ViewTicketDetail ko ye data milega.
                   *
                   * FCM data values strings honi chahiye.
                   */
                  data: {

                    ticketId:
                      String(
                        ticketId,
                      ),

                    threadId:
                      String(
                        threadId,
                      ),

                    messageId:
                      String(
                        latestMessage.id,
                      ),

                    ticketSubject:
                      String(
                        ticketSubject,
                      ),

                    targetScreen:
                      'ViewTicketDetail',

                    type:
                      'support_reply',

                    ticketUnreadCount:
                      String(
                        newCustomerUnread,
                      ),

                    totalUnreadCount:
                      String(
                        totalUnreadCount,
                      ),

                    },
                  


                  /*
                   * iOS APNs.
                   */
                  apns: {

                    headers: {
                      'apns-priority':
                        '10',
                    },

                    payload: {

                      aps: {

                        alert: {

                          title:
                            notificationTitle,

                          body:
                            notificationBody.slice(
                              0,
                              200,
                            ),
                        },

                        sound:
                          'default',

                        badge:
                          totalUnreadCount,
                      },
                    },
                  },
                });
            },
          ),
        );


      /*
       * Result logs.
       */
      pushResults.forEach(
        (
          result,
          index,
        ) => {

          if (
            result.status ===
            'fulfilled'
          ) {

            console.log(
              `Customer Push ${index + 1} success:`,
              result.value,
            );

          } else {

            console.error(
              `Customer Push ${index + 1} failed:`,
              {
                code:
                  result.reason
                    ?.code,

                message:
                  result.reason
                    ?.message,
              },
            );
          }
        },
      );


      const successCount =
        pushResults.filter(
          result =>
            result.status ===
            'fulfilled',
        ).length;


      const failureCount =
        pushResults.length -
        successCount;


      console.log(
        '========== CUSTOMER PUSH SUMMARY ==========',
      );

      console.log(
        'Successful:',
        successCount,
      );

      console.log(
        'Failed:',
        failureCount,
      );


    } catch (error) {

      console.error(
        'Customer HubSpot webhook processing error:',
        {
          code:
            error?.code,

          message:
            error?.message,

          stack:
            error?.stack,
        },
      );
    }
  },
);




app.listen(PORT,'0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));


app.listen(PORT, () => console.log(`Server running on ${PORT}`));
// app.listen(PORT,'0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));