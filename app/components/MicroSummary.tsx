import React, { useContext, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { ThemeContext } from "../theme/themeContext";
import scaleFont from "../utils/scaleFont";
import { UnscalableText } from "./UnscalableText";

function markdownToPlaintext(md: string | null | undefined) {
  if (!md) return "";
  let text = md;
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`([^`]*)`/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\([^\)]*\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  text = text.replace(/\*\*(.*?)\*\*/g, "$1");
  text = text.replace(/\*(.*?)\*/g, "$1");
  text = text.replace(/_(.*?)_/g, "$1");
  text = text.replace(/^#{1,6}\s*/gm, "");
  text = text.replace(/^[\-\*\+]\s+/gm, "");
  text = text.replace(/^\d+\.\s+/gm, "");
  text = text.replace(/\n{2,}/g, "\n\n");
  return text.trim();
}

const MicroSummary: React.FC<{ text?: string }> = ({ text }) => {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const plain = useMemo(() => markdownToPlaintext(text), [text]);
  const [isTruncated, setIsTruncated] = useState(false);
  if (!plain) return null;

  const handleTextLayout = (e: any) => {
    try {
      const lines = e?.nativeEvent?.lines;
      if (Array.isArray(lines)) {
        setIsTruncated(lines.length > 6);
      }
    } catch (err) {
      // ignore layout errors
    }
  };

  return (
    <>
      <UnscalableText
        style={styles.summaryText}
        numberOfLines={6}
        ellipsizeMode="tail"
        onTextLayout={handleTextLayout}
      >
        {plain}
      </UnscalableText>
      {isTruncated && <UnscalableText style={styles.summaryHint}>Click to read full summary</UnscalableText>}
    </>
  );
};

export default MicroSummary;

const createStyles = (theme: any) => StyleSheet.create({ 
  summaryHint: {
    marginTop: 8,
    fontSize: scaleFont(14),
    color: theme.subtext,
    fontStyle: 'italic',
  },
  summaryText: {
    fontSize: scaleFont(14),
    color: theme.text,
    lineHeight: 20,
  }
});