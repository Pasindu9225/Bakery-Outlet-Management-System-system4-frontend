import ReactDOMServer from "react-dom/server";

export const printReactReport = (component, title = "Print Report") => {
  const html = ReactDOMServer.renderToStaticMarkup(component);
  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function() {
            window.print();
          };
          // Automatically close tab after print is done
          window.onafterprint = function() {
            window.close();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};
