export async function onRequest(context:any) {

  const url = new URL(context.request.url);

  const backendUrl =
    "https://jib-be-jib-api.emadg-dev.workers.dev";

  const target =
    backendUrl +
    url.pathname +
    url.search;


  const response = await fetch(target, {
    method: context.request.method,
    headers: context.request.headers,
    body:
      context.request.method === "GET" ||
      context.request.method === "HEAD"
        ? undefined
        : context.request.body
  });


  const headers = new Headers(response.headers);


  return new Response(response.body,{
    status: response.status,
    headers
  });
}