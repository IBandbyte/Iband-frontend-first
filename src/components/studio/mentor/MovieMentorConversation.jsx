import React from "react";
import MovieMentorConversationCore from "./MovieMentorConversationCore.jsx";
import MovieMentorCommercialSurface from "./MovieMentorCommercialSurface.jsx";

/**
 * Live Movie Mentor conversation composition.
 * The core remains the creator-facing Mentor surface; commerce is a sibling
 * presentation surface and never becomes part of Mentor reasoning authority.
 */
export default function MovieMentorConversation(props){
  const suppliedBelow=props?.renderBelowConversation;
  const renderBelowConversation=()=> <>{typeof suppliedBelow==="function"?suppliedBelow():null}<MovieMentorCommercialSurface /></>;
  return <MovieMentorConversationCore {...props} renderBelowConversation={renderBelowConversation}/>;
}
