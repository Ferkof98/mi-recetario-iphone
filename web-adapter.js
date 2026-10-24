/* Adaptador Safari/PWA: no modifica la aplicación Android. */
(function(){
'use strict';
const KEY='recetario-web-gemini-key';
const getKey=()=>localStorage.getItem(KEY)||'';
const setKey=(key)=>localStorage.setItem(KEY,key.trim());
const hasKey=()=>!!getKey();
const recipeSchema={type:'OBJECT',properties:{titulo:{type:'STRING'},ingredientes:{type:'ARRAY',items:{type:'STRING'}},pasos:{type:'ARRAY',items:{type:'STRING'}},thermomix:{type:'ARRAY',items:{type:'STRING'}},notas:{type:'STRING'}},required:['titulo','ingredientes','pasos']};
async function gemini(prompt,schema=recipeSchema){
 const key=getKey();if(!key)throw Error('Primero configura tu propia clave Gemini en Ajustes.');
 const url='https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema}})});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(payload?.error?.message||'Error HTTP '+response.status);
 const raw=payload?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('');
 if(!raw)throw Error('Gemini no devolvió una receta. Reintenta.');
 return JSON.parse(raw);
}
window.saveKey=function(){
 const key=$('api').value.trim();
 if(!key)return alert('Pega tu clave primero.');
 setKey(key);$('api').value='';text('keyStatus','✓ Clave configurada en este dispositivo');$('keyCard').classList.add('hidden');
};
window.finishOnboarding=function(){
 const name=$('chefName').value.trim();
 if(!name)return text('onboardError','Escribe tu nombre de chef.');
 const key=$('onboardApi').value.trim();
 if(key)setKey(key);
 if(!hasKey())return text('onboardError','Introduce tu propia clave Gemini para continuar.');
 localStorage.setItem('recetario-chef-name',name);
 localStorage.setItem('recetario-language',$('onboardLang').value);
 localStorage.setItem('recetario-onboarding-v142','done');
 $('onboarding').classList.remove('visible');
 $('onboardApi').value='';
 applyUILanguage();renderChefGreeting();$('keyCard').classList.add('hidden');
};
window.generate=async function(){
 if(busy)return;
 if(mode==='file')return alert('El análisis de videos aún no está disponible en esta beta para iPhone. Conservamos la función para una siguiente etapa.');
 const dish=$('dish').value.trim(),desc=$('description').value.trim(),url=$('link').value.trim(),n=Number($('people').value);
 if(!Number.isInteger(n)||n<1||n>50)return alert('Elige entre 1 y 50 personas.');
 if(mode==='name'&&!dish)return alert('Escribe el nombre del plato.');
 if(mode==='link'&&!url&&!desc)return alert('Pega un enlace o la descripción del video.');
 if(mode==='link'&&url&&!desc)return alert('En esta beta no podemos acceder al contenido del video mediante su enlace. Pega una descripción de la receta para que Gemini la prepare sin inventar lo que ocurre en el video.');
 setBusy(true);text('status','Generando receta con Gemini…');
 try{
  const prompt=(mode==='name'?'Prepara una receta culinaria para: '+dish+'. ':'Prepara una receta a partir de esta descripción proporcionada por la persona, sin afirmar que has visto el video: ')
   +' Indicaciones: '+desc+'. Porciones: '+n+'. '+languageInstruction()+
   ' Devuelve JSON con titulo, ingredientes (lista de cantidades), pasos (lista), thermomix (lista vacía si no corresponde) y notas. No inventes contenido de videos que no has visto.';
  const r=await gemini(prompt);
  if(!validRecipe(r))throw Error('La respuesta no contiene ingredientes y pasos válidos.');
  current={...r,thermomix:Array.isArray(r.thermomix)?r.thermomix:[],porciones:n,url:mode==='link'?url:''};
  show(current);persistDraft();text('status','✓ Receta creada. Pulsa Guardar receta para conservarla.');
 }catch(e){onError(e.message)}finally{setBusy(false)}
};
window.suggestFromFridge=async function(){
 if(fridgeBusy)return;
 const ingredients=$('fridgeIngredients').value.trim(),extras=$('fridgeExtras').value,n=Number($('fridgePeople').value);
 if(!ingredients)return text('fridgeStatus','Escribe los ingredientes disponibles.');
 fridgeBusy=true;$('fridgeSuggest').disabled=true;text('fridgeStatus','Buscando ideas con Gemini…');
 try{
  const policy=extras==='none'?'Usa solo los ingredientes indicados.':extras==='basics'?'Puedes añadir unos pocos básicos de despensa, identificándolos.':'Puedes sugerir ingredientes para comprar, identificándolos.';
  const schema={type:'OBJECT',properties:{ideas:{type:'ARRAY',items:{type:'OBJECT',properties:{titulo:{type:'STRING'},descripcion:{type:'STRING'}},required:['titulo','descripcion']}}},required:['ideas']};
  const data=await gemini('Propón 3 ideas de platos para '+n+' personas usando: '+ingredients+'. '+policy+' '+languageInstruction()+' Devuelve JSON con ideas: lista de titulo y descripcion.',schema);
  const ideas=(data.ideas||[]).filter(x=>x&&x.titulo);
  fridgeIdeas=ideas;
  const host=$('fridgeSuggestions');host.replaceChildren();
  ideas.forEach((idea,i)=>{const b=document.createElement('button');b.className='secondary';b.style.margin='8px 0';b.textContent=idea.titulo+' — '+idea.descripcion;b.onclick=()=>selectFridgeIdea(i);host.appendChild(b)});
  text('fridgeStatus',ideas.length?'Selecciona una idea para preparar la receta.':'No se encontraron ideas.');
 }catch(e){text('fridgeStatus','⚠️ '+e.message)}
 finally{fridgeBusy=false;$('fridgeSuggest').disabled=false}
};
window.runModification=async function(instruction){
 if(busy||!current)return;
 setBusy(true);text('status','Gemini está adaptando la receta…');
 try{
  const r=await gemini('Conserva la receta salvo los cambios solicitados. Receta JSON: '+JSON.stringify(current)+'. Cambio: '+instruction+'. '+languageInstruction());
  if(!validRecipe(r))throw Error('Gemini devolvió una receta incompleta.');
  onModified(JSON.stringify(r));
 }catch(e){onError(e.message)}finally{setBusy(false)}
};
window.pickVideoSafe=function(){alert('La selección y análisis de videos todavía no están disponibles en esta beta para iPhone.')};
window.saveOriginalVideo=function(){alert('La descarga de videos externos todavía no está disponible en esta beta para iPhone.')};
window.prepareThermomix=function(){
 if(!current)return;
 if(current.thermomix?.length)return $('tmSection').scrollIntoView({behavior:'smooth'});
 if(confirm('¿Preparar instrucciones para Thermomix TM6 con Gemini?'))runModification('Conserva ingredientes y pasos tradicionales y añade instrucciones claras en thermomix para TM6. No inventes ajustes inseguros.');
};
const existingShare=window.shareRecipe;
window.shareRecipe=function(){if(current&&navigator.share)navigator.share({text:recipeText(current)}).catch(()=>{});else existingShare()};
const warn=document.createElement('p');
warn.className='muted';warn.style.fontSize='12px';
warn.textContent='Versión web beta: tu clave se guarda en el almacenamiento de este navegador. Úsala solo en tu dispositivo, evita equipos compartidos y guarda respaldos JSON de tus recetas.';
$('keyCard')?.appendChild(warn);
if(hasKey()){text('keyStatus','✓ Clave configurada en este dispositivo');$('keyCard')?.classList.add('hidden')}
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
