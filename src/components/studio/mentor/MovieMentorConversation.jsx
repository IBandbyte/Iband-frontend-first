import React, { useEffect, useMemo, useRef, useState } from "react";
import MovieMentorConversationCore from "./MovieMentorConversationCore.jsx";
import MovieMentorCommercialSurface from "./MovieMentorCommercialSurface.jsx";
import createMovieMentorStudioIdentityRuntime from "./MovieMentorStudioIdentityRuntime.js";
import { readPendingTurn, clearPendingTurn } from "./MovieMentorTurnIdentity.js";

/** Live Movie Mentor composition. Durable pending transport reality is creator-visible reality. */
export default function MovieMentorConversation(props){
  const suppliedBelow=props?.renderBelowConversation;
  const recoveryDelivered=useRef(null);
  const settledAgainstMessages=useRef(null);
  const identity=useMemo(()=>({projectId:props?.projectId,creatorSessionId:props?.creatorSessionId}),[props?.projectId,props?.creatorSessionId]);
  const readCurrentPendingTurn=()=>readPendingTurn({identity,storage:globalThis?.localStorage});
  const [pendingTurn,setPendingTurn]=useState(()=>readCurrentPendingTurn());
  const [settledConversationMessages,setSettledConversationMessages]=useState(null);
  const visibleMessages=settledConversationMessages||props?.messages;
  const pendingAlreadyVisible=Boolean(pendingTurn&&Array.isArray(visibleMessages)&&visibleMessages.some(message=>message?.role==="creator"&&message?.text===pendingTurn.message));
  const publishedPendingSettlement=Boolean(pendingTurn&&Array.isArray(props?.messages)&&props.messages.some(message=>message?.role==="mentor"&&message?.metadata?.backendMetadata?.creatorTurnId===pendingTurn.creatorTurnId));

  useEffect(()=>{
    if(!pendingTurn||!publishedPendingSettlement)return;
    clearPendingTurn({identity,creatorTurnId:pendingTurn.creatorTurnId,storage:globalThis?.localStorage});
    setPendingTurn(readCurrentPendingTurn());
  },[identity,pendingTurn,publishedPendingSettlement]);

  useEffect(()=>{
    setPendingTurn(readCurrentPendingTurn());
    settledAgainstMessages.current=null;
    setSettledConversationMessages(null);
    if(typeof globalThis?.addEventListener!=="function"||typeof globalThis?.removeEventListener!=="function")return undefined;
    const refreshPendingTurn=()=>{
      const nextPendingTurn=readCurrentPendingTurn();
      setPendingTurn((currentPendingTurn)=>{
        if(currentPendingTurn&&!nextPendingTurn&&props?.projectId){
          const recoveryRuntime=createMovieMentorStudioIdentityRuntime();
          const continuation=recoveryRuntime.resumeProjectConversation(props.projectId);
          settledAgainstMessages.current=props?.messages;
          setSettledConversationMessages(continuation.messages||[]);
        }
        return nextPendingTurn;
      });
    };
    globalThis.addEventListener("storage",refreshPendingTurn);
    return()=>globalThis.removeEventListener("storage",refreshPendingTurn);
  },[identity,props?.projectId,props?.messages]);

  useEffect(()=>{
    if(settledConversationMessages&&props?.messages!==settledAgainstMessages.current){
      settledAgainstMessages.current=null;
      setSettledConversationMessages(null);
    }
  },[props?.messages,settledConversationMessages]);

  useEffect(()=>{
    if(!pendingTurn){recoveryDelivered.current=null;return;}
    if(pendingAlreadyVisible){recoveryDelivered.current=pendingTurn.creatorTurnId;return;}
    if(recoveryDelivered.current===pendingTurn.creatorTurnId||typeof props?.onSendMessage!=="function")return;
    recoveryDelivered.current=pendingTurn.creatorTurnId;
    props.onSendMessage({
      id:`pending-creator-turn:${pendingTurn.creatorTurnId}`,
      role:"creator",type:"text",behaviour:"discuss",text:pendingTurn.message,createdAt:null,
      metadata:{recoveredPendingCreatorAction:true,pendingCreatorTurnId:pendingTurn.creatorTurnId,retryRequiresSameMessage:true},
    });
  },[pendingTurn,pendingAlreadyVisible,props?.onSendMessage]);

  const publishMessage=(message)=>{
    if(typeof props?.onSendMessage!=="function")return;
    const creatorTurnId=message?.role==="mentor"?message?.metadata?.backendMetadata?.creatorTurnId:null;
    const settlementAlreadyPublished=Boolean(creatorTurnId&&Array.isArray(props?.messages)&&props.messages.some(existing=>existing?.role==="mentor"&&existing?.metadata?.backendMetadata?.creatorTurnId===creatorTurnId));
    if(settlementAlreadyPublished)return;
    props.onSendMessage(message);
  };
  const renderBelowConversation=()=> <>{typeof suppliedBelow==="function"?suppliedBelow():null}<MovieMentorCommercialSurface /></>;
  return <MovieMentorConversationCore {...props} messages={visibleMessages} onSendMessage={publishMessage} renderBelowConversation={renderBelowConversation}/>;
}
