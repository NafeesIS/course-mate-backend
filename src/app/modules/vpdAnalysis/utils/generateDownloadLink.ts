/* eslint-disable @typescript-eslint/no-explicit-any */
import CryptoJS from 'crypto-js';
// const CryptoJS = require('crypto-js');

// Encryption settings
const password = 'd6163f0659cfe4196dc03c2c29aab06f10cb0a79cdfc74a45da2d72358712e80';
const salt = CryptoJS.MD5('fc74a45dsalt');
const iv = CryptoJS.MD5('c29aab06iv');
const keySize = 128;
const iterations = 100;
function encrypt(plaintext: string): string {
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: keySize / 32,
    iterations: iterations,
  });
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encodeURIComponent(encrypted.toString());
}

export function decrypt(encrypted: string): string {
  try {
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: keySize / 32,
      iterations: iterations,
    });
    const decodedEncrypted = decodeURIComponent(encrypted);
    console.log('Decoded Encrypted:', decodedEncrypted); // Log the decoded encrypted string

    const decrypted = CryptoJS.AES.decrypt(decodedEncrypted, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    // console.log('Decrypted Text:', decryptedText); // Log the decrypted text

    console.log(decrypted.toString(CryptoJS.enc.Utf8));
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error('Malformed UTF-8 data');
  }
}

