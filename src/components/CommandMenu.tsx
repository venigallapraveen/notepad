import capitalize from "lodash/capitalize";
import { findDomRefAtPos, findParentNode } from "prosemirror-utils";
import { EditorView } from "prosemirror-view";
import * as React from "react";
import { Portal } from "react-portal";
import styled from "styled-components";
import insertFiles from "../commands/insertFiles";
import baseDictionary from "../dictionary";
import filterExcessSeparators from "../lib/filterExcessSeparators";
import getDataTransferFiles from "../lib/getDataTransferFiles";
import { EmbedDescriptor, MenuItem, ToastType } from "../types";
import Input from "./Input";
import VisuallyHidden from "./VisuallyHidden";

const SSR = typeof window === "undefined";

const defaultPosition = {
  left: -1000,
  top: 0,
  bottom: undefined,
  isAbove: false,
};

export type Props<T extends MenuItem = MenuItem> = {
  rtl: boolean;
  isActive: boolean;
  commands: Record<string, any>;
  dictionary: typeof baseDictionary;
  view: EditorView;
  search: string;
  uploadMedia?: (file: File) => Promise<string>;
  onImageUploadStart?: () => void;
  onImageUploadStop?: () => void;
  onShowToast?: (message: string, id: string) => void;
  onLinkToolbarOpen?: () => void;
  onClose: () => void;
  onClearSearch: () => void;
  embeds?: EmbedDescriptor[];
  renderMenuItem: (
    item: T,
    index: number,
    options: {
      selected: boolean;
      onClick: () => void;
    }
  ) => React.ReactNode;
  filterable?: boolean;
  items: T[];
  id?: string;
};

type State = {
  insertItem?: EmbedDescriptor;
  left?: number;
  top?: number;
  bottom?: number;
  isAbove: boolean;
  selectedIndex: number;
};

class CommandMenu<T = MenuItem> extends React.Component<Props<T>, State> {
  menuRef = React.createRef<HTMLDivElement>();
  inputRef = React.createRef<HTMLInputElement>();

  state: State = {
    left: -1000,
    top: 0,
    bottom: undefined,
    isAbove: false,
    selectedIndex: 0,
    insertItem: undefined,
  };

