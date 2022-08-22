#!/usr/bin/env node
import e from "express";

import s from "cors";

import t from "body-parser";

import { readFile as r, mkdir as a, writeFile as o, stat as i } from "fs/promises";

import { existsSync as n } from "fs";

import c from "node-fetch";

const l = async (e, s) => {
  const t = await r(e, {
    encoding: "utf8"
  });
  return new Promise((e => e(s && t ? JSON.parse(t) : t)));
}, {appConfig: u} = await l(`${process.cwd()}/package.json`, !0), p = u, w = `${process.cwd()}/localStorage`, m = {
  Accept: "*/*",
  "content-type": "application/json"
}, d = {
  CREATE_TOKEN: "createToken",
  CREATE_BENEFICIARY: "createBeneficiary",
  CREATE_ELIGIBILITY: "createEligibility"
}, E = p.wassel.providerId, f = {
  baseAPiUrl: "https://api.stg-eclaims.waseel.com",
  resourceNames: {
    [d.CREATE_TOKEN]: "oauth/authenticate",
    [d.CREATE_BENEFICIARY]: `beneficiaries/providers/${E}`,
    [d.CREATE_ELIGIBILITY]: `eligibilities/providers/${E}/request`
  },
  HTTP_STATUS_CODE: {
    200: "success",
    201: "success",
    400: "error, invalid data",
    401: "error, invalid access token",
    403: "error, the request is missing required params or the user does not have access to this service",
    404: "error, the request not found"
  }
}, h = e => {
  let s = !1;
  try {
    s = !!n(e) && e;
  } catch (e) {
    s = !1;
  }
  return s;
}, y = async e => i(e).then((() => e)).catch((() => !1)), {localStorageFilePaths: T} = p, g = e => {
  if (!T.includes(e)) throw new Error(`the file \`${e}\` must be set in \`localStorageFilePaths\``);
}, N = async ({fileName: e = "", key: s}) => {
  const t = `${e}.json`;
  g(t);
  const r = `${w}/${t}`;
  if (await y(r)) {
    const e = await l(r, !0) || {};
    return s ? e[s] : e;
  }
  return {};
}, {baseAPiUrl: A, resourceNames: $, HTTP_STATUS_CODE: C} = f, {CREATE_TOKEN: I} = d, S = async ({resourceName: e, ...s}) => {
  const t = await (async () => {
    if (e === I) return m;
    const {access_token: s, token_type: t} = await N({
      fileName: "tokens",
      key: "wassel"
    }) || {};
    return {
      ...m,
      Authorization: `${t || "Bearer"} ${s}`
    };
  })();
  return await (({baseAPiUrl: e, resourceName: s, requestMethod: t = "POST", requestHeaders: r = m, body: a, transformApiResults: o, httpStatusCodes: i}) => new Promise((async n => {
    const l = `${e}${s ? `/${s}` : ""}`;
    try {
      const e = await c(l, {
        method: t,
        headers: r,
        ...a ? {
          body: JSON.stringify(a)
        } : null
      });
      if (o) return n(await o(e));
      const {status: s, headers: u} = e, p = i[s], w = "success" === p, m = u.get("content-type") || "", d = await (async (e, s) => e.includes("application/json") ? await s.json() : e.includes("application/text") ? await s.text() : {})(m, e);
      n({
        isSuccess: w,
        error: w ? "" : p,
        result: d
      });
    } catch (e) {
      console.log("error", e), n({
        isSuccess: !1,
        error: "something went wrong",
        result: void 0
      });
    }
  })))({
    baseAPiUrl: A,
    resourceName: $[e],
    requestHeaders: t,
    httpStatusCodes: C,
    ...s
  });
}, {CREATE_TOKEN: _} = d, b = {
  fileName: "tokens",
  key: "wassel"
}, {CREATE_ELIGIBILITY: P, CREATE_BENEFICIARY: R} = d;

const {serverPort: k} = p;

await (async () => {
  const {localStorageFilePaths: e} = p;
  if (!e || !e.length) throw new Error("localStorageFilePaths must contain at least one file");
  const s = e.map((e => `${w}/${e}`)).filter((e => !h(e)));
  if (s.length) {
    h(w) || await a(w);
    const e = s.map((e => o(e, JSON.stringify({}))));
    await Promise.all(e);
  }
})();

const v = e();

v.use(s()), v.use(t.urlencoded({
  extended: !0
})), v.use(t.json()), v.use(t.text()), v.use(t.raw()), v.use((async (e, s, t) => {
  const {originalUrl: r} = e;
  if (/wassel/.test(r)) {
    const e = await N(b), {expires_in: s} = e || {};
    let r = !s;
    if (s && (r = new Date(s).getTime() <= (new Date).getTime()), r) {
      const {wassel: {userName: e, password: s}} = p, {isSuccess: r, result: a, error: i} = await S({
        resourceName: _,
        body: {
          username: e,
          password: s
        }
      });
      return i && !r ? (console.error("error", i), t(i)) : (await (async ({fileName: e = "", key: s, value: t}) => {
        const r = `${e}.json`;
        g(r);
        const a = `${w}/${r}`;
        if (!await y(a)) return;
        const i = {
          ...await l(a, !0) || null,
          [s]: t
        };
        await o(a, JSON.stringify(i, null, 2));
      })({
        ...b,
        value: a
      }), t());
    }
  }
  t();
})), v.use("/wassel", (e => async (s, t, r) => {
  const {baseUrl: a} = s;
  [ R, P ].forEach((s => {
    e.post(`${a}/${s}`, (async (e, t, r) => {
      const {body: a} = e, o = await S({
        resourceName: s,
        body: a
      });
      t.status(200), t.header("Content-type", "application/json"), t.send(o), r();
    }));
  })), r();
})(v)), v.listen(k, (() => console.log(`app is running on http://localhost:${k}`)));
