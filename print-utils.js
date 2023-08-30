// Bu dosyada printContent kodu yer alacak
function generatePrintContent(data, selectedPrinterName) {
  let customContent = "";
  let totalPrice = 0;
  let orderNote = "";
  data.orderTransactions.forEach((item) => {
    totalPrice += Number(item.totalPrice);
    customContent += `  <tr>
        <td>${item.foodName}</td>
      <td> x ${Number(item.foodAmount).toFixed(0)}</td>
        <td align="right">${Number(item.totalPrice).toFixed(2)}</td>
      </tr>`;
    if (item.note) {
      customContent += `<tr><td style="padding-left: 10px;font-size: 10px" colspan="3" align="left">-${item.note}</td></tr>`;
    }

    if (data.orderNote) {
      orderNote =
        " <h5 align='left'>Sipariş Notu: " + data.orderNote + "</h5>";
    }
  });
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Restoran Sipariş Ekranı</title>
      <style>
        @media print {
          @page {
            size: 80mm 297mm; /* 80mm termal yazıcı genişliği */
            margin: 0;
          }
    
          body {
            margin: 0;
            padding: 2mm; 
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
          }
    
          .header {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px; 
          }
        }
      </style>
    </head>
    <body>
    <center>
<img src="./logo.jpg" width="200" align="center"/>
            <h2 align="center">${data.title}</h2>
            </center>
      <table>
      <tr>
        <td>Masa</td>
        <td>:&nbsp;&nbsp;${data.deskName}</td>
      </tr>
      <tr>
      <td>Sipariş No</td>
      <td>:&nbsp;&nbsp;${data.order.id}</td>
    </tr>
    <tr>
      <td>Yazıcı</td>
      <td>:&nbsp;&nbsp;${selectedPrinterName}</td>
    </tr>
      <tr>
        <td>Tarih</td>
        <td>:&nbsp;&nbsp;${
          new Date().toLocaleDateString() +
          " " +
          new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        }</td>
      </tr>
      </table>
      <div style="height: 1px;width: 100%;border-top: 1px solid black; margin-top: 20px;">

    <table width="100%" cellpadding=0 cellspacing=0 style="margin-top: 20px">
          ${customContent}
        </table>
      <div style="height: 1px;width: 100%;border-top: 1px solid black; margin-top: 20px;">
      <br/>
      <br/>
        <h3 align='center'>Toplam ${parseFloat(totalPrice).toFixed(2)}</h3>
        <br/>
        ${orderNote}
        <br/>
      </div>
  `;
  return printContent;
}

module.exports = { generatePrintContent };
