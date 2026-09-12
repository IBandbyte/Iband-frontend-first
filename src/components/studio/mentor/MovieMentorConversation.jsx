import React, { useEffect, useMemo, useRef, useState } from "react";
import MovieMentorConversationCore from "./MovieMentorConversationCore.jsx";
import MovieMentorCommercialSurface from "./MovieMentorCommercialSurface.jsx";
import createMovieMentorStudioIdentityRuntime from "./MovieMentorStudioIdentityRuntime.js";
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
 * When a sibling retires that pending turn, reread the durable project
 * conversation so the settled mentor response becomes visible in this tab too.
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
  const [settledConversationMessages,setSettledConversationMessages]=useState(null);
  const visibleMessages=settledConversationMessages||props?.messages;
  const pendingAlreadyVisible=Boolean(pendingTurn&&Array.isArray(visibleMessages)&&visibleMessages.some(message=>message?.role==="creator"&&message?.text===pendingTurn.message));

  useEffect(()=>{
    setPendingTurn(readCurrentPendingTurn());
    setSettledConversationMessages(null);
    if(typeof globalThis?.addEventListener!=="function"||typeof globalThis?.removeEventListener!=="function")return undefined;
    const refreshPendingTurn=()=>{
      const nextPendingTurn=readCurrentPendingTurn();
      setPendingTurn((currentPendingTurn)=>{
        if(currentPendingTurn&&!nextPendingTurn&&props?.projectId){
          const recoveryRuntime=createMovieMentorStudioIdentityRuntime();
          const continuation=recoveryRuntime.resumeProjectConversation(props.projectId);
          setSettledConversationMessages(continuation.messages||[]);
        }
        return nextPendingTurn;
      });
    };
    globalThis.addEventListener("storage",refreshPendingTurn);
    return()=>globalThis.removeEventListener("storage",refreshPendingTurn);
  },[identity,props?.projectId]);

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
  return <MovieMentorConversationCore {...props} messages={visibleMessages} renderBelowConversation={renderBelowConversation}/>;
}
