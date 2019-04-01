
export function getContentTypeFromBase64(base64Data: string): string {
  return base64Data.substring(
    base64Data.indexOf(":") + 1,
    base64Data.indexOf(";")
  );
}

export function base64toBlob(base64Data: string, contentType?: string): Blob {
  if (base64Data.startsWith("data:")) {
    contentType = contentType || getContentTypeFromBase64(base64Data);
    base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
  }
  contentType = contentType || "";
  var sliceSize = 1024;
  var byteCharacters = atob(base64Data);
  var bytesLength = byteCharacters.length;
  var slicesCount = Math.ceil(bytesLength / sliceSize);
  var byteArrays = new Array(slicesCount);

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    var begin = sliceIndex * sliceSize;
    var end = Math.min(begin + sliceSize, bytesLength);

    var bytes = new Array(end - begin);
    for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}