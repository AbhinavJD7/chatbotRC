export default function PromptSuggestionsButton({ text, onClick }) {
  return (
    <button onClick={onClick} className="prompt-suggestion-btn">
      {text}
    </button>
  );
}