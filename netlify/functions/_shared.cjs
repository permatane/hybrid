'use strict';
const crypto = require('node:crypto');
const ORIGIN_DEFAULT = 'https://vectorichqc2026.netlify.app';
const COOKIE_SESSION = '__Host-rivis_session';
const COOKIE_STATE = '__Host-rivis_oauth_state';
const COOKIE_MAX_AGE = 30 * 24 * 3600;
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

function baseUrl() {
  const value = (process.env.RIVIS_BASE_URL || ORIGIN_DEFAULT).replace(/\/$/, '');
  const uri = new URL(value);
  if (uri.protocol !== 'https:' && !(uri.hostname === 'localhost' && uri.protocol === 'http:')) {
    throw new Error('RIVIS_BASE_URL must be HTTPS (or localhost for testing)');
  }
  return uri.origin;
}
function redirectUri() {return baseUrl() + '/rivis-cloud/callback';}
function cookie(name, value, seconds) {
  const secure = baseUrl().startsWith('https:') ? '; Secure' : '';
  const maxAge = typeof seconds === 'number' ? '; Max-Age=' + seconds : '';
  return name + '=' + encodeURIComponent(value) + '; Path=/; HttpOnly; SameSite=Lax' + secure + maxAge;
}
function parseCookie(event, name) {
  const raw = event.headers?.cookie || event.headers?.Cookie || '';
  const found = raw.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  if (!found) return null;
  try {return decodeURIComponent(found.slice(name.length + 1));} catch (_) {return null;}
}
function sessionKey() {
  const secret = process.env.RIVIS_SESSION_SECRET;
  if (!secret) throw new Error('RIVIS_SESSION_SECRET is not configured');
  const key = Buffer.from(secret, 'base64');
  if (key.length !== 32) throw new Error('RIVIS_SESSION_SECRET must be 32 random bytes encoded as base64');
  return key;
}
function seal(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
}
function unseal(value) {
  try {
    if (!value) return null;
    const bytes = Buffer.from(value, 'base64url');
    if (bytes.length < 29) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', sessionKey(), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const plain = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
    const session = JSON.parse(plain.toString('utf8'));
    return session?.refresh_token || session?.access_token ? session : null;
  } catch (_) {return null;}
}
function readSession(event) {return unseal(parseCookie(event, COOKIE_SESSION));}
function sessionCookie(session) {return cookie(COOKIE_SESSION, seal(session), COOKIE_MAX_AGE);}
function json(statusCode, object, headers={}) {
  return {statusCode, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers},body:JSON.stringify(object)};
}
function redirect(location, cookies=[]) {
  return {statusCode:302,multiValueHeaders:{'Set-Cookie':cookies},headers:{Location:location,'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer'},body:''};
}
function onlyGet(event) {return event.httpMethod==='GET';}
function tokenEnv() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  return {clientId: process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET};
}
async function googleToken(params) {
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params)});
  const data=await response.json();
  if (!response.ok || data.error) throw new Error('Google token exchange failed: '+(data.error || response.status));
  return data;
}
async function activeSession(event) {
  const s=readSession(event);
  if (!s) return {error:'not_connected'};
  if (s.expires_at && s.expires_at > Date.now()+60_000 && s.access_token) return {session:s};
  if (!s.refresh_token) return {error:'needs_reconnect'};
  try {
    const {clientId,clientSecret}=tokenEnv();
    const res=await googleToken({client_id:clientId,client_secret:clientSecret,refresh_token:s.refresh_token,grant_type:'refresh_token'});
    const updated={...s,access_token:res.access_token,expires_at:Date.now()+(Number(res.expires_in)||3600)*1000};
    return {session:updated,newCookie:sessionCookie(updated)};
  }catch(_){return {error:'needs_reconnect'};}
}
function validFileId(id) {return typeof id==='string' && /^[A-Za-z0-9_-]{8,128}$/.test(id);}
function normalizeError(error) {
  return error?.message?.includes('not configured') || error?.message?.includes('Missing GOOGLE') ? 'Server configuration incomplete' : 'Request failed';
}
module.exports={baseUrl,redirectUri,cookie,parseCookie,sessionKey,seal,unseal,readSession,sessionCookie,json,redirect,onlyGet,tokenEnv,googleToken,activeSession,validFileId,normalizeError,COOKIE_SESSION,COOKIE_STATE,DRIVE_SCOPE};
