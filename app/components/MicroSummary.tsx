import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";

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

const MAX_CONTAINER_HEIGHT = 180;
const LINE_HEIGHT = 20; 
const MAX_LINES = Math.floor(MAX_CONTAINER_HEIGHT / LINE_HEIGHT);

const MicroSummary: React.FC<{ text?: string }> = ({ text }) => {
  const plain = markdownToPlaintext(text);
  const [isTruncated, setIsTruncated] = useState(false);
  if (!plain) return null;

  const handleTextLayout = (e: any) => {
    try {
      const lines = e?.nativeEvent?.lines;
      if (Array.isArray(lines)) {
        setIsTruncated(lines.length > MAX_LINES);
      }
    } catch (err) {
      // ignore layout errors
    }
  };

  return (
    <>
      <Text
        style={styles.summaryText}
        numberOfLines={MAX_LINES}
        ellipsizeMode="tail"
        onTextLayout={handleTextLayout}
      >
        {plain}
      </Text>
      {isTruncated && <Text style={styles.summaryHint}>Click to read full summary</Text>}
    </>
  );
};

export default MicroSummary;

const styles = StyleSheet.create({
  summaryHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  summaryText: {
      fontSize: 14,
      color: '#334155',
      lineHeight: 20,
    }
});
