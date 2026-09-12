import React, { useEffect, useMemo, useRef, useState } from "react";
import MovieMentorConversationCore from "./MovieMentorConversationCore.jsx";
import MovieMentorCommercialSurface from "./MovieMentorCommercialSurface.jsx";
import { readPendingTurn } from "./MovieMentorTurnIdentity.js";

/**
 * Live Movie Mentor conversation composition.
 * The core remains the creator-facing Mentor surface; commerce is a sibling
 * presentation surface and never becomes part of Mentor reasoning authority.
 *
 * Pending-turn recovery rule:
 * durable pending transport reality is creator-visible reality. Restore it on
 * reload and observe same-origin storage changes so an already-open sibling tab
 * sees the exact unresolved creator action before another send is attempted.
 * When that pending reality is retired by a sibling tab, ask the workspace to
 * refresh the durable conversation that now owns the settled creator action.
 */
export default function MovieMentorConversation(props){
  const suppliedBelow=props?.renderBelowConversation;
  const recoveryDelivered=useRef(null);
  const identity=useMemo(()=>({
    projectId:props?.projectId,
    creatorSessionId:props?.creatorSessionId,
  }),[props?.projectId,props?.creatorSessionId]);
  const readCurrentPendingTurn=()=>readPendingTurn({identity,storage:globalThis?.localStorage});
  const [pendingTurn,setPendingTurn]=useState(()=>readCurrentPendingTurn());
  const pendingAlreadyVisible=Boolean(pendingTurn&&Array.isArray(props?.messages)&&props.messages.some(message=>message?.role==="creator"&&message?.text===pendingTurn.message));

  useEffect(()=>{
    setPendingTurn(readCurrentPendingTurn());
    if(typeof globalThis?.addEventListener!=="function"||typeof globalThis?.removeEventListener!=="function")return undefined;
    const refreshPendingTurn=()=>{
      const previousPendingTurn=readCurrentPendingTurn();
      setPendingTurn((currentPendingTurn)=>{
        if(currentPendingTurn&&!previousPendingTurn)props?.onConversationStorageChange?.();
        return previousPendingTurn;
      });
    };
    globalThis.addEventListener("storage",refreshPendingTurn);
    return()=>globalThis.removeEventListener("storage",refreshPendingTurn);
  },[identity,props?.onConversationStorageChange]);

  useEffect(()=>{
    if(!pendingTurn){
      recoveryDelivered.current=null;
      return;
    }
    if(pendingAlreadyVisible){
      recoveryDelivered.current=pendingTurn.creatorTurnId;
      return;
    }
    if(recoveryDelivered.current===pendingTurn.creatorTurnId||typeof props?.onSendMessage!=="function")return;
    recoveryDelivered.current=pendingTurn.creatorTurnId;
    props.onSendMessage({
      id:`pending-creator-turn:${pendingTurn.creatorTurnId}`,
      role:"creator",
      type:"text",
      behaviour:"discuss",
      text:pendingTurn.message,
      createdAt:null,
      metadata:{
        recoveredPendingCreatorAction:true,
        pendingCreatorTurnId:pendingTurn.creatorTurnId,
        retryRequiresSameMessage:true,
      },
    });
  },[pendingTurn,pendingAlreadyVisible,props?.onSendMessage]);

  const renderBelowConversation=()=> <>{typeof suppliedBelow==="function"?suppliedBelow():null}<MovieMentorCommercialSurface /></>;
  return <MovieMentorConversationCore {...props} renderBelowConversation={renderBelowConversation}/>;
}
