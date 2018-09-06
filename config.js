var Crypto = require("crypto-js");

export function getSignatureKey(key, dateStamp, regionName, serviceName) {
   var kDate = Crypto.HmacSHA256(dateStamp, "AWS4" + key);
   var kRegion = Crypto.HmacSHA256(regionName, kDate);
   var kService = Crypto.HmacSHA256(serviceName, kRegion);
   var kSigning = Crypto.HmacSHA256("aws4_request", kService);
   return kSigning;
}