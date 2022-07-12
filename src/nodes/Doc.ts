import Node from "./Node";

export default class Doc extends Node {
   get name() {
      return "doc";
   }

   //@ts-ignore
   get schema() {
      return {
         content: "block+",
      };
   }
}
