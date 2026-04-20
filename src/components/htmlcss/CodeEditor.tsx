import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

interface Props {
  value: string;
  language: "html" | "css";
  onChange: (v: string) => void;
  readOnly?: boolean;
  height?: string;
}

const CodeEditor = ({ value, language, onChange, readOnly = false, height = "440px" }: Props) => {
  const extensions = useMemo(
    () => [
      language === "html" ? html() : css(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { fontSize: "12.5px", borderRadius: "8px" },
        ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace" },
      }),
    ],
    [language],
  );

  return (
    <CodeMirror
      value={value}
      height={height}
      theme={oneDark}
      extensions={extensions}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        foldGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        indentOnInput: true,
      }}
      onChange={onChange}
    />
  );
};

export default CodeEditor;
