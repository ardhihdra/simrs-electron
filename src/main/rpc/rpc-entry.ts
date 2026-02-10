import { registerIpcRouter } from '@mavolostudio/electron-rpc'
import { createContext } from './context'
import { rpcRouter } from './procedure'

registerIpcRouter('rpc', rpcRouter, createContext)
