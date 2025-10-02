import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => console.log("pong from preload"),
});