  componentDidMount() {
    if (!SSR) {
      window.addEventListener("keydown", this.handleKeyDown);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.search !== this.props.search ||
      nextProps.isActive !== this.props.isActive ||
      nextState !== this.state
    );
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isActive && this.props.isActive) {
      const position = this.calculatePosition(this.props);

      this.setState({
        insertItem: undefined,
        selectedIndex: 0,
        ...position,
      });
    } else if (prevProps.search !== this.props.search) {
      this.setState({ selectedIndex: 0 });
    }
  }

  componentWillUnmount() {
    if (!SSR) {
      window.removeEventListener("keydown", this.handleKeyDown);
    }
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (!this.props.isActive) return;

    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();

      const item = this.filtered[this.state.selectedIndex];

      if (item) {
        this.insertItem(item);
      } else {
        this.props.onClose();
      }
    }

    if (
      event.key === "ArrowUp" ||
      (event.key === "Tab" && event.shiftKey) ||
      (event.ctrlKey && event.key === "p")
    ) {
      event.preventDefault();
      event.stopPropagation();

      if (this.filtered.length) {
        const prevIndex = this.state.selectedIndex - 1;
        const prev = this.filtered[prevIndex];

        this.setState({
          selectedIndex: Math.max(
            0,
            prev && prev.name === "separator" ? prevIndex - 1 : prevIndex
          ),
        });
      } else {
        this.close();
      }
    }

    if (
      event.key === "ArrowDown" ||
      (event.key === "Tab" && !event.shiftKey) ||
      (event.ctrlKey && event.key === "n")
    ) {
      event.preventDefault();
      event.stopPropagation();

      if (this.filtered.length) {
        const total = this.filtered.length - 1;
        const nextIndex = this.state.selectedIndex + 1;
        const next = this.filtered[nextIndex];

        this.setState({
          selectedIndex: Math.min(
            next && next.name === "separator" ? nextIndex + 1 : nextIndex,
            total
          ),
        });
      } else {
        this.close();
      }
    }

    if (event.key === "Escape") {
      this.close();
    }
  };

  insertItem = (item) => {
    switch (item.name) {
      case "image":
        return this.triggerImagePick();
      case "embed":
        return this.triggerLinkInput(item);
      case "link": {
        this.clearSearch();
        this.props.onClose();
        this.props.onLinkToolbarOpen?.();
        return;
      }
      default:
        this.insertBlock(item);
    }
  };

  close = () => {
    this.props.onClose();
    this.props.view.focus();
  };

  handleLinkInputKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!this.props.isActive) return;
    if (!this.state.insertItem) return;

    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();

      const href = event.currentTarget.value;
      const matches = this.state.insertItem.matcher(href);

      if (!matches && this.props.onShowToast) {
        this.props.onShowToast(
          this.props.dictionary.embedInvalidLink,
          ToastType.Error
        );
        return;
      }

      this.insertBlock({
        name: "embed",
        attrs: {
          href,
        },
      });
    }

    if (event.key === "Escape") {
      this.props.onClose();
      this.props.view.focus();
    }
  };

  handleLinkInputPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (!this.props.isActive) return;
    if (!this.state.insertItem) return;

    const href = event.clipboardData.getData("text/plain");
    const matches = this.state.insertItem.matcher(href);

    if (matches) {
      event.preventDefault();
      event.stopPropagation();

      this.insertBlock({
        name: "embed",
        attrs: {
          href,
        },
      });
    }
  };

  triggerImagePick = () => {
    if (this.inputRef.current) {
      this.inputRef.current.click();
    }
  };

  triggerLinkInput = (item) => {
    this.setState({ insertItem: item });
  };

  handleImagePicked = (event) => {
    const files = getDataTransferFiles(event);

    const {
      view,
      uploadMedia,
      onImageUploadStart,
      onImageUploadStop,
      onShowToast,
    } = this.props;
    const { state } = view;
    const parent = findParentNode((node) => !!node)(state.selection);

    this.clearSearch();

    if (parent) {
      insertFiles(view, event, parent.pos, files, {
        uploadMedia,
        onImageUploadStart,
        onImageUploadStop,
        onShowToast,
        dictionary: this.props.dictionary,
      });
    }

    if (this.inputRef.current) {
      this.inputRef.current.value = "";
    }

    this.props.onClose();
  };

  clearSearch = () => {
    this.props.onClearSearch();
  };

  insertBlock(item) {
    this.clearSearch();

    const command = this.props.commands[item.name];
    if (command) {
      command(item.attrs);
    } else {
      this.props.commands[`create${capitalize(item.name)}`](item.attrs);
    }

    this.props.onClose();
  }

  get caretPosition(): { top: number; left: number } {
    const selection = window.document.getSelection();
    if (!selection || !selection.anchorNode || !selection.focusNode) {
      return {
        top: 0,
        left: 0,
      };
    }

    const range = window.document.createRange();
    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);

    // This is a workaround for an edgecase where getBoundingClientRect will
    // return zero values if the selection is collapsed at the start of a newline
    // see reference here: https://stackoverflow.com/a/59780954
    const rects = range.getClientRects();
    if (rects.length === 0) {
      // probably buggy newline behavior, explicitly select the node contents
      if (range.startContainer && range.collapsed) {
        range.selectNodeContents(range.startContainer);
      }
    }

    const rect = range.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
    };
  }

  calculatePosition(props) {
    const { view } = props;
    const { selection } = view.state;
    let startPos;
    try {
      startPos = view.coordsAtPos(selection.from);
    } catch (err) {
      console.warn(err);
      return defaultPosition;
    }

    const domAtPos = view.domAtPos.bind(view);

    const ref = this.menuRef.current;
    const offsetHeight = ref ? ref.offsetHeight : 0;
    const node = findDomRefAtPos(selection.from, domAtPos);
    const paragraph: any = { node };

    if (
      !props.isActive ||
      !paragraph.node ||
      !paragraph.node.getBoundingClientRect ||
      SSR
    ) {
      return defaultPosition;
    }

    const { left } = this.caretPosition;
    const { top, bottom, right } = paragraph.node.getBoundingClientRect();
    const margin = 24;

    let leftPos = left + window.scrollX;
    if (props.rtl && ref) {
      leftPos = right - ref.scrollWidth;
    }

    if (startPos.top - offsetHeight > margin) {
      return {
        left: leftPos,
        top: undefined,
        bottom: window.innerHeight - top - window.scrollY,
        isAbove: false,
      };
    } else {
      return {
        left: leftPos,
        top: bottom + window.scrollY,
        bottom: undefined,
        isAbove: true,
      };
    }
  }

  get filtered() {
    const {
      embeds = [],
      search = "",
      uploadMedia,
      commands,
      filterable = true,
    } = this.props;
    let items: (EmbedDescriptor | MenuItem)[] = this.props.items;
    const embedItems: EmbedDescriptor[] = [];

    for (const embed of embeds) {
      if (embed.title && embed.icon) {
        embedItems.push({
          ...embed,
          name: "embed",
        });
      }
    }

    if (embedItems.length) {
      items.push({
        name: "separator",
      });
      items = items.concat(embedItems);
    }

    const filtered = items.filter((item) => {
      if (item.name === "separator") return true;

      // Some extensions may be disabled, remove corresponding menu items
      if (
        item.name &&
        !commands[item.name] &&
        !commands[`create${capitalize(item.name)}`]
      ) {
        return false;
      }

      // If no image upload callback has been passed, filter the image block out
      if (!uploadMedia && item.name === "image") return false;

      // some items (defaultHidden) are not visible until a search query exists
      if (!search) return !item.defaultHidden;

      const n = search.toLowerCase();
      if (!filterable) {
        return item;
      }
      return (
        (item.title || "").toLowerCase().includes(n) ||
        (item.keywords || "").toLowerCase().includes(n)
      );
    });

    return filterExcessSeparators(filtered);
  }

  render() {
    const { dictionary, isActive, uploadMedia } = this.props;
    const items = this.filtered;
    const { insertItem, ...positioning } = this.state;

    return (
      <Portal>
        <Wrapper
          id={this.props.id || "block-menu-container"}
          active={isActive}
          ref={this.menuRef}
          {...positioning}
        >
          {insertItem ? (
            <LinkInputWrapper>
              <LinkInput
                type="text"
                placeholder={
                  insertItem.title
                    ? dictionary.pasteLinkWithTitle(insertItem.title)
                    : dictionary.pasteLink
                }
                onKeyDown={this.handleLinkInputKeydown}
                onPaste={this.handleLinkInputPaste}
                autoFocus
              />
            </LinkInputWrapper>
          ) : (
            <List>
              {items.map((item, index) => {
                if (item.name === "separator") {
                  return (
                    <ListItem key={index}>
                      <hr />
                    </ListItem>
                  );
                }
                const selected = index === this.state.selectedIndex && isActive;

                if (!item.title) {
                  return null;
                }

                return (
                  <ListItem key={index}>
                    {this.props.renderMenuItem(item as any, index, {
                      selected,
                      onClick: () => this.insertItem(item),
                    })}
                  </ListItem>
                );
              })}
              {items.length === 0 && (
                <ListItem>
                  <Empty>{dictionary.noResults}</Empty>
                </ListItem>
              )}
            </List>
          )}
          {uploadMedia && (
            <VisuallyHidden>
              <input
                type="file"
                ref={this.inputRef}
                onChange={this.handleImagePicked}
                accept="image/*, video/*"
              />
            </VisuallyHidden>
          )}
        </Wrapper>
      </Portal>
    );
  }
}

