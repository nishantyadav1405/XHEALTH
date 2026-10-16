export type GrantLike={doctor_id:string;organization_id:string;expires_at:string;revoked_at:string|null}|null|undefined;
export function isGrantActive(grant:GrantLike,now=Date.now()):boolean{return !!grant&&!grant.revoked_at&&Number.isFinite(Date.parse(grant.expires_at))&&Date.parse(grant.expires_at)>now;}
export function isGrantAuthorized(grant:GrantLike,doctorId:string,organizationId:string|null,now=Date.now()):boolean{return isGrantActive(grant,now)&&grant!.doctor_id===doctorId&&grant!.organization_id===organizationId;}
