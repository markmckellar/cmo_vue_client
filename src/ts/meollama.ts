// Contents of the me_ollama.json file the server writes next to each event. Labels are true/false;
// keys starting with "me_" are not labels: once someone changes the classification, me_ollama_original
// holds what ollama said (null if it never classified the event) and me_ollama_previous the
// classification the last change replaced.
export interface MeOllama {
  legs?:boolean;
  person?:boolean;
  cat?:boolean;
  dog?:boolean;
  raccoon?:boolean;
  animal?:boolean;
  delivery?:boolean;
  me_ollama_original?:Record<string, boolean>|null;
  me_ollama_previous?:Record<string, boolean>;
  me_ollama_changed?:string;
  [label:string]:boolean|string|Record<string, boolean>|null|undefined;
}

// Every classification an event can have, in the order they are offered
export const CLASSIFICATIONS:{label:string, description:string}[] = [
  { label: 'person', description: 'A person, or any part of one' },
  { label: 'legs', description: "A person's legs or feet" },
  { label: 'cat', description: 'A cat' },
  { label: 'dog', description: 'A dog' },
  { label: 'raccoon', description: 'A raccoon' },
  { label: 'animal', description: 'Any animal' },
  { label: 'delivery', description: 'A delivery person brought something to the house' },
];

// The labels to show for an event: the true ones, less the ones that add nothing. "animal" adds
// nothing when a specific animal was found, nor "legs" when a person was.
export function displayLabels(ollama:MeOllama|null|undefined):string[] {
  let tags = trueLabels(ollama);
  if(tags.some((t) => t !== 'animal' && t !== 'person' && t !== 'legs')) tags = tags.filter((t) => t !== 'animal');
  if(tags.includes('person')) tags = tags.filter((t) => t !== 'legs');
  return(tags);
}

// The labels of a classification that are true, without the backups
export function trueLabels(ollama:MeOllama|null|undefined):string[] {
  if(!ollama) return([]);
  return(Object.keys(ollama).filter((label) => !label.startsWith('me_') && ollama[label] === true));
}
