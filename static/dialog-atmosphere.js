import {mountAmbientSparks} from './effects.js';

// Native dialogs keep focus and pointer isolation; their atmosphere never takes input.
export function mountDialogAtmosphere(dialog) {
  const layer=document.createElement('div');
  layer.className='dialog-atmosphere';
  layer.setAttribute('aria-hidden','true');
  const canvas=document.createElement('canvas');
  canvas.className='dialog-ambient';
  const frost=document.createElement('div');
  frost.className='dialog-frost';
  layer.append(canvas,frost);
  dialog.prepend(layer);
  const stop=mountAmbientSparks(canvas);
  return ()=>{stop();layer.remove();};
}
