"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prosemirror_view_1 = require("prosemirror-view");
const isVideo_1 = __importDefault(require("../queries/isVideo"));
const Plugin = require('prosemirror-state').Plugin;
const uploadPlaceholder = new Plugin({
    state: {
        init() {
            return prosemirror_view_1.DecorationSet.empty;
        },
        apply(tr, set) {
            set = set.map(tr.mapping, tr.doc);
            const action = tr.getMeta(this);
            if (action && action.add) {
                const element = document.createElement("div");
                element.className = "image placeholder";
                const isFileVideo = isVideo_1.default(action.add.file.name);
                const media = document.createElement(isFileVideo ? "video" : "img");
                media.src = URL.createObjectURL(action.add.file);
                if (isFileVideo) {
                    media.style.width = "100%";
                    media.style.height = "100%";
                    media.controls = true;
                }
                element.appendChild(media);
                const deco = prosemirror_view_1.Decoration.widget(action.add.pos, element, {
                    id: action.add.id,
                });
                set = set.add(tr.doc, [deco]);
            }
            else if (action && action.remove) {
                set = set.remove(set.find(null, null, (spec) => spec.id === action.remove.id));
            }
            return set;
        },
    },
    props: {
        decorations(state) {
            return this.getState(state);
        },
    },
});
exports.default = uploadPlaceholder;
//# sourceMappingURL=uploadPlaceholder.js.map