export function generateDownloadLink(data: any) {
  // const encryptedDocumentCode = encrypt(data.documentCode.toString());
  const docId = data.documentCode;

  //first round combining file name and form name
  const oneDocNameData = data.fileName.replace(/[^a-zA-Z0-9 ]/g, '');
  const oneDocs = oneDocNameData.replace(/\//g, '-');
  const oneDocuments = oneDocs.replace(';', '');
  let oneDcName = ' ';
  if (oneDocuments.length >= 100) {
    oneDcName = oneDocuments.substring(0, 99) + '...';
  } else {
    oneDcName = oneDocuments;
  }

  const formName = data.formId;
  const combinedDocName = formName + '_' + oneDcName;

  //final round combining combined file name and form name without special character

  const docNameData = combinedDocName.replace(/[^a-zA-Z0-9 ]/g, '');
  const docs = docNameData.replace(/\//g, '-');
  const documents = docs.replace(';', '');
  let docName = ' ';
  if (documents.length >= 100) {
    docName = documents.substring(0, 99) + '...';
  } else {
    docName = documents;
  }

  const dateOfFiling = data.dateOfFiling;
  const yearData = dateOfFiling.replace(/\//g, '_');

  const baseUrl = 'https://www.mca.gov.in/bin/mca/vpd/dms/dmsservice?data=';

  const queryString = 'docId=' + docId + '&docName=' + docName + '&year=' + yearData;
  const encryptQueryString = encrypt(queryString);

  return baseUrl + encryptQueryString;
}

export const generateEncryptedReqData = (data: string) => {
  // const reqData = 'LOC=' + cnNmbr + '&param2=' + years + '&param1=' + docCategory;
  const encryptedReqData = encrypt(data);
  return encryptedReqData;
};

export const decryptReqData = (data: string) => {
  const decryptedData = decrypt(data);
  return decryptedData;
};

// MCA Codes

// const prepareDownload = () => {
//   var docuDataJSON = {};
//   docuDataJSON['data'] = [];
//   var inputselected = document.querySelectorAll('input[name=vpdcheck]:checked');
//   table.$('.demo-check').each(function (i) {
//     console.log('in demo-check foreach ');
//     var oneDocumentDetail = {};
//     if ($(this).prop('checked')) {
//       var documentCode = $(this).closest('tr').find('td:eq(7)').text();
//       var docNameData = $(this).closest('tr').find('td:eq(4)').text();
//       var removespecialcharacter = docNameData.replace(/[^a-zA-Z0-9 ]/g, '');
//       var docs = removespecialcharacter.replace(/\//g, '-');
//       var documents = docs.replace(';', '');
//       var docName = '';
//       if (documents.length >= 100) {
//         docName = documents.substring(0, 99) + '...';
//       } else {
//         docName = documents;
//       }

//       var formName = $(this).closest('tr').find('td:eq(3)').text();
//       var yeardataa = $(this).closest('tr').find('td:eq(2)').text();
//       var yeardata = yeardataa.replace(/\//g, '_');
//       var year = $(this).closest('tr').find('td:eq(8)').text();
//       console.log('documentCode ', documentCode);
//       console.log('docName ', docName);
//       console.log('year ', year);
//       oneDocumentDetail['docId'] = documentCode;
//       oneDocumentDetail['docName'] = formName + '_' + docName;
//       oneDocumentDetail['year'] = yeardata;
//       docuDataJSON['data'].push(oneDocumentDetail);
//     }
//   });
//   var count = 0;
//   for (var j = 0; j < docuDataJSON.data.length - 1; j++) {
//     if (
//       docuDataJSON.data[j].docName == docuDataJSON.data[j + 1].docName &&
//       docuDataJSON.data[j].year == docuDataJSON.data[j + 1].year
//     ) {
//       count++;
//       docuDataJSON.data[j].docName = docuDataJSON.data[j].docName + ' (' + count + ')';
//     }
//   }

//   //sessionStorage.setItem("docuDataJSON", encodeURI(JSON.stringify(docuDataJSON)));
//   sessionStorage.setItem('docuDataJSON', btoa(JSON.stringify(docuDataJSON)));

//   console.log('docuDataJSON ', docuDataJSON);
// };

// function getDocumentList() {
//   var srNo = function (data, type, row, meta) {
//     console.log('-------------------------->');
//     var rowIndex = meta.row + 1;
//     return '<span>' + rowIndex + '</span>';
//   };
//   let reqData = 'LOC=' + cnNmbr + '&param2=' + years + '&param1=' + data;
//   $.ajax({
//     url: '/bin/VPDDocumentList',
//     type: 'GET',
//     data: 'data=' + encrypt(reqData),
//     success: function (json) {
//       console.log('json data is ', json.data);
//       if (json.data) {
//         var data = json.data;
//         console.log('data length', Object.keys(data).length);
//         console.log('sorted data', data);
//         count = 1;

//         for (var j = 0; j < data.length - 1; j++) {
//           for (var k = 1; k < data.length; k++) {
//             if (j != k) {
//               if (
//                 data[j].fileName == data[k].fileName &&
//                 !data[k].fileName.includes('Revised') &&
//                 (data[j].formId == 'MGT-7' ||
//                   data[j].formId == 'AOC-4' ||
//                   data[j].formId == 'AOC-4 XBRL' ||
//                   data[j].formId == 'LLP Form 11' ||
//                   data[j].formId == 'LLP Form 8')
//               ) {
//                 if (data[j].year == data[k].year) {
//                   data[k].fileName = 'Revised' + count + ' ' + data[k].fileName;
//                   ++count;
//                 }
//               }
//             }
//           }

//           count = 1;
//         }

//         var arr = [];
//         console.log(data);
//         for (j in json.data[0]) {
//           var obj = {};
//           obj['title'] = j.replace(/([A-Z])/g, ' $1').trim();
//           obj['data'] = j;
//           arr.push(obj);
//           console.log('arr', arr);
//         }
//         table = document.getElementById('docList');
//         var values = Object.values(data);
//         var count = 1;
//         $('docList tbody').empty();
//         var result = $('#docList').DataTable({
//           data: data,
//           searching: false,
//           language: {
//             lengthMenu: 'Results per page  _MENU_',
//             zeroRecords: 'Nothing found - sorry',
//             info: 'Showing _PAGE_ of _PAGES_',
//             infoEmpty: 'No records available',
//           },
//           dom: '<i><l><p>' + '<tr>' + '<i><p>',
//           bPaginate: true,
//           lengthMenu: [
//             [10, 25, 50, -1],
//             [10, 25, 50, 'All'],
//           ],
//           ordering: false,
//           sPaginationType: 'numbers',
//           sorting: false,
//           bLengthChange: true,
//           pageLength: 10,
//           bInfo: true,
//           bAutoWidth: false,
//           drawCallback: function (settings) {
//             $('.dataTables_paginate').prepend('Page &nbsp;');
//           },
//           columns: [
//             {
//               title: '',
//               data: '',
//               render: function (json, type, row) {
//                 console.log(row.documentCode);

//                 if (
//                   row.description === 'NULL' ||
//                   row.description === 'undefined' ||
//                   row.description === ' ' ||
//                   row.description === 'null'
//                 ) {
//                   row.description = ' ';
//                 }
//                 if (
//                   row.fileSize === 'NULL' ||
//                   row.fileSize === 'undefined' ||
//                   row.fileSize === ' ' ||
//                   row.fileSize === 'null'
//                 ) {
//                   row.fileSize = ' ';
//                 } else {
//                   row.fileSize = row.fileSize / 1000;
//                   row.fileSize = Math.round((row.fileSize + Number.EPSILON) * 100) / 100;
//                 }
//                 if (
//                   row.dateOfFiling === 'NULL' ||
//                   row.dateOfFiling === 'undefined' ||
//                   row.dateOfFiling === ' ' ||
//                   row.dateOfFiling === 'null'
//                 ) {
//                   row.dateOfFiling = ' ';
//                 }
//                 if (
//                   row.fileName === 'NULL' ||
//                   row.fileName === 'undefined' ||
//                   row.fileName === ' ' ||
//                   row.fileName === 'null'
//                 ) {
//                   row.fileName = ' ';
//                 } else {
//                   row.fileName = row.fileName.replace(';', '');
//                 }
//                 if (
//                   row.fileType === 'NULL' ||
//                   row.fileType === 'undefined' ||
//                   row.fileType === ' ' ||
//                   row.fileType === 'null'
//                 ) {
//                   row.fileType = ' ';
//                 }
//                 if (
//                   row.numberOfPages === 'NULL' ||
//                   row.numberOfPages === 'undefined' ||
//                   row.numberOfPages === ' ' ||
//                   row.numberOfPages === 'null'
//                 ) {
//                   row.numberOfPages = ' ';
//                 }
//                 if (
//                   row.formId === 'NULL' ||
//                   row.formId === 'undefined' ||
//                   row.formId === ' ' ||
//                   row.formId === 'null'
//                 ) {
//                   row.formId = ' ';
//                 }
//                 return (
//                   '<input type="checkbox" onchange = "checkboxValidation(event)" class="checkbox demo-check" name="vpdcheck-docmentlist" data-id="' +
//                   row.id +
//                   '" />'
//                 );
//               },
//             },
//             {
//               title: 'Sr. No.',
//               data: '',
//               render: srNo,
//             },
//             {
//               title: 'Date of filing',
//               data: 'dateOfFiling',
//             },
//             {
//               title: 'Form Name',
//               data: 'formId',
//             },
//             {
//               title: 'Description',
//               data: 'fileName',
//             },
//             {
//               title: 'Number of Pages',
//               data: 'numberOfPages',
//             },
//             {
//               title: 'File Size (KB)',
//               data: 'fileSize',
//             },
//             {
//               title: 'Document Code',
//               data: 'documentCode',
//               className: 'd-none',
//             },
//             {
//               title: 'Year',
//               data: 'year',
//               className: 'd-none',
//             },
//           ],
//         });
//         table = result;
//       } else {
//         const h2 = document.querySelector('#docList tr');
//         let html =
//           '<tr><td style="text-align:center" colspan="7">No document found for the current selection</td></tr>';
//         h2.insertAdjacentHTML('afterend', html);
//         $('#btn-download').attr('disabled', true);
//         $('#selectAll').attr('disabled', true);
//       }
//     },
//     failure: function (error) {
//       result = 'No document found for the current selection';
//       table = result;
//       $('#btn-download').attr('disabled', true);
//     },
//     error: function (error) {
//       result = 'No Data Found No document found for the current selection';
//       table = result;
//       $('#btn-download').attr('disabled', true);
//     },
//     dataType: 'json',
//     async: false,
//   });
// }

// // this where generating download link
// const validateCaptcha = async e => {
//   $('#showResult').empty();
//   if ($('#customCaptchaInput').val() == result) {
//     captchaValidationResult = true;
//     $('#customCaptchaInput').css('border', '1px solid black');
//   } else if ($('#customCaptchaInput').val() == '') {
//     $('#customCaptchaInput').css('border', '1px solid red');
//     $('#showResult').append('Please enter captcha.');
//     captchaValidationResult = false;
//   } else {
//     $('#customCaptchaInput').css('border', '1px solid red');
//     $('#showResult').append('The Captcha entered is incorrect. Please retry.');
//     captchaValidationResult = false;
//   }

//   if (captchaValidationResult) {
//     $('#captchaModal').modal('hide');

//     if ($('#downloadStartTime').text() === '') {
//       await updateFirstDownloadTime();
//     }

//     var docData = atob(sessionStorage.getItem('docuDataJSON'));
//     console.log('docData is ', docData);

//     if (docData !== null) {
//       try {
//         var parsedData = JSON.parse(docData);
//         if (
//           parsedData.data &&
//           Array.isArray(parsedData.data) &&
//           JSON.parse(docData).data.length > 1
//         ) {
//           $('#btn-download').attr('disabled', 'disabled');
//           $('#btn-download').html('Please wait..');
//           setTimeout(function () {
//             $('#btn-download').removeAttr('disabled');
//             $('#btn-download').html('Download');
//           }, 80000);
//           var redirectElement = document.getElementById('redirectToMultipleDocURL');
//           if (redirectElement) {
//             var redirect = redirectElement.value;
//           } else {
//             console.log('value is not valid');
//           }
//           console.log('authored URL', redirect);

//           var isDocDataValid = validateInput(docData);
//           var isSrnValid = validateInput(srn);

//           if (isDocDataValid && isSrnValid) {
//             let reqData =
//               'docData=' +
//               docData +
//               '&srn=' +
//               srn +
//               '&cnNmbr=' +
//               cnNmbr +
//               '&action=downloaddocument';
//             var redirectUrl = redirect + '?data=' + encrypt(reqData);

//             var flag = true;
//             var re = new RegExp('(/bin/)');
//             if (re.test(redirectUrl)) {
//               console.log('Valid');
//               flag = true;
//             } else {
//               console.log('Invalid');
//               flag = false;
//             }
//             if (flag == true) {
//               window.location.href = redirectUrl;
//             }
//           }
//         } else {
//           console.error('Some error occured to download the file..');
//         }
//       } catch (error) {
//         console.error('Error parsing docData: ' + error);
//       }
//     } else {
//       console.error('Doesnt have data..');
//     }
//     if (docData !== null) {
//       try {
//         var parsedData = JSON.parse(docData);
//         if (
//           parsedData.data &&
//           Array.isArray(parsedData.data) &&
//           JSON.parse(docData).data.length == 1
//         ) {
//           var oneDocData = JSON.parse(docData).data[0];
//           var docId = oneDocData.docId;
//           var docNameData = oneDocData.docName.replace(/[^a-zA-Z0-9 ]/g, '');
//           var docs = docNameData.replace(/\//g, '-');
//           var documents = docs.replace(';', '');
//           var docName = ' ';
//           if (documents.length >= 100) {
//             docName = documents.substring(0, 99) + '...';
//           } else {
//             docName = documents;
//           }

//           var year = oneDocData.year;
//           console.log('docId is ' + docId);
//           var redirectElement = document.getElementById('redirectToSingleDocURL');
//           if (redirectElement) {
//             var redirect = redirectElement.value;
//           } else {
//             console.log('value is not valid for single doc');
//           }
//           //var redirect = document.getElementById("redirectToSingleDocURL").value;
//           console.log('authored URL', redirect);

//           var isDocDataValid = validateInput(docName);
//           if (isDocDataValid) {
//             //var redirectUrl = redirect + "?docId=" + docId + "&docName=" + encrypt(docName) + "&year=" + encrypt(oneDocData.year);
//             let reqData = 'docId=' + docId + '&docName=' + docName + '&year=' + oneDocData.year;
//             var redirectUrl = redirect + '?data=' + encrypt(reqData);

//             var flag = true;
//             var re = new RegExp('(/bin/)');
//             if (re.test(redirectUrl)) {
//               console.log('Valid');
//               flag = true;
//             } else {
//               console.log('Invalid');
//               flag = false;
//             }
//             if (flag == true) {
//               window.location.href = redirectUrl;
//             }
//           }
//         } else {
//           console.log('Some error occured while downloading the file..');
//         }
//       } catch (error) {
//         console.error('Error parsing docData: ' + error);
//       }
//     } else {
//       console.log('doesnt have data..');
//     }
//   } else {
//     $('#btn-download').removeAttr('disabled');
//   }
// };
