import React, { useEffect, useMemo, useRef } from "react";
import MovieMentorConversationCore from "./MovieMentorConversationCore.jsx";
import MovieMentorCommercialSurface from "./MovieMentorCommercialSurface.jsx";
import { readPendingTurn } from "./MovieMentorTurnIdentity.js";

/**
 * Live Movie Mentor conversation composition.
 * The core remains the creator-facing Mentor surface; commerce is a sibling
 * presentation surface and never becomes part of Mentor reasoning authority.
 *
 * Reload recovery rule:
 * the transport's durable pending turn is also creator-visible reality. When a
 * reload occurs after an uncertain send, restore that creator action into the
 * conversation surface and parent identity runtime before another send occurs.
 * The transport still owns creatorTurnId and refuses a different message while
 * that outcome is unresolved.
 */
export default function MovieMentorConversation(props){
  const suppliedBelow=props?.renderBelowConversation;
  const recoveryDelivered=useRef(false);
  const pendingTurn=useMemo(()=>readPendingTurn({
    identity:{projectId:props?.projectId,creatorSessionId:props?.creatorSessionId},
    storage:globalThis?.localStorage,
  }),[props?.projectId,props?.creatorSessionId]);
  const pendingAlreadyVisible=Boolean(pendingTurn&&Array.isArray(props?.messages)&&props.messages.some(message=>message?.role==="creator"&&message?.text===pendingTurn.message));

  useEffect(()=>{
    if(!pendingTurn||pendingAlreadyVisible||recoveryDelivered.current||typeof props?.onSendMessage!=="function")return;
    recoveryDelivered.current=true;
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
