import { API_BASE } from "../../../services/api";
const MOVIE_MENTOR_SYNTHESIS_PROVIDER_VERSION="1.0.0"; const DEFAULT_ENDPOINT="/api/movie-mentor-synthesis/synthesize";
function cleanString(v){return typeof v==="string"?v.trim():"";}
function createMovieMentorSynthesisProvider({apiBase=API_BASE,endpoint=DEFAULT_ENDPOINT,fetchImpl=globalThis.fetch}={}){
 const url=`${cleanString(apiBase).replace(/\/$/,"")}${endpoint}`;
 async function synthesize(input,{signal=null}={}){if(typeof fetchImpl!=="function")throw new Error("Movie Mentor synthesis provider requires fetch.");const response=await fetchImpl(url,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(input||{}),signal});const text=await response.text();let body=null;try{body=text?JSON.parse(text):null;}catch{body={raw:text};}if(!response.ok){const e=new Error(body?.message||`Movie Mentor synthesis failed (${response.status}).`);e.status=response.status;e.code=body?.code||"MOVIE_MENTOR_SYNTHESIS_FAILED";e.body=body;throw e;}return {...body,metadata:{...(body?.metadata||{}),synthesisProviderVersion:MOVIE_MENTOR_SYNTHESIS_PROVIDER_VERSION}};}
 return {type:"movie-mentor-synthesis-backend",version:MOVIE_MENTOR_SYNTHESIS_PROVIDER_VERSION,endpoint,synthesize};
}
export {MOVIE_MENTOR_SYNTHESIS_PROVIDER_VERSION,DEFAULT_ENDPOINT,createMovieMentorSynthesisProvider}; export default createMovieMentorSynthesisProvider;
