export async function onRequest(context: EventContext<any, any, any>) {

  const url = new URL(context.request.url);

  const backendUrl =
    "https://jib-be-jib-api.emadg-dev.workers.dev";

  const target =
    backendUrl + url.pathname + url.search;


  const headers = new Headers(context.request.headers);

  // جلوگیری از مشکل origin
  headers.delete("origin");


  const response = await fetch(target, {
    method: context.request.method,
    headers,
    body:
      context.request.method === "GET" ||
      context.request.method === "HEAD"
        ? undefined
        : await context.request.text()
  });


  const newHeaders = new Headers(response.headers);


  // مهم:
  // cookie را rewrite می‌کنیم
  const setCookie = response.headers.get("set-cookie");

  if (setCookie) {
    newHeaders.set(
      "set-cookie",
      setCookie
        .replace("SameSite=None", "SameSite=Lax")
        .replace("Secure", "")
    );
  }


  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
}