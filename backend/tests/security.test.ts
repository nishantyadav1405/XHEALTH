import {describe,it,expect} from 'vitest';
import {isGrantActive,isGrantAuthorized} from '../src/security.js';
const grant={doctor_id:'doctor-a',organization_id:'org-a',expires_at:'2099-01-01T00:00:00Z',revoked_at:null};
describe('consent authorization',()=>{
 it('allows intended doctor and organization',()=>expect(isGrantAuthorized(grant,'doctor-a','org-a',Date.parse('2026-01-01'))).toBe(true));
 it('rejects another doctor',()=>expect(isGrantAuthorized(grant,'doctor-b','org-a')).toBe(false));
 it('rejects another organization',()=>expect(isGrantAuthorized(grant,'doctor-a','org-b')).toBe(false));
 it('rejects revoked grants',()=>expect(isGrantActive({...grant,revoked_at:'2026-01-01T00:00:00Z'})).toBe(false));
 it('rejects expired grants',()=>expect(isGrantActive({...grant,expires_at:'2020-01-01T00:00:00Z'})).toBe(false));
 it('rejects missing grants',()=>expect(isGrantActive(null)).toBe(false));
});
