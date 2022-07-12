# Notepad Editor

`yarn add @venigallapraveen/notepad`

## Info

This is an extended project on top of [https://github.com/DavidIlie/markdown-editor](https://github.com/DavidIlie/markdown-editor).

### create-react-app

```tsx
import React, { useState } from "react";

import Editor from "@venigallapraveen/notepad";

const Component: React.FC = () => {
   const [val, setVal] = useState("Note Pad!");
   return (
      <Editor defaultValue={val} onChange={(markdown) => setVal(markdown())} />
   );
};

export default Component;
```
