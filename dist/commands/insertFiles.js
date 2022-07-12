"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uploadPlaceholder_1 = __importStar(require("../lib/uploadPlaceholder"));
const isVideo_1 = __importDefault(require("../queries/isVideo"));
const types_1 = require("../types");
const insertFiles = function (view, event, pos, files, options) {
    const images = files.filter((file) => /image/i.test(file.type));
    const videos = files.filter((file) => /video/i.test(file.type));
    if (images.length === 0 && videos.length === 0)
        return;
    const { dictionary, uploadMedia, onImageUploadStart, onImageUploadStop, onShowToast, } = options;
    if (!uploadMedia) {
        console.warn("uploadMedia callback must be defined to handle image uploads.");
        return;
    }
    event.preventDefault();
    if (onImageUploadStart)
        onImageUploadStart();
    const { schema } = view.state;
    let complete = 0;
    const validFile = !!videos.length ? videos : images;
    for (const file of validFile) {
        const id = {};
        const { tr } = view.state;
        tr.setMeta(uploadPlaceholder_1.default, {
            add: { id, file, pos },
        });
        view.dispatch(tr);
        uploadMedia(file)
            .then((src) => {
            const isFileVideo = isVideo_1.default(src);
            const newFile = isFileVideo
                ? document.createElement("video")
                : new Image();
            const initFileLoad = () => {
                const pos = uploadPlaceholder_1.findPlaceholder(view.state, id);
                if (pos === null)
                    return;
                const transaction = view.state.tr
                    .replaceWith(pos, pos, schema.nodes.image.create({ src }))
                    .setMeta(uploadPlaceholder_1.default, { remove: { id } });
                view.dispatch(transaction);
            };
            if (isFileVideo) {
                initFileLoad();
                newFile.setAttribute("src", src);
                newFile.setAttribute("controls", "controls");
            }
            else {
                newFile.onload = initFileLoad;
                newFile.onerror = (error) => {
                    throw error;
                };
                newFile.src = src;
            }
        })
            .catch((error) => {
            console.error(error);
            const transaction = view.state.tr.setMeta(uploadPlaceholder_1.default, {
                remove: { id },
            });
            view.dispatch(transaction);
            if (onShowToast) {
                onShowToast(dictionary.mediaUploadError, types_1.ToastType.Error);
            }
        })
            .finally(() => {
            complete++;
            if (complete === images.length && onImageUploadStop) {
                onImageUploadStop();
            }
        });
    }
};
exports.default = insertFiles;
//# sourceMappingURL=insertFiles.js.map