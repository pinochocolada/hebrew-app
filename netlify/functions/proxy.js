exports.handler = async function(event) {
  const url = event.queryStringParameters.url;
  if (!url) return { statusCode: 400, body: 'No URL' };

  const response = await fetch(url);
  const text = await response.text();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Access-Control-Allow-Origin': '*'
    },
    body: text
  };
};