import { INITIAL_DATA } from './src/lib/initialData';
console.log(JSON.stringify(INITIAL_DATA.teams.find(t => t.id === "igv9v13nv")?.players, null, 2));
console.log(JSON.stringify(INITIAL_DATA.teams.find(t => t.id === "wuj12kmjn")?.players, null, 2));
