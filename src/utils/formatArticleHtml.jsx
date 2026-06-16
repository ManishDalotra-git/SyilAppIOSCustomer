export const formatArticleHtml = (body) => {
  if (!body) return '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
            padding: 12px;
            margin: 0;
            color: #333;
            line-height: 1.6;
          }
          
          table {
            width: 100% !important;
            max-width: 100% !important;
          }

          th, td {
            border: 1px solid #ff0000;
            padding: 8px;
            font-size: 14px;
            text-align: left;
          }

          a {
            color: #007bff;
            word-break: break-word;
          }

          img {
            max-width: 100%;
            height: auto;
            cursor: pointer;
          }

          p {
            margin-bottom: 12px;
          }
        </style>
      </head>
      <body>
        ${body.replace(/&nbsp;/g, '')}
      </body>
    </html>
  `;
};
