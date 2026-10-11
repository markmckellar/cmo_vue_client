
// Contents of the me_ollama.json file the server writes next to each event
export interface MeOllama {
  legs:boolean;
  person:boolean;
  cat:boolean;
  dog:boolean;
  raccoon:boolean;
  animal:boolean;
  [label:string]:boolean;
}
