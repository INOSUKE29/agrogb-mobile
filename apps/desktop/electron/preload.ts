import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // APIs seguras para comunicação entre React e Sistema Operacional
})
