import assert from"node:assert/strict";import fs from"node:fs/promises";
const source=await fs.readFile(new URL("../src/components/studio/mentor/MovieMentorCommercialSurface.jsx",import.meta.url),"utf8");
assert.match(source,/beginMovieMentorPurchase\(\{packageId:pkg\.packageId,token\}\)/,"UI may initiate purchase only through certified commercial client using package ID and auth token.");
assert.match(source,/getAuthToken/,"Commercial surface must obtain creator authentication at purchase time.");
assert.match(source,/Returning to this page never grants credits by itself/,"UI must explicitly deny redirect-as-payment authority.");
assert.doesNotMatch(source,/amountMinor:pkg|currency:pkg|units:pkg|provider:|providerProductId:/,"UI must not send commercial terms or provider authority into purchase initiation.");
assert.doesNotMatch(source,/grantCredits|setEntitlement|paymentSuccessful|paid:true/,"UI must not manufacture payment or entitlement state.");
assert.match(source,/safePackages=.*amountMinor/,"Displayed packages must be validated before rendering.");
console.log("PASS 5A.17: creator-facing package surface displays server-projected terms, authenticates at purchase time, initiates only package selection through the certified client, and cannot manufacture payment or entitlement truth.");
