import { Meta, Story } from "@storybook/react/types-6-0";
import debounce from "lodash/debounce";
import React from "react";
import { Props } from "..";
import Editor from "./index";

export default {
   title: "Editor",
   component: Editor,
   argTypes: {
      value: { control: "text" },
      readOnly: { control: "boolean" },
      onSave: { action: "save" },
      onCancel: { action: "cancel" },
      onClickHashtag: { action: "hashtag clicked" },
      onClickLink: { action: "link clicked" },
      onHoverLink: { action: "link hovered" },
      onShowToast: { action: "toast" },
      onFocus: { action: "focused" },
      onBlur: { action: "blurred" },
      disableExtensions: { control: "array" },
   },
   args: {
      disableExtensions: [],
   },
} as Meta;

const Template: Story<Props> = (args) => <Editor {...args} />;

export const Default = Template.bind({});
Default.args = {
   defaultValue: `# Welcome

Just an easy to use **Markdown** editor with \`slash commands\``,
};

export const Emoji = Template.bind({});
Emoji.args = {
   defaultValue: `# Emoji

\
:1st_place_medal:
`,
};

export const TemplateDoc = Template.bind({});
TemplateDoc.args = {
   template: true,
   defaultValue: `# Template

This document acts as a "template document", it's possible to insert placeholder marks that can be filled in later by others in a non-template document.

\\
!!This is a template placeholder!!`,
};

export const Headings = Template.bind({});
Headings.args = {
   defaultValue: `# Heading 1

## Heading 2

### Heading 3

#### Heading 4`,
};

export const Lists = Template.bind({});
Lists.args = {
   defaultValue: `# Lists

- An
- Unordered
- List

\\
1. An
1. Ordered
1. List`,
};

export const Blockquotes = Template.bind({});
Blockquotes.args = {
   defaultValue: `# Block quotes

> Quotes are another way to callout text within a larger document
> They are often used to incorrectly attribute words to historical figures`,
};

export const Tables = Template.bind({});
Tables.args = {
   defaultValue: `# Tables

Simple tables with alignment and row/col editing are supported, they can be inserted from the slash menu

| Editor      | Rank | React | Collaborative |
|-------------|------|-------|--------------:|
| Prosemirror | A    |   No  |           Yes |
| Slate       | B    |  Yes  |            No |
| CKEdit      | C    |   No  |           Yes |
`,
};

export const Marks = Template.bind({});
Marks.args = {
   defaultValue: `This document shows the variety of marks available, most can be accessed through the formatting menu by selecting text or by typing out the Markdown manually.

\\
**bold**
_italic_
~~strikethrough~~
__underline__
==highlighted==
\`inline code\`
!!placeholder!!
[a link](http://www.getoutline.com)
`,
};

export const Code = Template.bind({});
Code.args = {
   defaultValue: `# Code

\`\`\`html
<html>
  <p class="content">Simple code blocks are supported</html>
</html>
\`\`\`
`,
};

export const Notices = Template.bind({});
Notices.args = {
   defaultValue: `# Notices

There are three types of editable notice blocks that can be used to callout information:

\\
:::info
Informational
:::

:::tip
Tip
:::

:::warning
Warning
:::
`,
};

export const ReadOnly = Template.bind({});
ReadOnly.args = {
   readOnly: true,
   defaultValue: `# Read Only
  
The content of this editor cannot be edited

![Photo caption](https://upload.wikimedia.org/wikipedia/commons/0/06/Davide-ragusa-gcDwzUGuUoI-unsplash.jpg?=243x295)
`,
};

export const MaxLength = Template.bind({});
MaxLength.args = {
   maxLength: 100,
   defaultValue: `This document has a max length of 100 characters. Once reached typing is prevented`,
};

export const Checkboxes = Template.bind({});
Checkboxes.args = {
   defaultValue: `
- [x] done
- [ ] todo`,
};

export const ReadOnlyWriteCheckboxes = Template.bind({});
ReadOnlyWriteCheckboxes.args = {
   readOnly: true,
   readOnlyWriteCheckboxes: true,
   defaultValue: `A read-only editor with the exception that checkboxes remain toggleable, like GitHub

\\
- [x] done
- [ ] todo`,
};

export const Persisted = Template.bind({});
Persisted.args = {
   defaultValue:
      localStorage.getItem("saved") ||
      `# Persisted
  
The contents of this editor are persisted to local storage on change (edit and reload)`,
   onChange: debounce((value) => {
      const text = value();
      localStorage.setItem("saved", text);
   }, 250),
};

export const Placeholder = Template.bind({});
Placeholder.args = {
   defaultValue: "",
   placeholder: "This is a custom placeholder…",
};

export const Media = Template.bind({});
Media.args = {
   defaultValue: `# Media
![Photo caption](https://upload.wikimedia.org/wikipedia/commons/0/06/Davide-ragusa-gcDwzUGuUoI-unsplash.jpg?=243x295)
![Video caption](https://ak.picdn.net/shutterstock/videos/1044255715/preview/stock-footage-person-signing-important-document-camera-following-tip-of-the-pen-as-it-signs-crucial-business.webm?=243x295)`,
   onChange: (fn) => {
      console.log("VALUE: ", fn());
   },
};

export const Focused = Template.bind({});
Focused.args = {
   autoFocus: true,
   defaultValue: `# Focused
  
  This editor starts in focus`,
};

export const Dark = Template.bind({});
Dark.args = {
   dark: true,
   defaultValue: `# Dark

There's a customizable dark theme too`,
};

export const RTL = Template.bind({});
RTL.args = {
   dir: "rtl",
   defaultValue: `# خوش آمدید

متن نمونه برای نمایش پشتیبانی از زبان‌های RTL نظیر فارسی، عربی، عبری و ...

\\
- [x] آیتم اول
- [ ] آیتم دوم`,
};
