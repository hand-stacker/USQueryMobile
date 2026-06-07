import { Fragment, useMemo } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

/**
 * Lightweight markdown renderer for chatbot responses.
 *
 * Supports the subset of markdown LLMs commonly emit:
 *   headings (#..######), bold, italic, inline code, code fences,
 *   bullet / numbered lists, blockquotes, horizontal rules, and links.
 *
 * Renders to plain React Native <Text>/<View> so it inherits the app theme
 * and works on every platform without a native dependency.
 */

interface MarkdownProps {
  children: string;
  /** Base text color (defaults to theme.text). */
  color: string;
  /** Muted color for quotes / rule (defaults to theme.subtext). */
  mutedColor: string;
  /** Color used for links and inline-code accents (defaults to theme.primary). */
  accentColor: string;
  /** Subtle surface color for code blocks / inline code backgrounds. */
  surfaceColor: string;
  /** Base font size; other sizes scale from this. Defaults to 14. */
  fontSize?: number;
}

// ── Inline parsing ────────────────────────────────────────────────────────────
// Matches **bold**, __bold__, *italic*, _italic_, `code`, and [text](url).
const INLINE_REGEX =
  /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

const LINK_REGEX = /^\[([^\]]+)\]\(([^)]+)\)$/;

function renderInline(text: string, styles: any, accentColor: string, keyPrefix: string) {
  const parts = text.split(INLINE_REGEX).filter(p => p !== "");
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <Text key={key} style={styles.bold}>{part.slice(2, -2)}</Text>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <Text key={key} style={styles.italic}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <Text key={key} style={styles.codeInline}>{part.slice(1, -1)}</Text>;
    }
    const link = part.match(LINK_REGEX);
    if (link) {
      const [, label, url] = link;
      return (
        <Text key={key} style={[styles.link, { color: accentColor }]} onPress={() => Linking.openURL(url).catch(() => {})}>
          {label}
        </Text>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

// ── Block parsing ─────────────────────────────────────────────────────────────
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const UL_RE = /^\s*[-*+]\s+(.*)$/;
const OL_RE = /^\s*(\d+)\.\s+(.*)$/;
const QUOTE_RE = /^\s*>\s?(.*)$/;
const HR_RE = /^\s*([-*_])\1{2,}\s*$/;
const FENCE_RE = /^\s*```/;

function Markdown({
  children,
  color,
  mutedColor,
  accentColor,
  surfaceColor,
  fontSize = 14,
}: MarkdownProps) {
  const styles = useMemo(
    () => createStyles(color, mutedColor, accentColor, surfaceColor, fontSize),
    [color, mutedColor, accentColor, surfaceColor, fontSize]
  );

  const blocks = useMemo(() => {
    const lines = children.replace(/\r\n/g, "\n").split("\n");
    const out: React.ReactNode[] = [];
    let para: string[] = [];
    let i = 0;

    const flushPara = () => {
      if (para.length === 0) return;
      const text = para.join(" ").trim();
      para = [];
      if (text) {
        out.push(
          <Text key={`p-${out.length}`} style={styles.paragraph}>
            {renderInline(text, styles, accentColor, `p${out.length}`)}
          </Text>
        );
      }
    };

    while (i < lines.length) {
      const line = lines[i];

      // Fenced code block
      if (FENCE_RE.test(line)) {
        flushPara();
        const code: string[] = [];
        i++;
        while (i < lines.length && !FENCE_RE.test(lines[i])) {
          code.push(lines[i]);
          i++;
        }
        i++; // skip closing fence
        out.push(
          <View key={`code-${out.length}`} style={styles.codeBlock}>
            <Text style={styles.codeBlockText}>{code.join("\n")}</Text>
          </View>
        );
        continue;
      }

      // Blank line → paragraph break
      if (line.trim() === "") {
        flushPara();
        i++;
        continue;
      }

      // Horizontal rule
      if (HR_RE.test(line)) {
        flushPara();
        out.push(<View key={`hr-${out.length}`} style={styles.hr} />);
        i++;
        continue;
      }

      // Heading
      const heading = line.match(HEADING_RE);
      if (heading) {
        flushPara();
        const level = heading[1].length;
        out.push(
          <Text key={`h-${out.length}`} style={[styles.heading, styles[`h${level}` as keyof typeof styles] as object]}>
            {renderInline(heading[2], styles, accentColor, `h${out.length}`)}
          </Text>
        );
        i++;
        continue;
      }

      // Blockquote (consecutive lines)
      if (QUOTE_RE.test(line)) {
        flushPara();
        const quote: string[] = [];
        while (i < lines.length && QUOTE_RE.test(lines[i])) {
          quote.push(lines[i].match(QUOTE_RE)![1]);
          i++;
        }
        out.push(
          <View key={`q-${out.length}`} style={styles.blockquote}>
            <Text style={styles.blockquoteText}>
              {renderInline(quote.join(" "), styles, accentColor, `q${out.length}`)}
            </Text>
          </View>
        );
        continue;
      }

      // List (unordered or ordered, consecutive items)
      if (UL_RE.test(line) || OL_RE.test(line)) {
        flushPara();
        const items: { marker: string; text: string }[] = [];
        while (i < lines.length && (UL_RE.test(lines[i]) || OL_RE.test(lines[i]))) {
          const ol = lines[i].match(OL_RE);
          if (ol) {
            items.push({ marker: `${ol[1]}.`, text: ol[2] });
          } else {
            items.push({ marker: "•", text: lines[i].match(UL_RE)![1] });
          }
          i++;
        }
        out.push(
          <View key={`list-${out.length}`} style={styles.list}>
            {items.map((it, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listMarker}>{it.marker}</Text>
                <Text style={styles.listItemText}>
                  {renderInline(it.text, styles, accentColor, `li${out.length}-${idx}`)}
                </Text>
              </View>
            ))}
          </View>
        );
        continue;
      }

      // Default: accumulate into paragraph
      para.push(line.trim());
      i++;
    }

    flushPara();
    return out;
  }, [children, styles, accentColor]);

  return <View>{blocks}</View>;
}

export default Markdown;

const createStyles = (
  color: string,
  mutedColor: string,
  accentColor: string,
  surfaceColor: string,
  fontSize: number
) =>
  StyleSheet.create({
    paragraph: { color, fontSize, lineHeight: fontSize * 1.5, marginBottom: 8, fontWeight: "400" },
    bold: { fontWeight: "700" },
    italic: { fontStyle: "italic", fontWeight: "400" },
    link: { textDecorationLine: "underline", fontWeight: "500" },
    codeInline: {
      fontFamily: "monospace",
      fontSize: fontSize - 1,
      color: accentColor,
      backgroundColor: surfaceColor,
      fontWeight: "400",
    },
    codeBlock: {
      backgroundColor: surfaceColor,
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
    },
    codeBlockText: { fontFamily: "monospace", fontSize: fontSize - 1, color, lineHeight: (fontSize - 1) * 1.5, fontWeight: "400" },
    heading: { color, fontWeight: "700", marginBottom: 6 },
    h1: { fontSize: fontSize + 7, lineHeight: (fontSize + 7) * 1.3 },
    h2: { fontSize: fontSize + 5, lineHeight: (fontSize + 5) * 1.3 },
    h3: { fontSize: fontSize + 3, lineHeight: (fontSize + 3) * 1.3 },
    h4: { fontSize: fontSize + 1, lineHeight: (fontSize + 1) * 1.3 },
    h5: { fontSize, lineHeight: fontSize * 1.3 },
    h6: { fontSize: fontSize - 1, lineHeight: (fontSize - 1) * 1.3, color: mutedColor },
    hr: { height: 1, backgroundColor: mutedColor, opacity: 0.3, marginVertical: 10 },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
      paddingLeft: 10,
      marginBottom: 8,
    },
    blockquoteText: { color: mutedColor, fontSize, lineHeight: fontSize * 1.5, fontStyle: "italic", fontWeight: "400" },
    list: { marginBottom: 8, gap: 4 },
    listItem: { flexDirection: "row", alignItems: "flex-start" },
    listMarker: { color: accentColor, fontSize, lineHeight: fontSize * 1.5, marginRight: 8, fontWeight: "600" },
    listItemText: { color, fontSize, lineHeight: fontSize * 1.5, flex: 1, fontWeight: "400" },
  });