const LinkInputWrapper = styled.div`
  margin: 8px;
`;

const LinkInput = styled(Input)`
  height: 36px;
  width: 100%;
  color: ${(props) => props.theme.blockToolbarText};
`;

const List = styled.ol`
  list-style: none;
  text-align: left;
  height: 100%;
  padding: 8px 0;
  margin: 0;
`;

const ListItem = styled.li`
  padding: 0;
  margin: 0;
`;

const Empty = styled.div`
  display: flex;
  align-items: center;
  color: ${(props) => props.theme.textSecondary};
  font-weight: 500;
  font-size: 14px;
  height: 36px;
  padding: 0 16px;
`;

export const Wrapper = styled.div<{
  active: boolean;
  top?: number;
  bottom?: number;
  left?: number;
  isAbove: boolean;
}>`
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontFamily};
  position: absolute;
  z-index: ${(props) => props.theme.zIndex + 100};
  ${(props) => props.top !== undefined && `top: ${props.top}px`};
  ${(props) => props.bottom !== undefined && `bottom: ${props.bottom}px`};
  left: ${(props) => props.left}px;
  background-color: ${(props) => props.theme.blockToolbarBackground};
  border-radius: 4px;
  box-shadow: rgba(0, 0, 0, 0.05) 0px 0px 0px 1px,
    rgba(0, 0, 0, 0.08) 0px 4px 8px, rgba(0, 0, 0, 0.08) 0px 2px 4px;
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275),
    transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transition-delay: 150ms;
  line-height: 0;
  box-sizing: border-box;
  pointer-events: none;
  white-space: nowrap;
  width: 300px;
  max-height: 224px;
  overflow: hidden;
  overflow-y: auto;

  * {
    box-sizing: border-box;
  }

  hr {
    border: 0;
    height: 0;
    border-top: 1px solid ${(props) => props.theme.blockToolbarDivider};
  }

  ${({ active, isAbove }) =>
    active &&
    `
    transform: translateY(${isAbove ? "6px" : "-6px"}) scale(1);
    pointer-events: all;
    opacity: 1;
  `};

  @media print {
    display: none;
  }
`;

export default CommandMenu;
