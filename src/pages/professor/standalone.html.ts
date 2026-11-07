import html from '../../../prototypes/professor-stick-figure/standalone.html?raw';
// Publish the generated full application directly; no homepage-specific copy.
export function GET(){return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});}
