/** 대시보드에서 복사한 연결 URL의 비밀번호에 `#`·`&`·`@`가 있어도 URL로 읽히게 한다. */
export function encodeConnectionPassword(url: string): string {
  const schemeEnd = url.indexOf("://") + 3;
  const credentialsEnd = url.lastIndexOf("@");
  if (credentialsEnd < schemeEnd) return url;

  const credentials = url.slice(schemeEnd, credentialsEnd);
  const passwordStart = credentials.indexOf(":");
  if (passwordStart === -1) return url;

  const user = credentials.slice(0, passwordStart);
  const password = credentials.slice(passwordStart + 1);
  return `${url.slice(0, schemeEnd)}${user}:${encodeURIComponent(decodeOnce(password))}${url.slice(credentialsEnd)}`;
}

function decodeOnce(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
