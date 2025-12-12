import PromptSuggestionsButton from "./PromptSuggestionsButton"

interface PromptSuggestionsRowProps {
  onPromptClick: (prompt: string) => void;
}

const PromptSuggestionsRow = ({ onPromptClick }: PromptSuggestionsRowProps) => {
  const prompts = [
    "What does RapidClaims do?",
    "Can you explain RapidCode and RapidScrub?",
    "What kind of results have your customers seen?",
    "Can I see a demo of the platform?"
  ];
  
  return (
    <div className="prompt-suggestion-row">
      {prompts.map((prompt, index) => 
        <PromptSuggestionsButton
          key={`suggestions-${index}`}
          text={prompt}
          onClick={() => onPromptClick(prompt)}
        />
      )}
    </div>
  );
};

export default PromptSuggestionsRow;