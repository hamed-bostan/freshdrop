export function highlightWord(
  text: string,
  wordToHighlight: string,
  colorClass: string = "text-primary",
): React.ReactNode {
  if (!text || !wordToHighlight) return text;

  // Escape special regex characters
  const escapedWord = wordToHighlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedWord})`, "gi");

  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === wordToHighlight.toLowerCase()) {
      return (
        <span key={index} className={colorClass}>
          {part}
        </span>
      );
    }
    return part;
  });
}
