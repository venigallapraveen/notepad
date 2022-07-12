"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoBlobFormat = void 0;
function isVideo(src) {
    return src.match(/\.(m4v|avi|mpg|mp4|webm|mov)$/) !== null;
}
exports.default = isVideo;
function videoBlobFormat(src) {
    const hasBlob = src.indexOf("blob:") >= 0;
    if (!hasBlob)
        return src;
    const videoFormat = src.match(/\.(m4v|avi|mpg|mp4|webm|mov)$/);
    const splittedValue = !!(videoFormat === null || videoFormat === void 0 ? void 0 : videoFormat.length)
        ? src.split(videoFormat[0])
        : [src];
    return splittedValue[0];
}
exports.videoBlobFormat = videoBlobFormat;
//# sourceMappingURL=isVideo.js.map