// const CryptoJS = require('crypto-js');

// // Encryption settings
// const password = 'd6163f0659cfe4196dc03c2c29aab06f10cb0a79cdfc74a45da2d72358712e80';
// const salt = CryptoJS.MD5('fc74a45dsalt');
// const iv = CryptoJS.MD5('c29aab06iv');
// const keySize = 128;
// const iterations = 100;
// function decrypt(plaintext) {
//   const key = CryptoJS.PBKDF2(password, salt, {
//     keySize: keySize / 32,
//     iterations: iterations,
//   });
//   const decryptCipher = CryptoJS.AES.decrypt(plaintext, key, {
//     iv: iv,
//     mode: CryptoJS.mode.CBC,
//     padding: CryptoJS.pad.Pkcs7,
//   });
//   // console.log(decryptCipher.toString(CryptoJS.enc.Utf8));
//   return decryptCipher.toString(CryptoJS.enc.Utf8);
// }

// console.log(
//   decrypt(
//     'LR2PpNw1/DKhj77cvt5v9avJdPFZxPBiR8QvdtJ6JbDmNeZUk5FitMbUILsHNG6FskusfWWSwv3QoOSfcUwLETnFvjnnwWSyC7jrJwvXmXX7rD3TPxG6RAkxdwb9LL7DUoSkz8QJj8MabNPVv6et7Q=='
//   )
// );
