const MOVIE_SPECIALIST_AGENT_PROVIDER_VERSION = "1.0.0";
const DEFAULT_BACKEND_URL = "https://iband-backend-first-1.onrender.com";

function cleanString(value){return typeof value === "string" ? value.trim() : "";}
function cloneValue(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch{return value;}}

function createMovieSpecialistAgentProvider({baseUrl=DEFAULT_BACKEND_URL,fetchImpl=globalThis.fetch}={}){
  const endpoint=`${cleanString(baseUrl).replace(/\/$/,"")}/api/movie-mentor-specialists/execute`;

  async function executePlan(plan,{signal=null}={}){
    if(!plan||!Array.isArray(plan.workOrders)||plan.workOrders.length===0){return {status:"skipped",contributions:[],skipped:[],failures:[],metadata:{providerVersion:MOVIE_SPECIALIST_AGENT_PROVIDER_VERSION,reason:"no-work-orders"}};}
    if(typeof fetchImpl!=="function")throw new Error("Movie specialist provider requires fetch.");
    const response=await fetchImpl(endpoint,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({plan:cloneValue(plan)}),signal});
    const text=await response.text(); let body=null;
    try{body=text?JSON.parse(text):null;}catch{body={raw:text};}
    if(!response.ok){const error=new Error(body?.message||`Movie specialist gateway failed (${response.status}).`);error.status=response.status;error.code=body?.code||"MOVIE_SPECIALIST_GATEWAY_FAILED";error.body=body;throw error;}
    return {...body,metadata:{...(body?.metadata||{}),providerVersion:MOVIE_SPECIALIST_AGENT_PROVIDER_VERSION,endpoint}};
  }

  return {version:MOVIE_SPECIALIST_AGENT_PROVIDER_VERSION,endpoint,executePlan};
}

export {MOVIE_SPECIALIST_AGENT_PROVIDER_VERSION,createMovieSpecialistAgentProvider};
export default createMovieSpecialistAgentProvider;
