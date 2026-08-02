import { createContext, useContext } from "react";

/** Informa ao player quando o usuário já respondeu o exercício atual. */
export const RespondidoContext = createContext<((v: boolean) => void) | null>(null);

export function useSetRespondido() {
  return useContext(RespondidoContext);
}
