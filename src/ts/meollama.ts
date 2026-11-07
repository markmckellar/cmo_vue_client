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

// Every classification offered in the app, in order. The AI also answers "legs" (a person's legs or feet,
// when it isn't sure it's a whole person); people see that as "person" (see userLabels), so it isn't offered.
export const CLASSIFICATIONS:{label:string, description:string}[] = [
  { label: 'person', description: 'A person, or any part of one (legs, feet)' },
  { label: 'cat', description: 'A cat' },
  { label: 'dog', description: 'A dog' },
  { label: 'raccoon', description: 'A raccoon' },
  { label: 'animal', description: 'Any animal' },
  { label: 'delivery', description: 'A delivery person brought something to the house' },
];

// Labels the AI uses that people see as another one: "legs" is a person
export const SAME_AS:Record<string, string> = { legs: 'person' };

// The true labels as people see them: "legs" becomes "person", without repeats
export function userLabels(ollama:MeOllama|Record<string, boolean>|null|undefined):string[] {
  const out:string[] = [];
  for (const l of trueLabels(ollama as MeOllama)) {
    const u = SAME_AS[l] ?? l;
    if(!out.includes(u)) out.push(u);
  }
  return(out);
}

// The labels to show for an event: as people see them, less "animal" when a specific animal was found
export function displayLabels(ollama:MeOllama|null|undefined):string[] {
  let tags = userLabels(ollama);
  if(tags.some((t) => t !== 'animal' && t !== 'person')) tags = tags.filter((t) => t !== 'animal');
  return(tags);
}

// The labels of a classification that are true, without the backups
export function trueLabels(ollama:MeOllama|null|undefined):string[] {
  if(!ollama) return([]);
  return(Object.keys(ollama).filter((label) => !label.startsWith('me_') && ollama[label] === true));
}
