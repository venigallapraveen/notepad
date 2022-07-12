import { Decoration, DecorationSet } from "prosemirror-view";
import isVideo from "../queries/isVideo";

const Plugin = require('prosemirror-state').Plugin;


// based on the example at: https://prosemirror.net/examples/upload/
export const uploadPlaceholderPlugin = new Plugin({
   state: {
      init() {
         return DecorationSet.empty;
      },
      apply(tr, set) {
         // Adjust decoration positions to changes made by the transaction
         set = set.map(tr.mapping, tr.doc);

         // See if the transaction adds or removes any placeholders
         const action = tr.getMeta(this);

         if (action && action.add) {
            const element = document.createElement("div");
            element.className = "image placeholder";

            const isFileVideo = isVideo(action.add.file.name);

            const media = document.createElement(isFileVideo ? "video" : "img");
            media.src = URL.createObjectURL(action.add.file);

            if (isFileVideo) {
               media.style.width = "100%";
               media.style.height = "100%";
               //@ts-ignore
               media.controls = true;
            }

            element.appendChild(media);

            const deco = Decoration.widget(action.add.pos, element, {
               id: action.add.id,
            });
            set = set.add(tr.doc, [deco]);
         } else if (action && action.remove) {
            set = set.remove(
               set.find(null, null, (spec) => spec.id === action.remove.id)
            );
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

// export default uploadPlaceholder;

export function findPlaceholder(state, id) {
   const decos = uploadPlaceholderPlugin.getState(state);
   const found = decos.find(null, null, (spec) => spec.id === id);
   return found.length ? found[0].from : null;
}
